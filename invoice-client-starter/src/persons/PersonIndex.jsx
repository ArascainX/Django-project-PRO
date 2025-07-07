import React, { useEffect, useState } from "react";
import { apiDelete, apiGet } from "../utils/api";
import PersonTable from "./PersonTable";

const PersonIndex = () => {
  const [persons, setPersons] = useState([]);

  useEffect(() => {
    const fetchPersons = async () => {
      try {
        const data = await apiGet("/api/persons");
        setPersons(data);
      } catch (error) {
        console.error("Chyba při načítání osob:", error);
      }
    };

    fetchPersons();
  }, []);

  const deletePerson = async (id) => {
    if (!window.confirm("Opravdu chcete osobu odstranit?")) return;

    try {
      await apiDelete("/api/persons/" + id);
      setPersons(persons.filter((item) => item._id !== id));
    } catch (error) {
      console.log(error.message);
      alert(error.message);
    }
  };

  return (
    <div className="invoice-index">
      <div className="invoice-header">
        <h1>Seznam osob</h1>
        <a href="/persons/create" className="btn btn-success">
          ✚ Nová osoba
        </a>
      </div>

      <PersonTable
        deletePerson={deletePerson}
        items={persons}
        label="Počet osob:"
      />
    </div>
  );
};

export default PersonIndex;
