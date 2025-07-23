import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from faker import Faker
from invoices.models import Person, Invoice
from django.contrib.auth.models import User
from datetime import timedelta, date

fake = Faker('cs_CZ')

PRODUCTS = [
    "myš", "klávesnice", "monitor", "notebook", "PC", "tiskárna",
    "flash disk", "pevný disk", "procesor", "grafická karta",
    "kladivo", "šroubovák", "pila", "vrtačka", "lopata",
    "židle", "stůl", "skříň", "regál", "lampička", "kniha"
]

class Command(BaseCommand):
    help = "Vygeneruje testovací osoby a faktury pro konkrétního uživatele"

    def handle(self, *args, **kwargs):
        self.stdout.write("🔥 Generuji osoby a faktury...")

        # Získání testovacího uživatele (změň podle potřeby)
        try:
            user = User.objects.get(username='test@test.cz')
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR("❌ Uživatel 'test@test.cz' neexistuje."))
            return

        # Smazání starých osob a faktur jen pro tohoto uživatele
        Invoice.objects.filter(user=user).delete()
        Person.objects.filter(user=user).delete()
        self.stdout.write("✅ Staré osoby a faktury byly vymazány.")

        # Vytvoření nových osob
        persons = []
        for _ in range(15):
            person = Person.objects.create(
                user=user,
                name=fake.company(),
                identificationNumber=f"{random.randint(10000000, 99999999)}",
                taxNumber=f"CZ{random.randint(10000000, 99999999)}",
                accountNumber=fake.bban(),
                bankCode=str(fake.random_int(min=1000, max=9999)),
                iban=fake.iban(),
                telephone=fake.phone_number(),
                mail=fake.company_email(),
                street=fake.street_address(),
                zip=fake.postcode(),
                city=fake.city(),
                country=random.choice(['CZECHIA', 'SLOVAKIA']),
                note=fake.catch_phrase(),
                hidden=False
            )
            persons.append(person)

        # Vytvoření faktur
        for i in range(50):
            seller = random.choice(persons)
            buyer = random.choice(persons)

            random_year = random.randint(2020, 2025)
            random_month = random.randint(1, 12)
            random_day = random.randint(1, 28)

            issued_date = date(year=random_year, month=random_month, day=random_day)
            due_date = issued_date + timedelta(days=30)

            price = Decimal(f"{random.uniform(500, 100000):.2f}")
            vat = Decimal(random.choice([10, 15, 21]))
            product = random.choice(PRODUCTS)

            invoice = Invoice.objects.create(
                user=user,
                invoiceNumber = str(fake.unique.random_int(100000, 999999)),
                seller=seller,
                buyer=buyer,
                issued=issued_date,
                dueDate=due_date,
                product=product,
                price=price,
                vat=vat,
                note=fake.sentence(ext_word_list=PRODUCTS)
            )

            self.stdout.write(self.style.SUCCESS(f"✅ Faktura {invoice.invoiceNumber} vytvořena"))
