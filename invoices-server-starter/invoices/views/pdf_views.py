import os
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    Paragraph, Table, TableStyle, SimpleDocTemplate, Spacer,
    Image, HRFlowable
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from django.http import FileResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import io
import qrcode
from babel.numbers import format_currency

from invoices.models import Invoice, Subscription

# Fonty
pdfmetrics.registerFont(TTFont('Poppins', 'invoices/static/fonts/Poppins/Poppins-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Poppins-Bold', 'invoices/static/fonts/Poppins/Poppins-Bold.ttf'))

# Pomocná funkce pro formátování CZK
def czk(value):
    return format_currency(value, 'CZK', locale='cs_CZ').replace('\xa0', ' ')

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_invoice_pdf(request, invoice_number):
    try:
        invoice = Invoice.objects.get(invoiceNumber=invoice_number)
    except Invoice.DoesNotExist:
        return Response({"detail": "Faktura nenalezena."}, status=404)

    # ✅ Přístup pouze pro předplatitele
    try:
        subscription = Subscription.objects.get(user=request.user)
        if not subscription.is_active():
            return Response({"detail": "Tato funkce je dostupná pouze pro předplatitele."}, status=403)
    except Subscription.DoesNotExist:
        return Response({"detail": "Tato funkce je dostupná pouze pro předplatitele."}, status=403)

    # Vytvoření PDF dokumentu
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm
    )

    # Styly
    bold = ParagraphStyle(name='Bold', fontName='Poppins-Bold', fontSize=10)
    normal = ParagraphStyle(name='Normal', fontName='Poppins', fontSize=9, leading=12)
    header_bold = ParagraphStyle(name='HeaderBold', fontName='Poppins-Bold', fontSize=13, alignment=2, leading=16)
    grey_label = ParagraphStyle(name='GreyLabel', fontName='Poppins-Bold', fontSize=12, textColor=colors.grey)
    big_bold = ParagraphStyle(name='BigBold', fontName='Poppins-Bold', fontSize=12)

    elements = []

    # HLAVICKA
    logo_path = 'invoices/static/logo.png'
    if os.path.exists(logo_path):
        logo_img = Image(logo_path, width=60 * mm, height=25 * mm)
    else:
        logo_img = ''

    header_data = [[
        logo_img,
        Paragraph(
            f"FAKTURA č. {invoice.invoiceNumber}<br/><br/>"
            f"Datum vystavení: {invoice.issued.strftime('%d.%m.%Y')}<br/>"
            f"Datum splatnosti: {invoice.dueDate.strftime('%d.%m.%Y')}",
            header_bold
        )
    ]]
    header_table = Table(header_data, colWidths=[90 * mm, 90 * mm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 4 * mm))
    elements.append(HRFlowable(color=colors.black, thickness=0.5, width="100%"))
    elements.append(Spacer(1, 10 * mm))

    # DODAVATEL / ODBERATEL
    data_dodavatel = [
        [Paragraph('Dodavatel', grey_label)],
        [Paragraph(
            f"{invoice.seller.name}<br/>{invoice.seller.street}<br/>"
            f"{invoice.seller.zip} {invoice.seller.city}<br/>"
            f"IČO: {invoice.seller.identificationNumber}<br/>"
            f"DIČ: {invoice.seller.taxNumber or 'Neuvedeno'}",
            normal
        )]
    ]

    data_odberatel = [
        [Paragraph('Odběratel', grey_label)],
        [Paragraph(
            f"{invoice.buyer.name}<br/>{invoice.buyer.street}<br/>"
            f"{invoice.buyer.zip} {invoice.buyer.city}<br/>"
            f"IČO: {invoice.buyer.identificationNumber}<br/>"
            f"DIČ: {invoice.buyer.taxNumber or 'Neuvedeno'}",
            normal
        )]
    ]

    table_dodavatel = Table(data_dodavatel, colWidths=[80 * mm], hAlign='LEFT')
    table_odberatel = Table(data_odberatel, colWidths=[80 * mm], hAlign='RIGHT')
    two_column_table = Table([[table_dodavatel, table_odberatel]], colWidths=[90 * mm, 90 * mm], hAlign='CENTER')
    elements.append(two_column_table)
    elements.append(Spacer(1, 10 * mm))
    elements.append(HRFlowable(color=colors.black, thickness=0.5, width="100%"))
    elements.append(Spacer(1, 10 * mm))

    # POLOZKY
    items_data = [[
        'Popis', 'MJ', 'Množství', 'Cena za MJ',
        'Cena bez DPH', 'DPH', 'Cena s DPH'
    ], [
        invoice.product, 'ks', '1',
        czk(invoice.price),
        czk(invoice.price),
        f"{invoice.vat}%",
        czk(invoice.price_with_vat)
    ]]
    item_table = Table(
        items_data,
        colWidths=[60 * mm, 15 * mm, 20 * mm, 30 * mm, 30 * mm, 15 * mm, 30 * mm]
    )
    item_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTNAME', (0, 0), (-1, 0), 'Poppins-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Poppins'),
        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(item_table)
    elements.append(Spacer(1, 10 * mm))

    # SOUHRN
    summary_data = [
        ['', Paragraph('Cena bez DPH', normal), Paragraph(czk(invoice.price), normal)],
        ['', Paragraph('DPH', normal), Paragraph(czk(invoice.price * invoice.vat / 100), normal)],
        ['', Paragraph("<b><font size=12>Celkem k úhradě</font></b>", big_bold),
         Paragraph(f"<b><font size=12>{czk(invoice.price_with_vat)}</font></b>", big_bold)]
    ]
    summary_table = Table(summary_data, colWidths=[70 * mm, 50 * mm, 50 * mm], hAlign='RIGHT')
    summary_table.setStyle(TableStyle([
        ('FONTNAME', (1, 0), (-1, -1), 'Poppins'),
        ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 10 * mm))
    elements.append(HRFlowable(color=colors.black, thickness=0.5, width="100%"))
    elements.append(Spacer(1, 10 * mm))

    # PLATEBNI ÚDAJE & QR
    elements.append(Paragraph("Údaje k platbě:", bold))
    elements.append(Paragraph(f"Číslo účtu: {invoice.buyer.accountNumber}/{invoice.buyer.bankCode}", normal))
    elements.append(Paragraph(f"Variabilní symbol: {invoice.invoiceNumber}", normal))
    elements.append(Spacer(1, 5 * mm))

    # ✅ QR kód přímo do paměti (BytesIO)
    qr_data = (
        f"SPD*1.0*ACC:{invoice.buyer.accountNumber}/{invoice.buyer.bankCode}"
        f"*AM:{float(invoice.price_with_vat):.2f}*CC:CZK"
    )
    qr_img = qrcode.make(qr_data)
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format='PNG')
    qr_buffer.seek(0)
    elements.append(Image(qr_buffer, width=30 * mm, height=30 * mm))
    elements.append(Paragraph("QR Platba", normal))
    elements.append(Spacer(1, 10 * mm))

    # PODPIS
    elements.append(Paragraph("Děkujeme za Vaši objednávku!", normal))
    elements.append(Paragraph(invoice.seller.name, bold))

    doc.build(elements)
    buffer.seek(0)
    return FileResponse(buffer, as_attachment=True, filename=f'faktura_{invoice.invoiceNumber}.pdf')
