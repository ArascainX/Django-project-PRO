from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..models import Person, Invoice
from ..serializers import InvoiceSerializer

class SalesByIcoView(APIView):
    def get(self, _, ico):
        sellers = Person.objects.filter(identificationNumber=ico)
        if not sellers.exists():
            return Response({"detail": "Osoba s tímto IČ nebyla nalezena."}, status=status.HTTP_404_NOT_FOUND)
        invoices = Invoice.objects.filter(seller__in=sellers)
        serializer = InvoiceSerializer(invoices, many=True)
        return Response(serializer.data)

class PurchasesByIcoView(APIView):
    def get(self, _, ico):
        buyers = Person.objects.filter(identificationNumber=ico)
        if not buyers.exists():
            return Response({"detail": "Osoba s tímto IČ nebyla nalezena."}, status=status.HTTP_404_NOT_FOUND)
        invoices = Invoice.objects.filter(buyer__in=buyers)
        serializer = InvoiceSerializer(invoices, many=True)
        return Response(serializer.data)
