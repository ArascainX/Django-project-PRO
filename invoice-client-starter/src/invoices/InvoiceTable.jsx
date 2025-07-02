import React from "react";
import { Link } from "react-router-dom";

const formatPrice = (value) => {
  return new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value) + " Kč";
};

const formatDate = (value) => {
  return new Date(value).toLocaleDateString("cs-CZ");
};

const InvoiceTable = ({ label, items, deleteInvoice }) => {
  return (
    <div>
      <p>{label} {items.length}</p>
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
            <th colSpan={3}>Akce</th>
          </tr>
        </thead>
        <tbody>
          {items.map((invoice, index) => (
            <tr key={invoice._id || index}>
              <td>{index + 1}</td>
              <td>{invoice.invoiceNumber}</td>
              <td>{invoice.product}</td>
              <td>{formatPrice(invoice.price)}</td>
              <td>{formatDate(invoice.issued)}</td>
              <td>{invoice.buyer?.name}</td>
              <td>{invoice.seller?.name}</td>
              <td>
                <div className="btn-group">
                  <Link to={`/invoices/show/${invoice._id}`} className="btn btn-sm btn-info">Zobrazit</Link>
                  <Link to={`/invoices/edit/${invoice._id}`} className="btn btn-sm btn-warning">Upravit</Link>
                  <button onClick={() => deleteInvoice(invoice._id)} className="btn btn-sm btn-danger">Odstranit</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link to="/invoices/create" className="btn btn-success">Nová faktura</Link>
    </div>
  );
};

export default InvoiceTable;
