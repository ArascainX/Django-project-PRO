from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import io
from invoices.models import Invoice

# Registrace fontu Poppins
pdfmetrics.registerFont(TTFont('Poppins', 'invoices/static/fonts/Poppins/Poppins-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Poppins-Bold', 'invoices/static/fonts/Poppins/Poppins-Bold.ttf'))


@api_view(['GET'])
def generate_invoice_pdf(request, invoice_number):
    try:
        # Načtení faktury podle invoiceNumber
        invoice = Invoice.objects.get(invoiceNumber=invoice_number, seller__hidden=False, buyer__hidden=False)

        # Převod dat z modelu do struktury pro PDF
        invoice_data = {
            'invoice_number': invoice.invoiceNumber,
            'issue_date': invoice.issued.strftime('%d. %m. %Y'),
            'due_date': invoice.dueDate.strftime('%d. %m. %Y'),
            'seller': {
                'name': invoice.seller.name,
                'address': f"{invoice.seller.street}, {invoice.seller.zip} {invoice.seller.city}, {invoice.seller.country}",
                'ico': invoice.seller.identificationNumber,
                'dic': invoice.seller.taxNumber or 'Není uvedeno',
            },
            'buyer': {
                'name': invoice.buyer.name,
                'address': f"{invoice.buyer.street}, {invoice.buyer.zip} {invoice.buyer.city}, {invoice.buyer.country}",
                'ico': invoice.buyer.identificationNumber,
            },
            'items': [
                {
                    'description': invoice.product,
                    'quantity': 1,
                    'unit_price': float(invoice.price),
                    'vat': float(invoice.vat),
                }
            ],
            'bank_details': {
                'account': f"{invoice.seller.accountNumber}/{invoice.seller.bankCode}",
                'iban': invoice.seller.iban or 'Není uvedeno',
                'variable_symbol': invoice.invoiceNumber,
            },
        }

        # Vytvoření PDF v paměti
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1 * cm, bottomMargin=1 * cm)

        # Styly s fontem Poppins
        styles = getSampleStyleSheet()
        style_title = ParagraphStyle(
            name='Title',
            fontName='Poppins-Bold',
            fontSize=16,
            leading=20,
            alignment=TA_CENTER,
            spaceAfter=20,
            encoding='utf8'  # Podpora diakritiky
        )
        style_normal = ParagraphStyle(
            name='Normal',
            fontName='Poppins',
            fontSize=12,
            leading=14,
            spaceAfter=10,
            encoding='utf8'
        )
        style_small = ParagraphStyle(
            name='Small',
            fontName='Poppins',
            fontSize=10,
            leading=12,
            spaceAfter=10,
            encoding='utf8'
        )
        style_bold = ParagraphStyle(
            name='Bold',
            fontName='Poppins-Bold',
            fontSize=12,
            spaceAfter=10,
            encoding='utf8'
        )

        # Obsah faktury
        elements = []

        # Záhlaví
        elements.append(Paragraph(f"Faktura č. {invoice_data['invoice_number']}", style_title))
        elements.append(Spacer(1, 0.5 * cm))

        # Informace o faktuře
        elements.append(Paragraph(f"Datum vystavení: {invoice_data['issue_date']}", style_small))
        elements.append(Paragraph(f"Datum splatnosti: {invoice_data['due_date']}", style_small))
        elements.append(Spacer(1, 0.5 * cm))

        # Dodavatel (seller) a odběratel (buyer)
        elements.append(Paragraph("Dodavatel:", style_bold))
        elements.append(Paragraph(invoice_data['seller']['name'], style_normal))
        elements.append(Paragraph(invoice_data['seller']['address'], style_normal))
        elements.append(Paragraph(f"IČO: {invoice_data['seller']['ico']}", style_small))
        elements.append(Paragraph(f"DIČ: {invoice_data['seller']['dic']}", style_small))
        elements.append(Spacer(1, 0.5 * cm))

        elements.append(Paragraph("Odběratel:", style_bold))
        elements.append(Paragraph(invoice_data['buyer']['name'], style_normal))
        elements.append(Paragraph(invoice_data['buyer']['address'], style_normal))
        elements.append(Paragraph(f"IČO: {invoice_data['buyer']['ico']}", style_small))
        elements.append(Spacer(1, 1 * cm))

        # Tabulka s položkami
        table_data = [["Popis", "Množství", "Cena za jednotku (Kč)", "DPH (%)", "Celkem bez DPH (Kč)"]]
        total_without_vat = 0
        total_vat = 0
        for item in invoice_data['items']:
            total_item = item['quantity'] * item['unit_price']
            total_without_vat += total_item
            total_vat += total_item * (item['vat'] / 100)
            table_data.append([
                item['description'],
                str(item['quantity']),
                f"{item['unit_price']:.2f}",
                f"{item['vat']:.0f}",
                f"{total_item:.2f}"
            ])

        total_with_vat = total_without_vat + total_vat
        table_data.append(["", "", "", "Celkem bez DPH:", f"{total_without_vat:.2f} Kč"])
        table_data.append(["", "", "", "DPH:", f"{total_vat:.2f} Kč"])
        table_data.append(["", "", "", "Celkem s DPH:", f"{total_with_vat:.2f} Kč"])

        # Styl tabulky
        table = Table(table_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Poppins-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Poppins'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 1 * cm))

        # Platební údaje
        elements.append(Paragraph("Platební údaje:", style_bold))
        elements.append(Paragraph(f"Číslo účtu: {invoice_data['bank_details']['account']}", style_normal))
        elements.append(Paragraph(f"IBAN: {invoice_data['bank_details']['iban']}", style_normal))
        elements.append(
            Paragraph(f"Variabilní symbol: {invoice_data['bank_details']['variable_symbol']}", style_normal))

        # Poznámka (pokud existuje)
        if invoice.note:
            elements.append(Spacer(1, 0.5 * cm))
            elements.append(Paragraph("Poznámka:", style_bold))
            elements.append(Paragraph(invoice.note, style_normal))

        # Vygenerování PDF
        doc.build(elements)

        # Vrácení PDF jako HTTP odpověď
        buffer.seek(0)
        response = HttpResponse(content_type='application/pdf')
        disposition = 'inline' if request.GET.get('display') == 'true' else 'attachment'
        response['Content-Disposition'] = f'{disposition}; filename="faktura_{invoice_data["invoice_number"]}.pdf"'
        response.write(buffer.getvalue())
        buffer.close()
        return response

    except Invoice.DoesNotExist:
        return Response({'error': 'Faktura nenalezena'}, status=404)