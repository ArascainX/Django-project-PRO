import React, { useState } from "react";

const evaluateStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score === 0) return { label: "", color: "", width: "0%" };
  if (score === 1) return { label: "Slabé", color: "#dc3545", width: "33%" };
  if (score === 2) return { label: "Střední", color: "#ffc107", width: "66%" };
  if (score >= 3) return { label: "Silné", color: "#198754", width: "100%" };
};

const PasswordInput = ({
  value,
  onChange,
  placeholder,
  name,
  autoComplete,
  showStrength = true,  
}) => {
  const [show, setShow] = useState(false);
  const strength = evaluateStrength(value);

  return (
    <>
      <div className="position-relative w-100">
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete || "current-password"}
          required
          className="form-control pe-5 custom-password-input"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? "Skrýt heslo" : "Zobrazit heslo"}
          title={show ? "Skrýt heslo" : "Zobrazit heslo"}
          className="btn btn-sm position-absolute end-0 translate-middle-y me-2 p-0"
          style={{
            top: "calc(50% - 8px)",
            width: "28px",
            height: "28px",
            color: "#6c757d",
            background: "transparent",
            border: "none",
            boxShadow: "none",
          }}
        >
          {show ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 640 512"
              style={{ width: "20px", height: "20px" }}
            >
              <path d="M634 471L34 7C28-1 16-2 8 4s-11 16-4 24l56 44C24 114 1 153 1 153c-5 9-5 21 0 30 52 94 149 189 319 189 60 0 112-15 155-38l95 74c7 6 17 5 23-3s5-18-3-24zM320 336c-38 0-72-21-90-52l29-23c12 19 33 31 61 31 24 0 45-11 58-28l30 23c-19 29-53 49-88 49zm147-33l-57-45c7-13 10-27 10-42 0-53-43-96-96-96-15 0-30 4-43 11l-57-45c29-19 64-30 100-30 170 0 267 95 319 189 5 9 5 21 0 30-19 33-48 67-86 96l-57-45c21-16 39-34 54-53z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 576 512"
              style={{ width: "20px", height: "20px" }}
            >
              <path d="M572.5 241.4C518.7 135.5 407.2 64 288 64S57.3 135.5 3.5 241.4a48.06 48.06 0 000 29.2C57.3 376.5 168.8 448 288 448s230.7-71.5 284.5-177.4a48.06 48.06 0 000-29.2zM288 400c-97.2 0-185.4-60.4-234.3-144C102.6 172.4 190.8 112 288 112s185.4 60.4 234.3 144C473.4 339.6 385.2 400 288 400zm0-240a96 96 0 1096 96 96 96 0 00-96-96zm0 144a48 48 0 1148-48 48 48 0 01-48 48z" />
            </svg>
          )}
        </button>
      </div>

      {showStrength && strength.label && (
        <div
          className="fw-semibold"
          style={{
            color: strength.color,
            userSelect: "none",
            position: "relative",
            bottom: "10px",
          }}
        >
          {strength.label}
          <div
            style={{
              height: "6px",
              backgroundColor: "#e9ecef",
              borderRadius: "4px",
              marginTop: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: strength.width,
                backgroundColor: strength.color,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default PasswordInput;
