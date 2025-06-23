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
  const [sentState, setSent] = useState(false);
  const [successState, setSuccess] = useState(false);
  const [errorState, setError] = useState(null);

  useEffect(() => {
    if (id) {
      apiGet("/api/invoices/" + id).then((data) => {
        setInvoice({
          ...data,
          issued: new Date(data.issued),
          dueDate: new Date(data.dueDate)
        });
      });
    }
  }, [id]);

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
        setError(error.message);
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
      <form onSubmit={handleSubmit}>
        <InputField
          required={true}
          type="text"
          name="invoiceNumber"
          label="Číslo faktury"
          value={invoice.invoiceNumber}
          handleChange={(e) => setInvoice({ ...invoice, invoiceNumber: e.target.value })}
        />

        <div className="form-group">
          <label>Datum vystavení</label>
          <DatePicker
            selected={invoice.issued}
            onChange={(date) => setInvoice({ ...invoice, issued: date })}
            className="form-control"
            dateFormat="yyyy-MM-dd"
          />
        </div>

        <div className="form-group">
          <label>Datum splatnosti</label>
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

        <InputField
          required={true}
          type="number"
          name="seller"
          label="ID prodávajícího"
          value={invoice.seller}
          handleChange={(e) => setInvoice({ ...invoice, seller: e.target.value })}
        />

        <InputField
          required={true}
          type="number"
          name="buyer"
          label="ID kupujícího"
          value={invoice.buyer}
          handleChange={(e) => setInvoice({ ...invoice, buyer: e.target.value })}
        />

        <input type="submit" className="btn btn-primary" value="Uložit" />
      </form>
    </div>
  );
};

export default InvoiceForm;
