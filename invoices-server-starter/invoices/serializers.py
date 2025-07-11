from rest_framework import serializers
from .models import Person, Invoice, UserMessage


class PersonSerializer(serializers.ModelSerializer):
    _id = serializers.IntegerField(source="id", read_only=True)
    identificationNumber = serializers.CharField(default=None)
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Person
        fields = [
            'name', 'identificationNumber', 'taxNumber', 'accountNumber',
            'bankCode', 'iban', 'telephone', 'mail', 'street', 'zip',
            'city', 'country', 'note', '_id', 'user'
        ]


class InvoiceSerializer(serializers.ModelSerializer):
    _id = serializers.IntegerField(source="id", read_only=True)
    seller = serializers.PrimaryKeyRelatedField(queryset=Person.objects.all())
    buyer = serializers.PrimaryKeyRelatedField(queryset=Person.objects.all())

    class Meta:
        model = Invoice
        fields = [
            'invoiceNumber', 'seller', 'buyer', 'issued', 'dueDate',
            'product', 'price', 'vat', 'paid', 'note', '_id'
        ]

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)

    def to_internal_value(self, data):
        # Pokud frontend pošle nested objekt s _id, extrahujeme jej
        if isinstance(data.get('seller'), dict) and '_id' in data['seller']:
            data['seller'] = data['seller']['_id']
        if isinstance(data.get('buyer'), dict) and '_id' in data['buyer']:
            data['buyer'] = data['buyer']['_id']
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['seller'] = PersonSerializer(instance.seller).data
        data['buyer'] = PersonSerializer(instance.buyer).data
        return data


class UserMessageSerializer(serializers.ModelSerializer):
    _id = serializers.IntegerField(source="id", read_only=True)

    class Meta:
        model = UserMessage
        fields = ["_id", "title", "content", "read", "created"]
