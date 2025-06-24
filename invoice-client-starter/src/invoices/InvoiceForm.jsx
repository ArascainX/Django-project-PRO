import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGet, apiPost, apiPut } from "../utils/api";
import InputField from "../components/InputField";
import FlashMessage from "../components/FlashMessage";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const InvoiceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [invoice, setInvoice] = useState({
    invoiceNumber: "",
    issued: new Date(),
    dueDate: new Date(),
    product: "",
    price: "",
    vat: "",
    note: "",
    buyer: "",
    seller: ""
  });
  const [buyerName, setBuyerName] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [people, setPeople] = useState([]);
  const [sentState, setSent] = useState(false);
  const [successState, setSuccess] = useState(false);
  const [errorState, setErrorState] = useState(null);

  useEffect(() => {
    apiGet("/api/persons").then(setPeople);

    if (id) {
      apiGet("/api/invoices/" + id).then((data) => {
        setInvoice({
          ...data,
          issued: new Date(data.issued),
          dueDate: new Date(data.dueDate)
        });
        fetchPersonName(data.buyer, setBuyerName);
        fetchPersonName(data.seller, setSellerName);
      });
    }
  }, [id]);

  const fetchPersonName = (personId, setNameFn) => {
    if (personId) {
      apiGet("/api/persons/" + personId)
        .then((data) => setNameFn(data.name))
        .catch(() => setNameFn(""));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...invoice,
      issued: invoice.issued.toISOString().split("T")[0],
      dueDate: invoice.dueDate.toISOString().split("T")[0]
    };

    const action = id ? apiPut("/api/invoices/" + id, payload) : apiPost("/api/invoices", payload);

    action
      .then(() => {
        setSent(true);
        setSuccess(true);
        navigate("/invoices");
      })
      .catch((error) => {
        console.error(error.message);
        setErrorState(error.message);
        setSent(true);
        setSuccess(false);
      });
  };

  return (
    <div>
      <h1>{id ? "Upravit" : "Vytvořit"} fakturu</h1>
      <hr />
      {errorState && <div className="alert alert-danger">{errorState}</div>}
      {sentState && (
        <FlashMessage
          theme={successState ? "success" : ""}
          text={successState ? "Faktura byla úspěšně uložena." : ""}
        />
      )}
        <InputField
        required={true}
        type="text"
        name="invoiceNumber"
        label="Číslo faktury"
        value={invoice.invoiceNumber}
        handleChange={(e) => setInvoice({ ...invoice, invoiceNumber: e.target.value })}
      />
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Prodávající</label>
          <select
            className="form-select"
            value={invoice.seller}
            onChange={(e) => {
              setInvoice({ ...invoice, seller: e.target.value });
              fetchPersonName(e.target.value, setSellerName);
            }}
            required
          >
            <option value="" disabled hidden>
              {sellerName || "-- Vyberte osobu --"}
            </option>
            {people.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Kupující</label>
          <select
            className="form-select"
            value={invoice.buyer}
            onChange={(e) => {
              setInvoice({ ...invoice, buyer: e.target.value });
              fetchPersonName(e.target.value, setBuyerName);
            }}
            required
          >
            <option value="">-- Vyberte osobu --</option>
            {people.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Datum vystavení</label>
          <DatePicker
            selected={invoice.issued}
            onChange={(date) => setInvoice({ ...invoice, issued: date })}
            className="form-control"
            dateFormat="yyyy-MM-dd"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Datum splatnosti</label>
          <DatePicker
            selected={invoice.dueDate}
            onChange={(date) => setInvoice({ ...invoice, dueDate: date })}
            className="form-control"
            dateFormat="yyyy-MM-dd"
          />
        </div>

        <InputField
          required={true}
          type="text"
          name="product"
          label="Produkt"
          value={invoice.product}
          handleChange={(e) => setInvoice({ ...invoice, product: e.target.value })}
        />

        <InputField
          required={true}
          type="number"
          name="price"
          label="Cena"
          value={invoice.price}
          handleChange={(e) => setInvoice({ ...invoice, price: e.target.value })}
        />

        <InputField
          required={true}
          type="number"
          name="vat"
          label="DPH (%)"
          value={invoice.vat}
          handleChange={(e) => setInvoice({ ...invoice, vat: e.target.value })}
        />

        <InputField
          required={false}
          type="text"
          name="note"
          label="Poznámka"
          value={invoice.note}
          handleChange={(e) => setInvoice({ ...invoice, note: e.target.value })}
        />

        <input type="submit" className="btn btn-primary" value="Uložit" />
      </form>
    </div>
  );
};

export default InvoiceForm;
