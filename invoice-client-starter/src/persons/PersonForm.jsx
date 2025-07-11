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

  // Nové stavy pro chyby
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");

  const [sentState, setSent] = useState(false);
  const [successState, setSuccess] = useState(false);
  const [errorState, setError] = useState(null);

  useEffect(() => {
    if (id) {
      apiGet("/api/persons/" + id).then((data) => setPerson(data));
    }
  }, [id]);

  const handleChange = (field) => (e) => {
    setPerson({ ...person, [field]: e.target.value });
    // Smazat chybu u pole při editaci
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
    setFormError("");
  };

  const validate = () => {
    const errors = {};
    if (!person.name.trim()) errors.name = "Osoba nemůže být prázdná";
    if (!person.street.trim()) errors.street = "Ulice nemůže být prázdná";
    if (!person.zip.trim()) errors.zip = "PSČ nemůže být prázdné";
    if (!person.city.trim()) errors.city = "Město nemůže být přázdné";
    if (!person.identificationNumber.trim()) errors.identificationNumber = "IČO nemůže být prázdné";
    if (!person.accountNumber.trim()) errors.accountNumber = "Číslo účtu nemůže být přázdné";
    if (!person.bankCode.trim()) errors.bankCode = "Kód banky nemůže být prázdný";
    if (!person.telephone.trim()) errors.telephone = "Telefon nemůže být prázdný";

    // Validace emailu
    if (!person.mail.trim()) {
      errors.mail = "Email nemůže být prázdný";
    } else {
      // Jednoduchý regex pro validaci emailu
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(person.mail)) {
        errors.mail = "Neplatná emailová adresa";
      }
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFormError("Prosím vyplňte všechna povinná pole správně.");
      return false;
    }
    return true;
    };


  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

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
        // Zpracování chyb z backendu (400 apod.)
        if (error.response && error.response.data) {
          setFieldErrors(error.response.data);
          setFormError("Některá pole obsahují chyby.");
        } else {
          setError(error.message);
        }
        setSent(true);
        setSuccess(false);
      });
  };

  return (
    <div className="person-form">
      <h1>{id ? "Upravit" : "Vytvořit"} osoba</h1>
      <hr />

      {formError && <div className="error" style={{ marginBottom: "1em" }}>{formError}</div>}

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
          { label: "IBAN", field: "iban", placeholder: "Zadejte IBAN", required: false },
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
            {fieldErrors[field] && (
              <div className="error" style={{ color: "red", marginTop: "0.2em" }}>
                {fieldErrors[field]}
              </div>
            )}
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
