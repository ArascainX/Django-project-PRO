import { apiPost } from "../utils/api";
import { useState } from "react";

export default function DevSubscriptionSimulator() {
  const [status, setStatus] = useState(null);
  const [invoiceId, setInvoiceId] = useState("");

  const simulate = async () => {
    try {
      const res = await apiPost("/api/simulate-subscription/");
      setStatus(res.message || "Simulace úspěšná ✅");
    } catch (error) {
      setStatus("❌ Chyba při simulaci.");
    }
  };

  const simulatePaid = async () => {
    try {
      await apiPost(`/api/invoices/${invoiceId}/mark-paid/`);
      setStatus(`✅ Faktura ${invoiceId} označena jako zaplacená.`);
    } catch {
      setStatus("❌ Chyba při simulaci zaplacení.");
    }
  };

  return (
    <div className="dev-tools mt-4">
      <h5>🧪 Vývojářské nástroje</h5>

      <button className="btn btn-outline-primary mb-2" onClick={simulate}>
        Simulovat předplatné
      </button>

      <div className="form-group">
        <label>ID faktury:</label>
        <input
          type="text"
          className="form-control"
          value={invoiceId}
          onChange={(e) => setInvoiceId(e.target.value)}
        />
        <button className="btn btn-outline-success mt-2" onClick={simulatePaid}>
          Simulovat zaplacení faktury
        </button>
      </div>

      {status && <p className="mt-2 text-success">{status}</p>}
    </div>
  );
}
