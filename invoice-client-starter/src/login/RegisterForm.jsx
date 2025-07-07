import React, { useState } from "react";


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
      setMessage("✅ Registrace úspěšná, můžeš se přihlásit.");
      setFormData({ firstName: "", lastName: "", username: "", password: "", confirmPassword: "" });
    } else {
      setMessage(data.error || "❌ Něco se nepovedlo.");
    }
  };

  return (
    <div className="form-container">
      <h2>Register</h2>
      <p>Signup now and get full access to our app.</p>
      {message && <p className="message">{message}</p>}
      <form onSubmit={handleRegister}>
        <div className="name-fields">
          <input
            type="text"
            name="firstName"
            placeholder="Firstname"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="lastName"
            placeholder="Lastname"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>
        <input
          type="text"
          name="username"
          placeholder="Email"
          value={formData.username}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
        <button type="submit">Submit</button>
      </form>
      <p className="mt-2 text-center">Already have an account? <a href="/login">Sign in</a></p>
    </div>
  );
};

export default RegisterForm;