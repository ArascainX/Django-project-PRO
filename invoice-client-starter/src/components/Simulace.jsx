import { apiPost } from "../utils/api";
import { useState } from "react";

export default function DevSubscriptionSimulator() {
  const [status, setStatus] = useState(null);

  const simulate = async () => {
    try {
      const res = await apiPost("/api/simulate-subscription/");
      setStatus(res.message || "Simulace úspěšná ✅");
    } catch (error) {
      setStatus("❌ Chyba při simulaci.");
    }
  };

  return (
    <div className="">
        <br />
      <h5>🧪 Vývojářské nástroje</h5>
      <button className="btn btn-outline-primary" onClick={simulate}>
        Simulovat předplatné
      </button>
      {status && <p className="mt-2 text-success">{status}</p>}
    </div>
  );
}
