import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PasswordInput from "../components/PasswordInput"; 

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
      navigate("/dashboard");
    } else {
      setError("❌ Neplatné uživatelské jméno nebo heslo.");
    }
  };

  return (
    <div className="form-container">
      <h2>Přihlášení</h2>
      {error && <p className="message error">{error}</p>}
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="E-mail"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"


        />
        <PasswordInput
          type="password"
          placeholder="Heslo"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          showStrength={false} 
        />
        <button type="submit">Přihlásit se</button>
      </form>
      <p className="mt-2 text-center">
        Ještě nemáš účet? <a href="/register">Zaregistruj se</a>
      </p>
    </div>
  );
};

export default LoginForm;
