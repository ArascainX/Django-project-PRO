from django.db.models import Sum
from rest_framework import viewsets, status
from rest_framework.response import Response
from ..serializers import InvoiceSerializer
from ..models import Invoice, Person
from rest_framework.decorators import action
from django.utils.timezone import now


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer

# Filtrace
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

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path=r'identification/(?P<ico>\w+)/sales')
    def sales_by_ico(self, _, ico=None):
        # Získáme všechny osoby se zadaným IČO jako prodávající
        sellers = Person.objects.filter(identificationNumber=ico)

        # Pokud žádná osoba s tímto IČ neexistuje, vrátíme 404
        if not sellers.exists():
            return Response({"detail": "Osoba s tímto IČ nebyla nalezena."}, status=status.HTTP_404_NOT_FOUND)

        # Získáme všechny faktury, kde seller je v seznamu osob s daným IČ
        invoices = Invoice.objects.filter(seller__in=sellers)

        # Serializujeme faktury včetně buyer a seller
        serializer = self.get_serializer(invoices, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path=r'identification/(?P<ico>\w+)/purchases')
    def purchases_by_ico(self, _, ico=None):
        # Získáme všechny osoby se zadaným IČO jako kupující
        buyers = Person.objects.filter(identificationNumber=ico)

        # Pokud žádná osoba s tímto IČ neexistuje, vrátíme 404
        if not buyers.exists():
            return Response({"detail": "Osoba s tímto IČ nebyla nalezena."}, status=status.HTTP_404_NOT_FOUND)

        # Získáme všechny faktury, kde buyer je v seznamu osob s daným IČ
        invoices = Invoice.objects.filter(buyer__in=buyers)

        # Serializujeme faktury včetně buyer a seller
        serializer = self.get_serializer(invoices, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path=r'statistics')
    def general_statistics(self, request):
        current_year = now().year

        queryset = Invoice.objects.all()
        current_year_sum = queryset.filter(issued__year=current_year).aggregate(sum=Sum('price'))['sum'] or 0
        all_time_sum = queryset.aggregate(sum=Sum('price'))['sum'] or 0
        invoices_count = queryset.count()

        return Response({
            "currentYearSum": float(current_year_sum),
            "allTimeSum": float(all_time_sum),
            "invoicesCount": invoices_count
        }, status=status.HTTP_200_OK)