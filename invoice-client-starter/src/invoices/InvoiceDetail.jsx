import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiGet } from '../utils/api';
import InvoicePDF from './InvoicePDF';

const InvoiceDetail = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    apiGet(`/api/invoices/${encodeURIComponent(id)}`)
      .then((data) => {
        setInvoice(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Chyba při načítání faktury:', err);
        setError(err.message.includes('404') ? 'Faktura nenalezena.' : 'Nepodařilo se načíst fakturu.');
        setLoading(false);
      });
  }, [id]);

  const formatPrice = (value) => {
    if (typeof value !== 'number') value = parseFloat(value);
    return new Intl.NumberFormat('cs-CZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value) + ' Kč';
  };

  const formatDate = (value) => {
    if (!value) return 'Není uvedeno';
    return new Date(value).toLocaleDateString('cs-CZ'); 
  };

  if (loading) {
    return <div className="p-4">Načítání...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!invoice) {
    return <div className="p-4">Faktura nenalezena.</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Detail faktury</h1>
      <hr className="mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold">Číslo: {invoice.invoiceNumber}</h3>
          <p><strong>Vystavitel:</strong> {invoice.seller?.name || 'Není uvedeno'}</p>
          <p><strong>Odběratel:</strong> {invoice.buyer?.name || 'Není uvedeno'}</p>
          <p><strong>Datum vystavení:</strong> {formatDate(invoice.issued)}</p>
          <p><strong>Datum splatnosti:</strong> {formatDate(invoice.dueDate)}</p>
          <p><strong>Produkt:</strong> {invoice.product || 'Není uvedeno'}</p>
          <p><strong>Cena:</strong> {formatPrice(invoice.price)}</p>
          <p><strong>DPH:</strong> {invoice.vat ? `${invoice.vat} %` : 'Není uvedeno'}</p>
          <p><strong>Poznámka:</strong> {invoice.note || 'Žádná'}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Platební informace</h3>
          <p><strong>Stav platby:</strong> {invoice.paid ? 'Zaplaceno' : 'Nezaplaceno'}</p>
          <p><strong>Číslo účtu:</strong> {invoice.accountNumber || 'Není uvedeno'}</p>
          <p><strong>Variabilní symbol:</strong> {invoice.variableSymbol || invoice.invoiceNumber || 'Není uvedeno'}</p>
          <p><strong>Specifický symbol:</strong> {invoice.specificSymbol || 'Není uvedeno'}</p>
          <p><strong>Konstantní symbol:</strong> {invoice.constantSymbol || 'Není uvedeno'}</p>
        </div>
      </div>
      <div className="mt-6">
        <InvoicePDF invoiceNumber={invoice.invoiceNumber} />
      </div>
    </div>
  );
};

export default InvoiceDetail;
