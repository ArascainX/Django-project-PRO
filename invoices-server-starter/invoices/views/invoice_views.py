from datetime import timezone
from django.core.mail import send_mail
from django.db.models import Sum
from django.db.models.functions import ExtractYear, TruncMonth
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.timezone import now
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Invoice, Subscription, UserMessage
from ..serializers import InvoiceSerializer


def user_has_active_subscription(user):
    try:
        return Subscription.objects.get(user=user).is_active()
    except Subscription.DoesNotExist:
        return False


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Invoice.objects.filter(user=self.request.user, is_deleted=False)

    def create(self, request, *args, **kwargs):
        user = request.user
        is_subscriber = user_has_active_subscription(user)

        if not is_subscriber:
            invoice_count = Invoice.objects.filter(user=user).count()
            if invoice_count >= 10:
                return Response(
                    {"detail": "Limit 10 faktur pro bezplatný účet."},
                    status=status.HTTP_403_FORBIDDEN
                )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def filter(self, request):
        queryset = self.get_queryset().filter(is_cancelled=False, is_correction=False)
        params = request.query_params

        if buyer_id := params.get('buyerID'):
            queryset = queryset.filter(buyer__id=buyer_id)

        if seller_id := params.get('sellerID'):
            queryset = queryset.filter(seller__id=seller_id)

        if product := params.get('product'):
            queryset = queryset.filter(product__icontains=product)

        if min_price := params.get('minPrice'):
            queryset = queryset.filter(price__gte=min_price)

        if max_price := params.get('maxPrice'):
            queryset = queryset.filter(price__lte=max_price)

        if name := params.get('name'):
            queryset = queryset.filter(
                seller__name__icontains=name
            ) | queryset.filter(
                buyer__name__icontains=name
            )

        if limit := params.get('limit'):
            queryset = queryset[:int(limit)]

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="statistics")
    def invoice_statistics(self, request):
        current_year = now().year

        all_invoices = self.get_queryset()
        current_year_sum = all_invoices.filter(issued__year=current_year).aggregate(Sum('price'))['price__sum'] or 0
        all_time_sum = all_invoices.aggregate(Sum('price'))['price__sum'] or 0
        invoice_count = all_invoices.count()

        return Response({
            "currentYearSum": float(current_year_sum),
            "allTimeSum": float(all_time_sum),
            "invoicesCount": invoice_count
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="monthly-summary")
    def monthly_summary(self, request):
        year_param = request.query_params.get("year", now().year)

        try:
            year = int(str(year_param).strip())
        except (ValueError, TypeError):
            return Response({"error": "Neplatný parametr roku."}, status=400)

        data = (
            self.get_queryset()
            .filter(issued__year=year)
            .annotate(month=TruncMonth("issued"))
            .values("month")
            .annotate(total=Sum("price"))
            .order_by("month")
        )

        result = [
            {
                "month": f"{item['month'].year}-{item['month'].month:02d}",
                "total": item["total"]
            }
            for item in data if item["month"]
        ]
        return Response(result)

    @action(detail=False, methods=["get"], url_path="yearly-summary")
    def yearly_summary(self, request):
        data = (
            self.get_queryset()
            .annotate(year=ExtractYear("issued"))
            .values("year")
            .annotate(total=Sum("price"))
            .order_by("year")
        )
        return Response([
            {"year": item["year"], "total": item["total"]} for item in data
        ])

    @action(detail=True, methods=["post"], url_path="mark-paid")
    def mark_paid(self, request, pk=None):
        invoice = self.get_object()
        invoice.paid = True
        invoice.save(update_fields=["paid"])

        UserMessage.objects.create(
            user=invoice.user,
            title="Faktura zaplacena",
            content=f"Faktura č. {invoice.invoiceNumber} byla označena jako zaplacená."
        )

        return Response({"success": "Faktura označena jako zaplacená."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel_invoice(self, request, pk=None):
        invoice = self.get_object()
        reason = request.data.get("reason", "").strip()

        if invoice.is_cancelled:
            return Response({"detail": "Faktura už je stornovaná."}, status=400)

        # Označení faktury jako stornované
        invoice.is_archived = True
        invoice.is_deleted = False
        invoice.is_cancelled = True
        invoice.cancellation_reason = reason
        invoice.note = (invoice.note or "") + f"\nSTORNO: {reason}"
        invoice.save()

        # Vytvoření dobropisu
        Invoice.objects.create(
            user=invoice.user,
            seller=invoice.buyer,
            buyer=invoice.seller,
            invoiceNumber=f"DOBROPIS-{invoice.invoiceNumber}",
            issued=now().date(),
            dueDate=invoice.dueDate,
            product=f"Dobropis k faktuře {invoice.invoiceNumber}",
            price=-invoice.price,
            vat=invoice.vat,
            paid=True,
            note=f"Dobropis k faktuře {invoice.invoiceNumber} (storno důvod: {reason})",
            is_archived=True,
            is_deleted=False,
            is_correction=True,
            cancelled_invoice=invoice
        )

        return Response({"message": "Faktura byla stornována a vytvořen dobropis."})

    @action(detail=True, methods=["post"], url_path="correct")
    def correct_invoice(self, request, pk=None):
        original = self.get_object()

        if not original.is_sent:
            return Response({"detail": "Nelze opravit neodeslanou fakturu."}, status=400)

        try:
            amount = float(request.data.get("amount", 0))
        except (ValueError, TypeError):
            return Response({"detail": "Zadejte platnou částku."}, status=400)

        if amount == 0:
            return Response({"detail": "Částka opravného dokladu nesmí být 0."}, status=400)

        correction = Invoice.objects.create(
            invoiceNumber=f"DOBROPIS-{original.invoiceNumber}",
            user=original.user,
            seller=original.seller,
            buyer=original.buyer,
            issued=now().date(),
            dueDate=original.dueDate,
            product=f"Oprava faktury č. {original.invoiceNumber}",
            price=amount,
            vat=original.vat,
            paid=True,
            note="Opravný daňový doklad",
            is_sent=True,
            is_accounted=True,
            is_correction=True,
            corrected_invoice=original,
        )

        return Response(InvoiceSerializer(correction).data, status=201)

    @action(detail=False, methods=["get"], url_path="archived")
    def archived_invoices(self, request):
        queryset = self.get_queryset().filter(is_cancelled=True, is_deleted=False)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="deleted")
    def deleted_invoices(self, request):
        queryset = self.get_queryset().filter(is_correction=True, is_deleted=False)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

# 📩 Email notifikace při označení jako zaplacená
@receiver(post_save, sender=Invoice)
def notify_user_invoice_paid(sender, instance, created, **kwargs):
    if not created and instance.paid and instance.user and instance.user.email:
        send_mail(
            'Faktura zaplacena',
            f'Vaše faktura č. {instance.invoiceNumber} byla označena jako zaplacená.',
            'no-reply@vasedomena.cz',
            [instance.user.email],
            fail_silently=False,
        )

# ♻️ Obnovit fakturu z archivu
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def restore_invoice(request, pk):
    try:
        invoice = Invoice.objects.get(pk=pk, user=request.user, is_archived=True)
        invoice.is_archived = False
        invoice.save()
        return Response({"message": "Faktura byla obnovena."})
    except Invoice.DoesNotExist:
        return Response({"error": "Faktura nenalezena nebo není archivovaná."}, status=404)

# ❌ Trvalé odstranění
@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def destroy_invoice(request, pk):
    try:
        invoice = Invoice.objects.get(pk=pk)
        invoice.delete()
        return Response({"message": "Faktura byla trvale odstraněna."})
    except Invoice.DoesNotExist:
        return Response({"error": "Faktura nebyla nalezena."}, status=404)

