from django.db.models import Sum
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..serializers import PersonSerializer
from ..serializers import Person, Invoice


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

    @action(detail=True, methods=['get'], url_path='invoice-summary')
    def invoice_summary(self, _, pk=None):
        person = self.get_object()

        issued_agg = Invoice.objects.filter(seller=person).aggregate(Sum('price'))
        received_agg = Invoice.objects.filter(buyer=person).aggregate(Sum('price'))

        issued_sum = issued_agg.get('price__sum') or 0
        received_sum = received_agg.get('price__sum') or 0

        issued_count = Invoice.objects.filter(seller=person).count()
        received_count = Invoice.objects.filter(buyer=person).count()

        return Response({
            "personId": person.id,
            "personName": person.name,
            "issued": {
                "count": issued_count,
                "sum": float(issued_sum)
            },
            "received": {
                "count": received_count,
                "sum": float(received_sum)
            }
        })

