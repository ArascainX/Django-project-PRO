from django.db import models


class Countries(models.TextChoices):
    CZECHIA = 'CZECHIA', 'Czechia'
    SLOVAKIA = 'SLOVAKIA', 'Slovakia'


class Person(models.Model):
    objects = None
    name = models.CharField(max_length=100, db_index=True)
    identificationNumber = models.CharField(max_length=50, db_index=True)
    taxNumber = models.CharField(max_length=50, blank=True, null=True)
    accountNumber = models.CharField(max_length=50)
    bankCode = models.CharField(max_length=20)
    iban = models.CharField(max_length=34, blank=True, null=True)
    telephone = models.CharField(max_length=20)
    mail = models.EmailField()
    street = models.CharField(max_length=100)
    zip = models.CharField(max_length=10)
    city = models.CharField(max_length=50)
    country = models.CharField(
        max_length=10,
        choices=Countries.choices,
        default=Countries.CZECHIA
    )
    note = models.TextField(blank=True, null=True)
    hidden = models.BooleanField(default=False, db_index=True)


class Invoice(models.Model):
    objects = None
    invoiceNumber = models.CharField(max_length=50, unique=True)

    seller = models.ForeignKey(Person, on_delete=models.PROTECT, related_name='invoices_sold')
    buyer = models.ForeignKey(Person, on_delete=models.PROTECT, related_name='invoices_bought')

    issued = models.DateField()
    dueDate = models.DateField()
    product = models.CharField(max_length=200, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    vat = models.DecimalField(max_digits=5, decimal_places=2)
    note = models.TextField(blank=True, null=True)

    @property
    def price_with_vat(self):
        from decimal import Decimal
        return self.price + (self.price * self.vat / Decimal("100"))