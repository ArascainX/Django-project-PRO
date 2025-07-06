import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SubscriptionStatus from "./SubscriptionStatus";  

const Dashboard = () => {
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const userRes = await fetch("http://localhost:8000/api/me/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!userRes.ok) throw new Error("Nepodařilo se načíst uživatele");
        const userData = await userRes.json();
        setUsername(userData.full_name || userData.username);
      } catch {
        setUsername("Neznámý uživatel");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  if (loading) {
    return <div>Načítám data...</div>;
  }

  return (
    <div className="p-4 max-w-md mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4">Profil uživatele</h1>
      <p className="mb-4">
        Uživatel: <strong>{username}</strong>
      </p>
      <SubscriptionStatus />
      <button
        onClick={handleLogout}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Odhlásit se
      </button>
    </div>
  );
};

export default Dashboard;
