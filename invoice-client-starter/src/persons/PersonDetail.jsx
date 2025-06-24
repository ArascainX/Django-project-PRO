import React, {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {apiGet} from "../utils/api";

import Country from "./Country";

const PersonDetail = () => {
  const { id } = useParams();
  const [person, setPerson] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [invoiceType, setInvoiceType] = useState("");

  useEffect(() => {
    apiGet("/api/persons/" + id)
      .then((data) => {
        setPerson(data);
      })
      .catch((error) => {
        console.error("Chyba při načítání osoby:", error);
      });
  }, [id]);

  const country = Country.CZECHIA === person.country ? "Česká republika" : "Slovensko";

  const getSalesByIco = (ico) =>
    apiGet(`/api/identification/${ico}/sales/`);

  const getPurchasesByIco = (ico) =>
    apiGet(`/api/identification/${ico}/purchases/`);

  const handleSalesClick = () => {
    getSalesByIco(person.identificationNumber).then((data) => {
      setInvoices(data);
      setInvoiceType("sales");
    });
  };

  const handlePurchasesClick = () => {
    getPurchasesByIco(person.identificationNumber).then((data) => {
      setInvoices(data);
      setInvoiceType("purchases");
    });
  };

  return (
    <>
      <div>
        <h1>Detail osoby</h1>
        <hr />
        <h3>{person.name} ({person.identificationNumber})</h3>
        <p><strong>DIČ:</strong><br />{person.taxNumber}</p>
        <p><strong>Bankovní účet:</strong><br />{person.accountNumber}/{person.bankCode} ({person.iban})</p>
        <p><strong>Tel.:</strong><br />{person.telephone}</p>
        <p><strong>Mail:</strong><br />{person.mail}</p>
        <p><strong>Sídlo:</strong><br />{person.street}, {person.city}, {person.zip}, {country}</p>
        <p><strong>Poznámka:</strong><br />{person.note}</p>

        <div className="mt-4 flex gap-3">
          <button onClick={handleSalesClick} className="btn btn-sm btn-info">
            Vystavené faktury
          </button>
          <button onClick={handlePurchasesClick} className="btn btn-sm btn-warning">
            Přijaté faktury
          </button>
        </div>

        {invoiceType && (
          <div className="mt-6">
            <h4 className="text-lg font-bold mb-2">
              {invoiceType === "sales" ? "Vystavené" : "Přijaté"} faktury
            </h4>
            
             <p>
              Počet faktur: <strong>{invoices.length}</strong>
            </p>

            {invoices.length === 0 ? (
              <p>Žádné faktury nenalezeny.</p>
            ) : (
              <ul className="space-y-2">
                {invoices.map((invoice) => (
                  <li key={invoice._id} className="border p-3 rounded shadow-sm">
                    <strong>Číslo faktury:</strong> {invoice.invoiceNumber}<br />
                    <strong>Produkt:</strong> {invoice.product}<br />
                    <strong>Cena:</strong> {invoice.price} Kč<br />
                    <strong>Datum vystavení:</strong> {invoice.issued}<br />
                    <strong>Datum splatnosti:</strong> {invoice.dueDate}<br />
                    <strong>Odběratel:</strong> {invoice.buyer?.name || "-"} <br />
                    <strong>Poznámka:</strong> {invoice.note}<br />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default PersonDetail;
