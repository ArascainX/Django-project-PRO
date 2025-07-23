import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const CreditNote = () => {
  const [creditNotes, setCreditNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    fetch("/api/invoices/deleted/", {
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Chyba při načítání dobropisů");
        return res.json();
      })
      .then((data) => {
        setCreditNotes(data.filter((inv) => inv.is_correction));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Chyba při načítání dobropisů:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Načítání...</div>;

  return (
    <div className="invoice-index">
      <div className="invoice-header">
        <h1>Dobropisy</h1>
      </div>

      {creditNotes.length === 0 ? (
        <div className="alert alert-info mt-4">Žádné dobropisy.</div>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>#</th>
              <th>Číslo</th>
              <th>Produkt</th>
              <th>Cena</th>
              <th>Datum</th>
              <th>Akce</th>
            </tr>
          </thead>
          <tbody>
            {creditNotes.map((inv, idx) => {
              const invoiceId = inv.id || inv._id;
              if (!invoiceId) return null;
              return (
                <tr key={invoiceId}>
                  <td>{idx + 1}</td>
                  <td>{inv.invoiceNumber}</td>
                  <td>{inv.product}</td>
                  <td>{Number(inv.price).toFixed(2)} Kč</td>
                  <td>{new Date(inv.issued).toLocaleDateString("cs-CZ")}</td>
                  <td>
                    <Link
                      to={`/invoices/show/${invoiceId}`}
                      className="btn btn-sm btn-info"
                    >
                      Zobrazit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CreditNote;
