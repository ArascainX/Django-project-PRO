import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet } from "../utils/api";

const InvoiceDetail = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState({});

  useEffect(() => {
    apiGet("/api/invoices/" + id).then((data) => setInvoice(data));
  }, [id]);

  return (
    <div>
      <h1>Detail faktury</h1>
      <hr />
      <h3>Číslo: {invoice.invoiceNumber}</h3>
      <p><strong>Vystavitel:</strong> {invoice.seller?.name || invoice.seller}</p>
      <p><strong>Odběratel:</strong> {invoice.buyer?.name || invoice.buyer}</p>
      <p><strong>Datum vystavení:</strong> {invoice.issued}</p>
      <p><strong>Datum splatnosti:</strong> {invoice.dueDate}</p>
      <p><strong>Produkt:</strong> {invoice.product}</p>
      <p><strong>Cena:</strong> {invoice.price} Kč</p>
      <p><strong>DPH:</strong> {invoice.vat} %</p>
      <p><strong>Poznámka:</strong> {invoice.note}</p>
    </div>
  );
};

export default InvoiceDetail;