from django.core.mail import send_mail
from django.db.models import Sum
from django.db.models.functions import ExtractYear, TruncMonth
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.timezone import now
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

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
        return Invoice.objects.filter(user=self.request.user)

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
        queryset = self.get_queryset()
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

    @action(detail=False, methods=['get'], url_path='statistics')
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

        # Vytvoření zprávy do uživatelské schránky
        UserMessage.objects.create(
            user=invoice.user,
            title="Faktura zaplacena",
            content=f"Faktura č. {invoice.invoiceNumber} byla označena jako zaplacená."
        )

        return Response({"success": "Faktura označena jako zaplacená."}, status=status.HTTP_200_OK)


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
