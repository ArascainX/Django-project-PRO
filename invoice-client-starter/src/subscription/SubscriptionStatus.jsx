import React, { useEffect, useState } from "react";
import { apiGet } from "../utils/api";

const SubscriptionStatus = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/api/status")
      .then(setSubscription)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Načítání...</div>;

  return (
    <div className="p-4 border rounded shadow-sm mb-4">
      <h2 className="text-lg font-bold mb-2">Předplatné</h2>
      {subscription && subscription.active ? (
        <div className="text-green-600">
          ✅ Aktivní předplatné do: <strong>{subscription.current_period_end}</strong>
        </div>
      ) : (
        <div className="text-red-600">
          ❌ Nemáte aktivní předplatné.
        </div>
      )}
      <ul className="list-disc pl-5 mt-3">
        <li>🧾 Export faktur do PDF</li>
        <li>📊 Přehledné grafy příjmů a výdajů</li>
        <li>🌙 Možnost tmavého režimu</li>
      </ul>
    </div>
  );
};

export default SubscriptionStatus;
