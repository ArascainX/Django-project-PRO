# invoices/views/stripe_views.py
from datetime import date, datetime, timedelta
import stripe

from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from invoices.models import Subscription as DBSubscription, Subscription

stripe.api_key = settings.STRIPE_SECRET_KEY


@csrf_exempt
@api_view(['POST'])
def create_checkout_session(request):
    user = request.user
    if not user.is_authenticated:
        return Response({"error": "Nepřihlášený uživatel"}, status=401)

    try:
        checkout_session = stripe.checkout.Session.create(
            success_url=settings.DOMAIN + "/subscription/success",
            cancel_url=settings.DOMAIN + "/subscription/cancelled",
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{
                "price": settings.STRIPE_PRICE_ID,
                "quantity": 1,
            }],
            metadata={"user_id": str(user.id)},
        )
        return JsonResponse({"sessionId": checkout_session.id})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')
    endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except stripe.error.SignatureVerificationError:
        print("❌ Neplatný Stripe webhook podpis")
        return HttpResponse(status=400)
    except Exception as e:
        print(f"❌ Chyba při konstrukci eventu: {str(e)}")
        return HttpResponse(status=400)

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        stripe_subscription_id = session.get("subscription")
        user_id = session.get("metadata", {}).get("user_id")

        if not stripe_subscription_id:
            print("❌ checkout.session.completed event nemá subscription ID")
            return HttpResponse(status=400)

        stripe_subscription = stripe.Subscription.retrieve(stripe_subscription_id)
        print(f"🔔 Stripe subscription data: {stripe_subscription}")

        items = stripe_subscription.get('items', {}).get('data', [])
        if items and 'current_period_end' in items[0]:
            period_end_timestamp = items[0]['current_period_end']
        else:
            print("❌ Subscription nemá current_period_end v items[0]")
            return HttpResponse(status=400)

        period_end = datetime.fromtimestamp(period_end_timestamp).date()


        if user_id:
            try:
                user = User.objects.get(id=user_id)
                DBSubscription.objects.update_or_create(
                    user=user,
                    defaults={
                        "stripe_subscription_id": stripe_subscription_id,
                        "current_period_end": period_end,
                        "active": True,
                    }
                )
                print(f"✅ Uloženo předplatné pro uživatele {user.username}")
            except User.DoesNotExist:
                print(f"⚠️ Uživatelský účet s ID {user_id} neexistuje")
        else:
            print("⚠️ user_id není k dispozici – pravděpodobně testovací webhook")


    return HttpResponse(status=200)


@api_view(['GET'])
def check_subscription_status(_, user_id):
    try:
        subscription = DBSubscription.objects.get(user_id=user_id)
        is_active = subscription.active and subscription.current_period_end >= date.today()
        return Response({"active": is_active})
    except DBSubscription.DoesNotExist:
        return Response({"active": False})


@api_view(["GET"])
def subscription_status(request):
    global subscription
    user = request.user if request.user.is_authenticated else None
    if not user:
        return Response({"active": False})

    try:
        subscription = DBSubscription.objects.get(user=user)
        return Response({
            "active": subscription.active,
            "current_period_end": subscription.current_period_end.strftime("%d.%m.%Y")
        })
    except DBSubscription.DoesNotExist:
        return Response({
            "active": subscription.active,
            "cancelled": subscription.cancelled,
            "current_period_end": subscription.current_period_end.strftime("%d.%m.%Y")
        })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cancel_subscription(request):
    user = request.user
    try:
        subscription = Subscription.objects.get(user=user)

        # Pokus o zrušení přes Stripe
        try:
            stripe.Subscription.delete(subscription.stripe_subscription_id)
        except Exception as e:
            print(f"⚠️ Stripe cancellation failed: {e}")

        subscription.active = False
        subscription.cancelled = True
        subscription.save()

        return Response({
            "message": "Předplatné bylo zrušeno.",
            "active": False
        })
    except Subscription.DoesNotExist:
        return Response({"error": "Nemáš aktivní předplatné."}, status=400)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def renew_subscription(request):
    user = request.user
    try:
        sub = Subscription.objects.get(user=user)

        # Obnova = aktivace, odebrání cancelled flagu
        sub.active = True
        sub.cancelled = False
        sub.save()

        return Response({"message": "✅ Předplatné obnoveno."})
    except Subscription.DoesNotExist:
        return Response({"error": "Nemáte záznam o předplatném."}, status=400)


# ----------------------- Simulace předplatného pro testování ---------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def simulate_subscription(request):
    user = request.user

    Subscription.objects.update_or_create(
        user=user,
        defaults={
            "stripe_subscription_id": f"simulated_sub_{user.id}",
            "current_period_end": date.today() + timedelta(days=30),
            "active": True,
        }
    )

    return Response({
        "message": f"✅ Simulováno předplatné pro {user.username}",
        "active_until": (date.today() + timedelta(days=30)).isoformat()
    })
