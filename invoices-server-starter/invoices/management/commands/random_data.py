import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from faker import Faker
from invoices.models import Person, Invoice
from datetime import timedelta, date

fake = Faker('cs_CZ')

# Seznam běžných českých produktů
PRODUCTS = [
    "myš", "klávesnice", "monitor", "notebook", "PC", "tiskárna",
    "flash disk", "pevný disk", "procesor", "grafická karta",
    "kladivo", "šroubovák", "pila", "vrtačka", "lopata",
    "židle", "stůl", "skříň", "regál", "lampička", "kniha"
]

class Command(BaseCommand):
    help = "Vygeneruje testovací osoby a faktury"

    def handle(self, *args, **kwargs):
        self.stdout.write("🔥 Generuji osoby a faktury...")

        # Vymazání starých dat
        Invoice.objects.all().delete()
        Person.objects.all().delete()
        self.stdout.write("✅ Staré osoby a faktury byly vymazány.")

        persons = []
        for _ in range(15):
            person = Person.objects.create(
                name=fake.company(),
                identificationNumber=f"{random.randint(10000000, 99999999)}",
                taxNumber=f"CZ{random.randint(10000000, 99999999)}",
                accountNumber=fake.bban(),
                bankCode=str(fake.random_int(min=8, max=10)),
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

        for i in range(200):
            seller = random.choice(persons)
            buyer = random.choice(persons)

            random_year = random.randint(2020, 2025)
            random_month = random.randint(1, 12)
            random_day = random.randint(1, 28)

            issued_date = date(year=random_year, month=random_month, day=random_day)
            due_date = issued_date + timedelta(days=30)

            # Cena zaokrouhlená na dvě desetinná místa
            price = Decimal(f"{random.uniform(500, 100000)}")

            # DPH vybráno náhodně z typických sazeb
            vat = Decimal(random.choice([10, 15, 21]))

            # Náhodný český produkt
            product = random.choice(PRODUCTS)

            invoice = Invoice.objects.create(
                invoiceNumber=f"{fake.unique.random_int(1000, 9999)}",
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
