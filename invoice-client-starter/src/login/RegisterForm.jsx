import React, { useState } from "react";

const RegisterForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:8000/api/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("✅ Registrace úspěšná, můžeš se přihlásit.");
      setUsername("");
      setPassword("");
    } else {
      setMessage(data.error || "❌ Něco se nepovedlo.");
    }
  };

  return (
    <div className="p-4 max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-4">Registrace</h2>
      {message && <p className="mb-4">{message}</p>}
      <form onSubmit={handleRegister}>
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
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
        >
          Registrovat
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
