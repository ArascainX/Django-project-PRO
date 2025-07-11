import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { apiGet, getCurrentUser } from '../utils/api';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

const InvoicePDF = ({ invoiceNumber }) => {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getCurrentUser()
      .then((data) => setUser(data))
      .catch((err) => {
        console.error("Nepodařilo se načíst uživatele:", err);
        setUser(null);
      });
  }, []);

  const downloadInvoice = async () => {
    setLoading(true);
    setError(null);
    try {
      const blob = await apiGet(`/api/invoices/${encodeURIComponent(invoiceNumber)}/pdf/`, {}, 'blob');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `faktura_${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Chyba při stahování PDF:', error);
      setError(error.message.includes('403') ? 'Funkce dostupná pouze pro předplatitele.' : 'Nepodařilo se stáhnout PDF faktury.');
    } finally {
      setLoading(false);
    }
  };

  const displayInvoice = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet(`/api/invoices/${encodeURIComponent(invoiceNumber)}/pdf/`, {}, 'blob');
      const url = window.URL.createObjectURL(response);
      setPdfUrl(url);
    } catch (error) {
      console.error('Chyba při zobrazení PDF:', error);
      setError(error.message.includes('403') ? 'Funkce dostupná pouze pro předplatitele.' : 'Nepodařilo se zobrazit PDF faktury.');
    } finally {
      setLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  if (user === null) {
    return <p>Načítání údajů o uživateli...</p>;
  }

  if (!user.has_active_subscription) {
    return (
      <div className="alert alert-warning mt-3">
        <strong>🔒 Prémiová funkce</strong><br />
        Stažení a zobrazení PDF faktury je dostupné pouze pro předplatitele.
      </div>
    );
  }

  return (
    <div className="invoice">
      <div className="button-group">
        <button
          onClick={downloadInvoice}
          disabled={loading || !invoiceNumber}
          className="download-button"
        >
          {loading ? 'Generuji...' : 'Stáhnout PDF'}
        </button>
        <button
          onClick={displayInvoice}
          disabled={loading || !invoiceNumber}
          className="display-button"
        >
          {loading ? 'Generuji...' : 'Zobrazit PDF'}
        </button>
      </div>
      {error && <div className="error mt-2">{error}</div>}
      {pdfUrl && (
        <div className="pdf-container mt-3">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={() => setError('Chyba při načítání PDF.')}
            loading="Načítání PDF..."
          >
            {Array.from(new Array(numPages), (el, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                width={600}
                className="page"
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            ))}
          </Document>
          <button
            onClick={() => {
              setPdfUrl(null);
              setNumPages(null);
            }}
            className="close-button mt-2"
          >
            Zavřít PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default InvoicePDF;
