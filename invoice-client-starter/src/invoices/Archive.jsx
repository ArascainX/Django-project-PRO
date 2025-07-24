import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Archive = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchArchivedInvoices = () => {
    const token = localStorage.getItem("access_token");
    fetch("/api/invoices/archived/", {
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Chyba při načítání archivu");
        return res.json();
      })
      .then((data) => {
        const storno = data.filter((inv) => inv.is_cancelled);
        setInvoices(storno);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchArchivedInvoices();
  }, []);

  const restoreInvoice = async (id) => {
      if (!window.confirm("Chcete opravdu fakturu obnovit?")) {
        return;
      }

      const token = localStorage.getItem("access_token");
      try {
        const response = await fetch(`api/invoice-actions/${id}/restore/`, {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error("Nelze obnovit fakturu");

        const data = await response.json();

        setSuccessMessage(`Faktura byla úspěšně obnovena a byl smazán příslušný dobropis. Celkem: ${data.deleted_corrections_count} dobropis`);

        fetchArchivedInvoices(); 

        setTimeout(() => setSuccessMessage(""), 8000);
      } catch (error) {
        alert("Chyba při obnovování faktury: " + error.message);
      }
    };


  if (loading) return <div>Načítání...</div>;

  return (
    <div className="invoice-index">
      <div className="invoice-header">
        <h1>Archiv stornovaných faktur</h1>
      </div>

      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="alert alert-info mt-4">Žádné stornované faktury.</div>
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
            {invoices.map((inv, idx) => {
              const invoiceId = inv.id || inv._id;
              if (!invoiceId) return null;

              return (
                <tr key={invoiceId}>
                  <td>{idx + 1}</td>
                  <td>{inv.invoiceNumber}</td>
                  <td>{inv.product}</td>
                  <td>
                    {Number(inv.price).toLocaleString("cs-CZ", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    Kč
                  </td>
                  <td>{new Date(inv.issued).toLocaleDateString("cs-CZ")}</td>
                  <td>
                    <Link
                      to={`/invoices/show/${invoiceId}`}
                      className="btn btn-sm btn-info me-2"
                    >
                      Zobrazit
                    </Link>
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => restoreInvoice(invoiceId)}
                    >
                      Obnovit
                    </button>
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

export default Archive;
