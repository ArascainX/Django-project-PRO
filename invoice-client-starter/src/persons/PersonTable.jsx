import React from "react";
import { Link } from "react-router-dom";

const PersonTable = ({ label, items, deletePerson }) => {
  return (
    <div>
      <p>{label} <strong>{items.length}</strong></p>

      {items.length === 0 ? (
        <div className="alert alert-warning">Žádné osoby nebyly nalezeny.</div>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Pořadí</th>
              <th>ID</th>
              <th>Jméno</th>
              <th>Akce</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item._id}>
                <td>{index + 1}</td>
                <td>{item._id}</td>
                <td>{item.name}</td>
                <td>
                  <div className="btn-group">
                    <Link to={`/persons/show/${item._id}`} className="btn btn-sm btn-info">
                      Zobrazit
                    </Link>
                    <Link to={`/persons/edit/${item._id}`} className="btn btn-sm btn-warning">
                      Upravit
                    </Link>
                    <button onClick={() => deletePerson(item._id)} className="btn btn-sm btn-danger">
                      Odstranit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PersonTable;
