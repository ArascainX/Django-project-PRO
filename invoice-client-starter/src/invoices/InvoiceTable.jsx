import React from "react";
import { Link } from "react-router-dom";

export const formatPrice = (value) => {
  const amount = parseFloat(value);
  const isNegative = amount < 0;
  const formatted =
    new Intl.NumberFormat("cs-CZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount)) + " Kč";
  return isNegative ? `−${formatted}` : formatted;
};

const formatDate = (value) => {
  return new Date(value).toLocaleDateString("cs-CZ");
};

/**
 * Komponenta univerzální tabulky faktur.
 * @param {string} label - Nadpis nebo popisek tabulky.
 * @param {array} items - Pole faktur k zobrazení.
 * @param {function} onCancel - Funkce pro storno faktury.
 */
const InvoiceTable = ({
  label,
  items,
  onCancel,
}) => {
  return (
    <div>
      {label && (
        <p>
          {label}: {items.length}
        </p>
      )}

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>#</th>
            <th>Číslo faktury</th>
            <th>Produkt</th>
            <th>Cena</th>
            <th>Datum vystavení</th>
            <th>Odběratel</th>
            <th>Dodavatel</th>
            <th>Akce</th>
          </tr>
        </thead>
        <tbody>
          {items.map((invoice, index) => {
            const invoiceId = invoice.id || invoice._id;
            if (!invoiceId) return null;

            return (
              <tr key={invoiceId}>
                <td>{index + 1}</td>
                <td>
                  {invoice.invoiceNumber}{" "}
                  {invoice.is_cancelled && (
                    <span className="badge bg-warning text-dark ms-1">
                      STORNO
                    </span>
                  )}
                  {invoice.is_correction && (
                    <span className="badge bg-info text-dark ms-1">
                      DOBROPIS
                    </span>
                  )}
                </td>
                <td>{invoice.product}</td>
                <td>{formatPrice(invoice.price)}</td>
                <td>{formatDate(invoice.issued)}</td>
                <td>{invoice.buyer?.name}</td>
                <td>{invoice.seller?.name}</td>
                <td>
                  <div className="btn-group">
                    <Link
                      to={`/invoices/show/${invoiceId}`}
                      className="btn btn-sm btn-info"
                    >
                      Zobrazit
                    </Link>
                    <Link
                      to={`/invoices/edit/${invoiceId}`}
                      className="btn btn-sm btn-warning"
                    >
                      Upravit
                    </Link>
                    <button
                      onClick={() => onCancel(invoiceId)}
                      className="btn btn-sm btn-danger"
                      disabled={invoice.is_cancelled}
                    >
                      {invoice.is_cancelled ? "Stornováno" : "Stornovat"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Link to="/invoices/create" className="btn btn-success">
        Nová faktura
      </Link>
    </div>
  );
};

export default InvoiceTable;
