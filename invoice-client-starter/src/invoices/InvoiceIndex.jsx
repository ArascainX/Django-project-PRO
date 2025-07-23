import React, { useState } from "react";
import ActiveInvoices from "./ActiveInvoices";
import Archive from "./Archive";
import CreditNote from "./CreditNote";
import { Link } from "react-router-dom";
import { apiPost } from "../utils/api";

const TABS = {
  ACTIVE: "active",
  ARCHIVED: "archived",
  DELETED: "deleted",
};

const FILTER_LABELS = {
  buyerID: "ID kupujícího",
  sellerID: "ID prodávajícího",
  product: "Produkt",
  minPrice: "Min. cena",
  maxPrice: "Max. cena",
  limit: "Limit",
};

const InvoiceIndex = () => {
  const [activeTab, setActiveTab] = useState(TABS.ACTIVE);
  const [filters, setFilters] = useState({
    buyerID: "",
    sellerID: "",
    product: "",
    minPrice: "",
    maxPrice: "",
    limit: "",
  });

  const cancelInvoice = async (invoiceId) => {
    const reason = prompt("Zadejte důvod storna:");
    if (!reason) return;

    try {
      await apiPost(`/api/invoices/${invoiceId}/cancel/`, { reason });
      setFilters({ ...filters }); // refresh aktivních faktur
    } catch (error) {
      alert("❌ Nepodařilo se stornovat fakturu.");
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
  };

  const handleShowAll = () => {
    setFilters({
      buyerID: "",
      sellerID: "",
      product: "",
      minPrice: "",
      maxPrice: "",
      limit: "",
    });
  };

  const renderTab = () => {
    switch (activeTab) {
      case TABS.ARCHIVED:
        return <Archive />;
      case TABS.DELETED:
        return <CreditNote />;
      default:
        return (
          <>
            <form className="mb-3" onSubmit={handleFilterSubmit}>
              <div className="row g-2">
                {["buyerID", "sellerID", "product", "minPrice", "maxPrice", "limit"].map((field) => (
                  <div className="col" key={field}>
                    <input
                      type={field.includes("Price") || field === "limit" ? "number" : "text"}
                      className="form-control"
                      name={field}
                      placeholder={FILTER_LABELS[field]}
                      value={filters[field]}
                      onChange={handleFilterChange}
                    />
                  </div>
                ))}
                <div className="col-auto">
                  <button type="button" className="btn btn-secondary" onClick={handleShowAll}>
                    Reset filtrů
                  </button>
                </div>
              </div>
            </form>
            <ActiveInvoices
              filters={filters}
              cancelInvoice={cancelInvoice}
            />
          </>
        );
    }
  };

  return (
    <div className="invoice-index">
      <div className="invoice-header">
        <h1>Faktury</h1>
        <Link to="/invoices/create" className="btn btn-success">
          ✚ Nová faktura
        </Link>
      </div>

      <div className="tab-buttons my-3">
        <button
          className={`btn ${activeTab === TABS.ACTIVE ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveTab(TABS.ACTIVE)}
        >
          Aktivní
        </button>
        <button
          className={`btn mx-2 ${activeTab === TABS.ARCHIVED ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveTab(TABS.ARCHIVED)}
        >
          Archiv
        </button>
        <button
          className={`btn ${activeTab === TABS.DELETED ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveTab(TABS.DELETED)}
        >
          Dobropis
        </button>
      </div>

      {renderTab()}
    </div>
  );
};

export default InvoiceIndex;
