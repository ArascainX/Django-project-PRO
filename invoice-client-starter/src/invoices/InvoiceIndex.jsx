import React, { useEffect, useState } from "react";
import { apiGet, apiDelete } from "../utils/api";
import InvoiceTable from "./InvoiceTable";

const InvoiceIndex = () => {
    const [invoices, setInvoices] = useState([]);
    const [filters, setFilters] = useState({
        buyerID: "",
        sellerID: "",
        product: "",
        minPrice: "",
        maxPrice: "",
        limit: ""
    });

    const fetchInvoices = () => {
        apiGet("/api/invoices/filter", filters)
            .then((data) => {
                setInvoices(data);
            })
            .catch((error) => {
                console.error("Chyba při načítání faktur:", error);
            });
    };

    useEffect(() => {
        fetchInvoices();
        // eslint-disable-next-line
    }, []);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchInvoices();
    };

    const deleteInvoice = (id) => {
        if (window.confirm("Opravdu chcete fakturu odstranit?")) {
            apiDelete("/api/invoices/" + id)
                .then(() => {
                    fetchInvoices(); // obnovíme seznam
                })
                .catch((error) => {
                    console.error("Chyba při mazání faktury:", error);
                });
        }
    };

    return (
        <div>
            <h1>Seznam faktur</h1>
            <form className="mb-3" onSubmit={handleFilterSubmit}>
                <div className="row g-2">
                    <div className="col">
                        <input
                            type="text"
                            className="form-control"
                            name="buyerID"
                            placeholder="ID kupujícího"
                            value={filters.buyerID}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="col">
                        <input
                            type="text"
                            className="form-control"
                            name="sellerID"
                            placeholder="ID prodávajícího"
                            value={filters.sellerID}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="col">
                        <input
                            type="text"
                            className="form-control"
                            name="product"
                            placeholder="Produkt"
                            value={filters.product}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="col">
                        <input
                            type="number"
                            className="form-control"
                            name="minPrice"
                            placeholder="Min. cena"
                            value={filters.minPrice}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="col">
                        <input
                            type="number"
                            className="form-control"
                            name="maxPrice"
                            placeholder="Max. cena"
                            value={filters.maxPrice}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="col">
                        <input
                            type="number"
                            className="form-control"
                            name="limit"
                            placeholder="Limit"
                            value={filters.limit}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="col-auto">
                        <button type="submit" className="btn btn-primary">
                            Filtrovat
                        </button>
                    </div>
                </div>
            </form>
            <InvoiceTable label="Počet faktur:" items={invoices} deleteInvoice={deleteInvoice} />
            {invoices.length === 0 && (
                <div className="alert alert-warning mt-3">
                    Nebyl nalezen žádný záznam.
                </div>
            )}
        </div>
    );
};

export default InvoiceIndex;