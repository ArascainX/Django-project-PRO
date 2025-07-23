import { apiPost, apiDelete } from "../utils/api";
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

  const simulateDelete = async () => {
    if (!window.confirm("Opravdu trvale odstranit fakturu?")) return;

    try {
      const res = await apiDelete(`/api/invoices/${invoiceId}/destroy/`);
      setStatus(res.message || `🗑 Faktura ${invoiceId} odstraněna.`);
    } catch (error) {
      const err =
        error?.response?.data?.error || error?.response?.data?.message || "Chyba při mazání.";
      setStatus(`❌ ${err}`);
    }
  };

  return (
    <div className="dev-tools mt-4 p-4 border">
      <h5>🧪 Vývojářské nástroje 🧪</h5>

      <button className="btn btn-outline-primary mb-3" onClick={simulate}>
        ♻️ Simulovat předplatné
      </button>

      <div className="form-group mb-3">
        <label>ID faktury:</label>
        <input
          type="text"
          className="form-control"
          value={invoiceId}
          onChange={(e) => setInvoiceId(e.target.value)}
          placeholder="Např. 42"
        />
      </div>

      <div className="d-flex gap-2 mb-3">
        <button className="btn btn-outline-success" onClick={simulatePaid}>
          ✅ Simulovat zaplacení faktury
        </button>

        <button className="btn btn-outline-danger" onClick={simulateDelete}>
          🗑 Trvale odstranit fakturu
        </button>
      </div>

      {status && <p className="mt-3 text-success">{status}</p>}
    </div>
  );
}
