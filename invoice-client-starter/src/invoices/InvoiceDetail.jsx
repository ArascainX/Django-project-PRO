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

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCorrectModal, setShowCorrectModal] = useState(false);
  const [correctAmount, setCorrectAmount] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Chybí ID faktury.");
      setLoading(false);
      return;
    }

    setLoading(true);
    apiGet(`/api/invoices/${encodeURIComponent(id)}`)
      .then((data) => {
        setInvoice(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message.includes("404") ? "Faktura nenalezena." : "Nepodařilo se načíst fakturu.");
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

  const handleCancel = async () => {
    try {
      await apiPost(`/api/invoices/${id}/cancel/`, { reason: cancelReason });
      setMessage("✅ Faktura byla stornována.");
      setShowCancelModal(false);
      apiGet(`/api/invoices/${encodeURIComponent(id)}`).then(setInvoice);
    } catch (error) {
      setMessage("❌ Nepodařilo se stornovat fakturu.");
    }
  };

  const handleCorrect = async () => {
    try {
      await apiPost(`/api/invoices/${id}/correct/`, { amount: correctAmount });
      setMessage("✅ Dobropis byl vystaven.");
      setShowCorrectModal(false);
    } catch (error) {
      setMessage("❌ Nepodařilo se vystavit dobropis.");
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
          <h3>
            Číslo: {invoice.invoiceNumber}
            {invoice.is_cancelled && (
              <span className="badge bg-warning ms-2">STORNO</span>
            )}
            {invoice.is_correction && (
              <span className="badge bg-info ms-2">DOBROPIS</span>
            )}
          </h3>
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

      <div className="actions mt-4">
        {invoice.is_sent && !invoice.is_cancelled && !invoice.is_correction && (
          <>
            <button className="btn btn-danger me-2" onClick={() => setShowCancelModal(true)}>
              Stornovat fakturu
            </button>
            <button className="btn btn-warning" onClick={() => setShowCorrectModal(true)}>
              Vystavit dobropis
            </button>
          </>
        )}
      </div>

      {showCancelModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Stornovat fakturu</h3>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Zadejte důvod storna"
              rows={3}
            />
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={handleCancel}>Potvrdit storno</button>
              <button className="btn btn-secondary" onClick={() => setShowCancelModal(false)}>Zrušit</button>
            </div>
          </div>
        </div>
      )}

      {showCorrectModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Opravný daňový doklad</h3>
            <input
              type="number"
              value={correctAmount}
              onChange={(e) => setCorrectAmount(e.target.value)}
              placeholder="Zadejte částku dobropisu"
            />
            <div className="modal-actions">
              <button className="btn btn-warning" onClick={handleCorrect}>Vystavit dobropis</button>
              <button className="btn btn-secondary" onClick={() => setShowCorrectModal(false)}>Zrušit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;