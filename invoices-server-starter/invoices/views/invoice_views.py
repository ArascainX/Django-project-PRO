
from django.db.models import Sum
from rest_framework import viewsets, status
from rest_framework.response import Response
from ..serializers import InvoiceSerializer
from ..models import Invoice
from rest_framework.decorators import action
from django.db.models.functions import TruncMonth


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer


    @action(detail=False, methods=['get'])
    def filter(self, request):
        queryset = Invoice.objects.all()
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

        if limit := params.get('limit'):
            queryset = queryset[:int(limit)]

        if name := params.get('name'):
            queryset = queryset.filter(
                seller__name__icontains=name
            ) | queryset.filter(
                buyer__name__icontains=name
            )

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='statistics')
    def invoice_statistics(self, _):
        from django.utils.timezone import now
        current_year = now().year

        all_invoices = Invoice.objects.all()
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
        data = (
            Invoice.objects
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

