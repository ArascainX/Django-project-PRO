import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiGet, apiPost } from '../utils/api';
import InvoicePDF from './InvoicePDF';
import FlashMessage from '../components/FlashMessage';

const InvoiceDetail = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setLoading(true);
    apiGet(`/api/invoices/${encodeURIComponent(id)}`)
      .then((data) => {
        console.log('Načtená faktura:', data);
        setInvoice(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Chyba při načítání faktury:', err);
        setError(err.message.includes('404') ? 'Faktura nenalezena.' : 'Nepodařilo se načíst fakturu.');
        setLoading(false);
      });
  }, [id]);

  const markAsPaid = async () => {
    try {
      const res = await apiPost(`/api/invoices/${id}/mark-paid/`);
      setInvoice({ ...invoice, paid: true });
      setMessage('✅ Faktura byla označena jako zaplacená.');
    } catch (error) {
      setMessage('❌ Nepodařilo se označit fakturu jako zaplacenou.');
    }
  };

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

  if (loading) return <div className="invoice loading">Načítání...</div>;
  if (error) return <div className="invoice error">{error}</div>;
  if (!invoice) return <div className="invoice">Faktura nenalezena.</div>;

  const isPaid = invoice.paid;

  return (
    <div className="invoice">
      <h1>Detail faktury</h1>
      <hr />

      {message && <FlashMessage message={message} />}

      <div className="grid">
        <div>
          <h3>Číslo: {invoice.invoiceNumber}</h3>
          <p><strong>Vystavitel:</strong> {invoice.seller?.name || 'Není uvedeno'}</p>
          <p><strong>Odběratel:</strong> {invoice.buyer?.name || 'Není uvedeno'}</p>
          <p><strong>Datum vystavení:</strong> {formatDate(invoice.issued)}</p>
          <p><strong>Faktura je splatná do:</strong> {formatDate(invoice.dueDate)}</p>
          <p><strong>Produkt:</strong> {invoice.product || 'Není uvedeno'}</p>
          <p><strong>Cena:</strong> {formatPrice(invoice.price)}</p>
          <p><strong>DPH:</strong> {invoice.vat ? `${invoice.vat} %` : 'Není uvedeno'}</p>
          <p><strong>Poznámka:</strong> {invoice.note || 'Žádná'}</p>
        </div>

        <div>
          <h3>Platební informace</h3>
          <p><strong>Splatnost:</strong> {formatDate(invoice.dueDate)}</p>
          <p><strong>Číslo účtu:</strong> {invoice.seller?.accountNumber || 'Není uvedeno'}</p>
          <p><strong>Kód banky:</strong> {invoice.seller?.bankCode || 'Není uvedeno'}</p>
          <p><strong>Variabilní symbol:</strong> {invoice.variableSymbol || invoice.invoiceNumber || 'Není uvedeno'}</p>

          <h3 className="mt-4">Stav platby</h3>
          <p>
            {isPaid ? (
              <span style={{ color: 'green', fontWeight: 'bold' }}>✅ Zaplaceno</span>
            ) : (
              <span style={{ color: 'red', fontWeight: 'bold' }}>❌ Nezaplaceno</span>
            )}
          </p>

          {!isPaid && (
            <button className="btn btn-success mt-2" onClick={markAsPaid}>
              Označit jako zaplacenou
            </button>
          )}
        </div>
      </div>

      <div className="pdf-section mt-4">
        <InvoicePDF invoiceNumber={invoice.invoiceNumber} />
      </div>
    </div>
  );
};

export default InvoiceDetail;
