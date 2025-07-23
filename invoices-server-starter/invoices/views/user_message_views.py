from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import UserMessage
from ..serializers import UserMessageSerializer


class UserMessageViewSet(viewsets.ModelViewSet):
    queryset = UserMessage.objects.all()
    serializer_class = UserMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Vrací zprávy aktuálního uživatele, seřazené od nejnovějších
        return UserMessage.objects.filter(user=self.request.user).order_by("-created")

    @action(detail=False, methods=['delete'])
    def delete_all(self, request):
        user_messages = UserMessage.objects.filter(user=request.user)
        count = user_messages.count()
        user_messages.delete()
        return Response({'deleted': count}, status=status.HTTP_204_NO_CONTENT)

class DeleteAllMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        UserMessage.objects.filter(user=request.user).delete()
        return Response({"detail": "Všechny zprávy byly smazány."}, status=status.HTTP_204_NO_CONTENT)

