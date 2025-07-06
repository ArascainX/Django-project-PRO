import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:8000/api/token/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      setError(null);
      navigate("/dashboard"); // Přesměrování na dashboard po úspěšném přihlášení
    } else {
      setError("Neplatné uživatelské jméno nebo heslo");
    }
  };

  return (
    <div className="p-4 max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-4">Přihlášení</h2>
      {error && <p className="mb-4 text-red-600">{error}</p>}
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Uživatelské jméno"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="border p-2 mb-2 w-full"
        />
        <input
          type="password"
          placeholder="Heslo"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border p-2 mb-4 w-full"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
        >
          Přihlásit se
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
