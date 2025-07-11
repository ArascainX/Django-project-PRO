from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import UserMessage
from ..serializers import UserMessageSerializer


class UserMessageViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint pro zobrazení zpráv (schránky) aktuálně přihlášeného uživatele.
    Umožňuje pouze čtení zpráv a označení zprávy jako přečtené.
    """
    serializer_class = UserMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Vrací zprávy aktuálního uživatele, seřazené od nejnovějších
        return UserMessage.objects.filter(user=self.request.user).order_by("-created")

    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        """
        Označí zprávu jako přečtenou (read=True).
        """
        try:
            message = self.get_queryset().get(pk=pk)
            message.read = True
            message.save(update_fields=["read"])
            return Response({"success": "Zpráva označena jako přečtená."}, status=status.HTTP_200_OK)
        except UserMessage.DoesNotExist:
            return Response({"error": "Zpráva nenalezena."}, status=status.HTTP_404_NOT_FOUND)
