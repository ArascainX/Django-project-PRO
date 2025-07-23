import React, { useEffect, useState } from "react";
import { apiGet } from "../utils/api";
import InvoiceTable from "./InvoiceTable";

const ActiveInvoices = ({ filters, cancelInvoice }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet("/api/invoices/filter", filters);
      setInvoices(data);
    } catch (err) {
      setError("Chyba při načítání faktur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [filters]);

  if (loading) return <p>Načítání...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <InvoiceTable
      label="Aktivní faktury"
      items={invoices}
      onCancel={cancelInvoice}
    />
  );
};

export default ActiveInvoices;
