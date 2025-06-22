from rest_framework import viewsets, status
from rest_framework.response import Response

from ..serializers import PersonSerializer
from ..serializers import Person


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
