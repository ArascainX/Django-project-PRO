import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { apiGet, apiPost, apiPut } from "../utils/api";

import InputCheck from "../components/InputCheck";
import FlashMessage from "../components/FlashMessage";

import Country from "./Country";

const PersonForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [person, setPerson] = useState({
    name: "",
    identificationNumber: "",
    taxNumber: "",
    accountNumber: "",
    bankCode: "",
    iban: "",
    telephone: "",
    mail: "",
    street: "",
    zip: "",
    city: "",
    country: Country.CZECHIA,
    note: ""
  });

  const [sentState, setSent] = useState(false);
  const [successState, setSuccess] = useState(false);
  const [errorState, setError] = useState(null);

  useEffect(() => {
    if (id) {
      apiGet("/api/persons/" + id).then((data) => setPerson(data));
    }
  }, [id]);

  const handleChange = (field) => (e) =>
    setPerson({ ...person, [field]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();

    const action = id
      ? apiPut("/api/persons/" + id, person)
      : apiPost("/api/persons", person);

    action
      .then(() => {
        setSent(true);
        setSuccess(true);
        navigate("/persons");
      })
      .catch((error) => {
        setError(error.message);
        setSent(true);
        setSuccess(false);
      });
  };

  return (
    <div className="person-form">
      <h1>{id ? "Upravit" : "Vytvořit"} osoba</h1>
      <hr />
      {errorState && <div className="error">{errorState}</div>}
      {sentState && (
        <FlashMessage
          theme={successState ? "success" : ""}
          text={successState ? "Uložení osoby proběhlo úspěšně." : ""}
        />
      )}

      <form onSubmit={handleSubmit} noValidate>
        {[
          { label: "Jméno", field: "name", placeholder: "Zadejte celé jméno" },
          { label: "IČO", field: "identificationNumber", placeholder: "Zadejte IČO" },
          { label: "DIČ", field: "taxNumber", placeholder: "Zadejte DIČ" },
          {
            label: "Číslo bankovního účtu",
            field: "accountNumber",
            placeholder: "Zadejte číslo bankovního účtu",
          },
          { label: "Kód banky", field: "bankCode", placeholder: "Zadejte kód banky" },
          { label: "IBAN", field: "iban", placeholder: "Zadejte IBAN" },
          { label: "Telefon", field: "telephone", placeholder: "Zadejte telefon" },
          { label: "Mail", field: "mail", placeholder: "Zadejte mail", type: "email" },
          { label: "Ulice", field: "street", placeholder: "Zadejte ulici" },
          { label: "PSČ", field: "zip", placeholder: "Zadejte PSČ" },
          { label: "Město", field: "city", placeholder: "Zadejte město" },
          { label: "Poznámka", field: "note", placeholder: "Zadejte poznámku", required: false },
        ].map(({ label, field, placeholder, type = "text", required = true }) => (
          <div className="input-group" key={field}>
            <label htmlFor={field}>{label}</label>
            <input
              type={type}
              id={field}
              name={field}
              className="form-control"
              value={person[field] || ""}
              onChange={handleChange(field)}
              placeholder={placeholder}
              required={required}
              minLength={required ? 3 : undefined}
            />
          </div>
        ))}

        <div className="input-group">
          <label>Země</label>
          <div>
            <InputCheck
              type="radio"
              name="country"
              label="Česká republika"
              value={Country.CZECHIA}
              handleChange={handleChange("country")}
              checked={person.country === Country.CZECHIA}
            />
            <InputCheck
              type="radio"
              name="country"
              label="Slovensko"
              value={Country.SLOVAKIA}
              handleChange={handleChange("country")}
              checked={person.country === Country.SLOVAKIA}
            />
          </div>
        </div>

        <button type="submit">Uložit</button>
      </form>
    </div>
  );
};

export default PersonForm;
