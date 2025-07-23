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

from invoices.models import Subscription

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
        print(f"✅ Webhook event constructed: {event['type']}, ID: {event['id']}")
    except stripe.error.SignatureVerificationError as e:
        print(f"❌ Neplatný Stripe webhook podpis: {str(e)}")
        return HttpResponse(status=400)
    except Exception as e:
        print(f"❌ Chyba při konstrukci eventu: {str(e)}")
        return HttpResponse(status=400)

    if event['type'] == 'checkout.session.completed':
        print("✅ Webhook: checkout.session.completed přijat")
        session = event['data']['object']
        stripe_subscription_id = session.get("subscription")
        user_id = session.get("metadata", {}).get("user_id")

        print(f"🧪 Získaný subscription ID: {stripe_subscription_id}")
        print(f"🧪 Metadata user_id: {user_id}")
        print(f"🧪 Full session metadata: {session.get('metadata', {})}")

        if not stripe_subscription_id:
            print("❌ Chybí subscription ID")
            return HttpResponse(status=400)
        if not user_id:
            print("❌ Chybí user_id v metadatech")
            return HttpResponse(status=400)

        try:
            stripe_subscription = stripe.Subscription.retrieve(stripe_subscription_id)
            print(f"🔔 Načten Stripe subscription: {stripe_subscription}")

            # Získej current_period_end z items.data[0]
            if stripe_subscription.get('items') and stripe_subscription['items'].get('data') and len(stripe_subscription['items']['data']) > 0:
                period_end_timestamp = stripe_subscription['items']['data'][0].get('current_period_end')
                if not period_end_timestamp:
                    print("❌ Chybí current_period_end v items.data[0]")
                    return HttpResponse(status=400)
            else:
                print("❌ Žádné položky v subscription.items")
                return HttpResponse(status=400)

            period_end = datetime.fromtimestamp(period_end_timestamp).date()
            print(f"📆 Datum konce období: {period_end}")

            user = User.objects.get(id=user_id)
            Subscription.objects.update_or_create(
                user=user,
                defaults={
                    "stripe_subscription_id": stripe_subscription_id,
                    "current_period_end": period_end,
                    "active": True,
                    "cancelled": False,
                }
            )
            print(f"✅ Uloženo předplatné pro uživatele {user.username}")
            return HttpResponse(status=200)
        except User.DoesNotExist as e:
            print(f"⚠️ Uživatelský účet s ID {user_id} neexistuje: {str(e)}")
            return HttpResponse(status=400)
        except stripe.error.StripeError as e:
            print(f"⚠️ Stripe error: {str(e)}")
            return HttpResponse(status=500)
        except Exception as e:
            print(f"❌ Chyba při zpracování webhooku: {str(e)}")
            return HttpResponse(status=500)

    print(f"ℹ️ Ignorován nepodporovaný event: {event['type']}")
    return HttpResponse(status=200)


@api_view(['GET'])
def check_subscription_status(_, user_id):
    try:
        subscription = Subscription.objects.get(user_id=user_id)
        is_active = subscription.active and subscription.current_period_end >= date.today()
        return Response({"active": is_active})
    except Subscription.DoesNotExist:
        return Response({"active": False})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def subscription_status(request):
    user = request.user

    try:
        subscription = Subscription.objects.get(user=user)
        return Response({
            "active": subscription.active,
            "cancelled": subscription.cancelled,
            "current_period_end": subscription.current_period_end.strftime("%d.%m.%Y")
        })
    except Subscription.DoesNotExist:
        return Response({
            "active": False,
            "cancelled": False,
            "current_period_end": None
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
