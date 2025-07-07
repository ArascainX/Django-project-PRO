import React, { useEffect, useState } from "react";
import { apiGet } from "../utils/api";
import InvoiceChart from "./InvoiceChart";  
import PersonInvoiceChart from "../persons/PersonInvoiceChart";

const InvoiceStatistics = () => {
  const [summaryStats, setSummaryStats] = useState(null);
  const [companyStats, setCompanyStats] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [selectedPersonId, setSelectedPersonId] = useState(null);

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
    <div className="invoice-statistics">
      <h1>Statistiky faktur</h1>
      <hr />
      {error && <div className="alert alert-danger">{error}</div>}

        {summaryStats && (
          <div>
            <h3>Souhrnné statistiky</h3>
            <ul>
              <li>Počet faktur: {summaryStats.invoicesCount}</li>
              <li>
                Součet cen v letošním roce:{" "}
                {summaryStats.currentYearSum.toLocaleString("cs-CZ", {})}{" "}
                Kč
              </li>
              <li>
                Součet cen za všechny roky:{" "}
                {summaryStats.allTimeSum.toLocaleString("cs-CZ", {})}{" "}
                Kč
              </li>
            </ul>
          </div>
        )}

        <h2>Graf tržeb</h2>
        <div className="mb-5">
          <InvoiceChart />
        </div>
        
      <h3 className="mt-4">Statistiky společností</h3>
      {selectedPersonId ? (
          <PersonInvoiceChart
          personId={selectedPersonId}
          onBack={() => setSelectedPersonId(null)}
          />
          ) : (
          <></>
          )}
          <br></br>
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
              <tr key={personId} onClick={() => setSelectedPersonId(personId)} style={{ cursor: 'pointer' }}>
                <td>{personId}</td>
                <td>{personName}</td>
                <td>{revenue.toLocaleString("cs-CZ", {})} Kč</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default InvoiceStatistics;
