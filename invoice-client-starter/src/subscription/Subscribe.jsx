import React from "react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe("pk_test_51RhvB0ER45SqKnktpcFmSkhlKZwhrJHyOQArmZaNrJBRmVtLUP4s6ICqEiMH1l7ckqrmB1UxbYnOVPuPpXpyOqRU00r6r4b1Lx");

const Subscribe = () => {
  const handleSubscribe = async () => {
    try {
      const token = localStorage.getItem("access_token");

      const res = await fetch("http://localhost:8000/api/create-checkout-session/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,  // Posíláme JWT token
        },
      });

      if (!res.ok) {
        throw new Error(`Network response was not ok: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const stripe = await stripePromise;

      await stripe.redirectToCheckout({ sessionId: data.sessionId });
    } catch (error) {
      console.error("Chyba při zakoupení předplatného:", error);
    }
  };

  return (
    <div className="text-center subscribe-page">
      <h2 className="subscribe-title"><u>Předplatné Premium</u></h2>
      <p className="subscribe-text">
        Získej přístup k <strong>prémiovým funkcím</strong> a podpoř vývoj aplikace!
      </p>

      <p className="subscribe-price">Cena: 350 Kč měsíčně</p>
      <p className="subscribe-text">Předplatné lze kdykoliv zrušit.</p>
      <p className="subscribe-text">Po zakoupení předplatného se ti odemknou všechny prémiové funkce.</p>

      <div className="subscribe-advantages">
        <p>✅ Neomezený počet faktur</p>
        <p>🧾 Export faktur do PDF</p>
        <p>📊 Přehledné grafy příjmů a výdajů</p>
        <p>🌙 Možnost tmavého režimu</p>
      </div>

      <button onClick={handleSubscribe} className="subscribe-button">
        💎 Zakoupit předplatné 💎
      </button>
    </div>
  );
};

export default Subscribe;