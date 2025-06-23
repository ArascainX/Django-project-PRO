import React, { useEffect, useState } from "react";
import { apiGet, apiDelete } from "../utils/api";
import InvoiceTable from "./InvoiceTable";

const InvoiceIndex = () => {
    const [invoices, setInvoices] = useState([]);

    const fetchInvoices = () => {
        apiGet("/api/invoices")
            .then((data) => {
                setInvoices(data);
            })
            .catch((error) => {
                console.error("Chyba při načítání faktur:", error);
            });
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const deleteInvoice = (id) => {
        if (window.confirm("Opravdu chcete fakturu odstranit?")) {
            apiDelete("/api/invoices/" + id)
                .then(() => {
                    fetchInvoices(); 
                })
                .catch((error) => {
                    console.error("Chyba při mazání faktury:", error);
                });
        }
    };

    return (
        <div>
            <h1>Seznam faktur</h1>
            <InvoiceTable label="Počet faktur:" items={invoices} deleteInvoice={deleteInvoice} />
        </div>
    );
};

export default InvoiceIndex;
