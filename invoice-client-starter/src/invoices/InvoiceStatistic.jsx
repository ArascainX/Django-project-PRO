import React, { useEffect, useState } from "react";
import { apiGet } from "../utils/api";

const InvoiceStatistics = () => {
  const [summaryStats, setSummaryStats] = useState(null);
  const [companyStats, setCompanyStats] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Načtení souhrnných statistik faktur
    apiGet("/api/invoices/statistics")
      .then(data => setSummaryStats(data))
      .catch(err => setError("Chyba při načítání souhrnných statistik"));

    // Načtení statistik pro společnosti
    apiGet("/api/persons/statistics")
      .then(data => setCompanyStats(data))
      .catch(err => setError("Chyba při načítání statistik společností"));
  }, []);

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!summaryStats) {
    return <div>Načítám statistiky...</div>;
  }

  return (
    <div>
      <h1>Statistiky faktur</h1>
      <hr />

      <h3>Souhrnné statistiky</h3>
      <ul>
        <li>Počet faktur: {summaryStats.invoicesCount}</li>
        <li>Součet cen v letošním roce: {summaryStats.currentYearSum} Kč</li>
        <li>Součet cen za všechny roky: {summaryStats.allTimeSum} Kč</li>
      </ul>

      <h3>Statistiky společností</h3>
      {companyStats.length === 0 ? (
        <p>Žádné statistiky společností nebyly nalezeny.</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>ID společnosti</th>
              <th>Název společnosti</th>
              <th>Příjmy</th>
            </tr>
          </thead>
          <tbody>
            {companyStats.map(({ personId, personName, revenue }) => (
              <tr key={personId}>
                <td>{personId}</td>
                <td>{personName}</td>
                <td>{revenue} Kč</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default InvoiceStatistics;
