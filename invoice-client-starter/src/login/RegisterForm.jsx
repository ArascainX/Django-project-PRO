import React, { useState } from "react";
import PasswordInput from "../components/PasswordInput";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validace hesla
    if (formData.password !== formData.confirmPassword) {
      setMessage("❌ Hesla se neshodují.");
      return;
    }

    if (formData.password.length < 6) {
      setMessage("❌ Heslo musí mít alespoň 6 znaků.");
      return;
    }

    const res = await fetch("http://localhost:8000/api/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: formData.username, password: formData.password }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("✅ Registrace proběhla úspěšně, nyní se můžeš přihlásit.");
      setFormData({ firstName: "", lastName: "", username: "", password: "", confirmPassword: "" });
    } else {
      setMessage(data.error || "❌ Něco se nepovedlo.");
    }
  };

  return (
    <div className="form-container">
      <h2>Registrace</h2>
      <p>Zaregistruj se a získej plný přístup k aplikaci.</p>
      {message && <p className="message">{message}</p>}
      <form onSubmit={handleRegister}>
        <div className="name-fields">
          <input
            type="text"
            name="firstName"
            placeholder="Jméno"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="lastName"
            placeholder="Příjmení"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>
        <input
          type="text"
          name="username"
          placeholder="E-mail"
          value={formData.username}
          onChange={handleChange}
          required
          autoComplete="username"
        />
        <PasswordInput
          type="password"
          name="password"
          placeholder="Heslo"
          value={formData.password}
          onChange={handleChange}
          required
          autoComplete="new-password"
          className="form-container"
        />
        <PasswordInput
          type="password"
          name="confirmPassword"
          placeholder="Potvrď heslo"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          autoComplete="new-password"
        />
        <button type="submit">Registrovat</button>
      </form>
      <p className="mt-2 text-center">
        Už máš účet? <a href="/login">Přihlas se</a>
      </p>
    </div>
  );
};

export default RegisterForm;
