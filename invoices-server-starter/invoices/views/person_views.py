from django.db.models import Sum
from django.db.models.functions import TruncMonth
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from ..serializers import Person, Invoice
from ..serializers import PersonSerializer


class PersonViewSet(viewsets.ModelViewSet):
    queryset = Person.objects.filter(hidden=False)
    serializer_class = PersonSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        instance.hidden = True
        instance.save(update_fields=["hidden"])

        validated_data = serializer.validated_data
        validated_data.pop('hidden', None)
        new_instance = Person.objects.create(**validated_data, hidden=False)

        output_serializer = self.get_serializer(new_instance)
        return Response(output_serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.hidden = True
        instance.save(update_fields=["hidden"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='statistics')
    def person_statistics(self, _):
        persons = Person.objects.filter(hidden=False)
        statistics = []

        for person in persons:
            revenue = Invoice.objects.filter(seller=person).aggregate(sum=Sum('price'))['sum'] or 0
            statistics.append({
                "personId": person.id,
                "personName": person.name,
                "revenue": float(revenue)
            })

        return Response(statistics, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"], url_path="invoice-summary")
    def invoice_summary(self, request, pk=None):
        person = self.get_object()

        # 👉 Parametry z URL
        try:
            year_from = int(request.GET.get("year_from", 2000))
            year_to = int(request.GET.get("year_to", 2100))
        except ValueError:
            return Response({"error": "Parametry 'year_from' a 'year_to' musí být celá čísla."}, status=400)

        # 🔍 Queryset pro přijaté a vystavené faktury
        received_qs = Invoice.objects.filter(
            buyer=person,
            issued__year__gte=year_from,
            issued__year__lte=year_to
        )

        issued_qs = Invoice.objects.filter(
            seller=person,
            issued__year__gte=year_from,
            issued__year__lte=year_to
        )

        def monthly_aggregate(queryset):
            monthly_totals = [0] * 12
            for entry in (
                    queryset
                    .annotate(month=TruncMonth("issued"))
                    .values("month")
                    .annotate(total=Sum("price"))
                    .order_by("month")
            ):
                if entry["month"]:
                    index = entry["month"].month - 1
                    monthly_totals[index] += float(entry["total"] or 0)
            return monthly_totals

        return Response({
            "personName": person.name,
            "monthly": {
                "received": monthly_aggregate(received_qs),
                "issued": monthly_aggregate(issued_qs),
            }
        })


