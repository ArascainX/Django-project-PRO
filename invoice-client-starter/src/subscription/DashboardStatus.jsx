import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DevSubscriptionSimulator from "../components/Simulator";
import UserInbox from "../components/UserInbox";


const DashboardStatus = () => {
  const [username, setUsername] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        // Načtení uživatelských dat
        const userRes = await fetch("http://localhost:8000/api/me/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!userRes.ok) throw new Error("Nepodařilo se načíst uživatele");
        const userData = await userRes.json();
        setUsername(userData.full_name || userData.username);

        // Načtení stavu předplatného
        const subRes = await fetch("http://localhost:8000/api/status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!subRes.ok) throw new Error("Nepodařilo se načíst stav předplatného");
        const subData = await subRes.json();
        setSubscription(subData);
      } catch (error) {
        setUsername("Neznámý uživatel");
        setSubscription({ active: false }); // Výchozí hodnota při chybě
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

    const handleLogout = () => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      navigate("/login");
    };

    if (loading) {
      return <div className="dashboard-status loading">Načítám data...</div>;
    }

    const handleCancel = async () => {
    const res = await fetch("http://localhost:8000/api/cancel-subscription/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      setSubscription((prev) => ({ ...prev, active: false, cancelled: true }));
    }
  };

  const handleRenew = async () => {
    const res = await fetch("http://localhost:8000/api/renew-subscription/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      setSubscription((prev) => ({ ...prev, active: true, cancelled: false }));
    }
  };

  return (
    <div className="dashboard-status">
      <h1>Profil uživatele</h1>
      <p>
        Uživatel: <strong>{username}</strong>
      </p>
      {subscription && (
        <div className="subscription-section">
          <h2>Předplatné</h2>
          {subscription.active ? (
            <div className="active">
              ✅ Aktivní předplatné do: <strong>{subscription.current_period_end}</strong>
              <br />
              <button className="btn btn-danger mt-2" onClick={handleCancel}>
                Zrušit předplatné
              </button>
            </div>
          ) : subscription.cancelled ? (
            <div className="cancelled">
              ⚠️ Předplatné bylo zrušeno, ale máte přístup do:{" "}
              <strong>{subscription.current_period_end}</strong>
              <br />
              <button className="btn btn-success mt-2" onClick={handleRenew}>
                Obnovit předplatné
              </button>
            </div>
          ) : (
            <div className="inactive">❌ Nemáte aktivní předplatné.</div>
          )}
          <br />
          <UserInbox />
        </div> 
      )}

      <div className="subscribe-advantages">
        <p>✅ Neomezený počet faktur</p>
        <p>🧾 Export faktur do PDF</p>
        <p>📊 Přehledné grafy příjmů a výdajů</p>
        <p>🔒 Prémiová podpora</p>
      </div>
      <button onClick={handleLogout}>Odhlásit se</button>
      <DevSubscriptionSimulator />
    </div>
  );
};

export default DashboardStatus;