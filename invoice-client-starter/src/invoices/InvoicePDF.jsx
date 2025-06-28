import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { apiGet } from '../utils/api';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;


const InvoicePDF = ({ invoiceNumber }) => {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [error, setError] = useState(null);

  const downloadInvoice = async () => {
  setLoading(true);
  setError(null);
  try {
    const blob = await apiGet(`/api/invoices/${encodeURIComponent(invoiceNumber)}/pdf/`, null, 'blob');
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
    setError(error.message.includes('404') ? 'Faktura nenalezena.' : 'Nepodařilo se stáhnout PDF faktury.');
  } finally {
    setLoading(false);
  }
};

  const displayInvoice = async () => {
    try {
      const url = `http://localhost:8000/api/invoices/${invoiceNumber}/pdf/`;
      setPdfUrl(url); // jen nastavíš URL k iframe
    } catch (error) {
      console.error('Chyba při zobrazení PDF:', error);
      setError('Nepodařilo se zobrazit PDF faktury.');
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  return (
    <div className="p-4">
      <div className="flex space-x-4 mb-4">
        <button
          onClick={downloadInvoice}
          disabled={loading || !invoiceNumber}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Generuji...' : 'Stáhnout PDF'}
        </button>
        <button
          onClick={displayInvoice}
          disabled={loading || !invoiceNumber}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Generuji...' : 'Zobrazit PDF'}
        </button>
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {pdfUrl && (
        <div className="mt-4 border border-gray-300 rounded p-4">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            className="flex justify-center"
            error="Nepodařilo se načíst PDF."
            loading="Načítání PDF..."
          >
            {numPages &&
              Array.from(new Array(numPages), (el, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  width={600}
                  className="mb-4"
                />
              ))}
          </Document>
        </div>
      )}
    </div>
  );
};

export default InvoicePDF;