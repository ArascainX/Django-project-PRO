import React, { useEffect, useState } from "react";
import { apiGet } from "../utils/api";
import InvoiceChart from "./InvoiceChart";  

const InvoiceStatistics = () => {
  const [summaryStats, setSummaryStats] = useState(null);
  const [companyStats, setCompanyStats] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    apiGet("/api/invoices/statistics")
      .then(setSummaryStats)
      .catch(() => setError("Chyba při načítání souhrnných statistik."));

    apiGet("/api/persons/statistics")
      .then(setCompanyStats)
      .catch(() => setError("Chyba při načítání statistik společností."));
  }, []);

  const filteredCompanies = companyStats.filter((c) =>
    c.personName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1>Statistiky faktur</h1>
      <hr />
      {error && <div className="alert alert-danger">{error}</div>}

      {summaryStats && (
        <div>
          <h3>Souhrnné statistiky</h3>
          <ul>
            <li>Počet faktur: {summaryStats.invoicesCount}</li>
            <li>Součet cen v letošním roce: {summaryStats.currentYearSum} Kč</li>
            <li>Součet cen za všechny roky: {summaryStats.allTimeSum} Kč</li>
          </ul>
        </div>
      )}
      <h2>Graf tržeb</h2>
      <div className="mb-5">
        <InvoiceChart />
      </div>

      <h3 className="mt-4">Statistiky společností</h3>

      <input
        type="text"
        className="form-control mb-3"
        placeholder="Hledat podle jména společnosti"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filteredCompanies.length === 0 ? (
        <p>Společnosti nebyly nalezeny.</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Název společnosti</th>
              <th>Fakturovaný příjem</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.map(({ personId, personName, revenue }) => (
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
