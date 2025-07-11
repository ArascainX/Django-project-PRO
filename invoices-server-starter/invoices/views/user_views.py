from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from invoices.models import Subscription

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    user = request.user
    try:
        subscription = Subscription.objects.get(user=user)
        has_active_subscription = subscription.is_active()
    except Subscription.DoesNotExist:
        has_active_subscription = False

    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": f"{user.first_name} {user.last_name}".strip(),
        "has_active_subscription": has_active_subscription
    })
