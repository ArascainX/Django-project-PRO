from datetime import date

from django.db import models
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings



class Countries(models.TextChoices):
    CZECHIA = 'CZECHIA', 'Czechia'
    SLOVAKIA = 'SLOVAKIA', 'Slovakia'


class Person(models.Model):
    objects = None
    name = models.CharField(max_length=100, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='persons')
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
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='invoices')

    seller = models.ForeignKey(Person, on_delete=models.PROTECT, related_name='invoices_sold')
    buyer = models.ForeignKey(Person, on_delete=models.PROTECT, related_name='invoices_bought')

    issued = models.DateField()
    dueDate = models.DateField()
    product = models.CharField(max_length=200, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    vat = models.DecimalField(max_digits=5, decimal_places=2)
    paid = models.BooleanField(default=False)
    note = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        # zjistit, jestli se mění paid z False na True
        if self.pk is not None:
            old = Invoice.objects.get(pk=self.pk)
            if not old.paid and self.paid:
                # Faktura byla právě označena jako zaplacená
                self.send_paid_notification()
        super().save(*args, **kwargs)

    def send_paid_notification(self):
        subject = f"Faktura {self.invoiceNumber} byla zaplacena"
        message = f"Dobrý den,\n\nFaktura číslo {self.invoiceNumber} byla právě označena jako zaplacená."
        recipient_list = [self.user.email]  # pokud user je majitel faktury
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, recipient_list)

    @property
    def price_with_vat(self):
        from decimal import Decimal
        return self.price + (self.price * self.vat / Decimal("100"))


class Subscription(models.Model):
    objects = None
    DoesNotExist = None
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    stripe_subscription_id = models.CharField(max_length=255, unique=True)
    current_period_end = models.DateField()
    active = models.BooleanField(default=True)
    cancelled = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} – aktivní: {self.active}"

    def is_active(self):
        return self.active and self.current_period_end >= date.today()

class UserMessage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="messages")
    title = models.CharField(max_length=255)
    content = models.TextField()
    read = models.BooleanField(default=False)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}: {self.title}"