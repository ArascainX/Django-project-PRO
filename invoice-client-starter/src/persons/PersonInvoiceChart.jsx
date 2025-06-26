import React, { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { apiGet } from "../utils/api";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const PersonInvoiceChart = ({ personId, onBack }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (personId) {
      apiGet(`/api/persons/${personId}/invoice-summary/`)
        .then(setData)
        .catch(() => alert("Chyba při načítání dat."));
    }
  }, [personId]);

  if (!data) return <p>Načítání...</p>;

  const chartData = {
    labels: ["Přijaté faktury", "Vystavené faktury"],
    datasets: [
      {
        label: "Součet částek",
        data: [data.received.sum, data.issued.sum],
        backgroundColor: [
          "rgba(255, 64, 64, 0.82)",
          "rgba(54, 162, 235, 0.6)"
        ],
        borderColor: [
          "rgb(255, 105, 64)",
          "rgba(54, 162, 235, 1)"
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.raw;
            const data = context.dataset.data;
            const total = data.reduce((acc, val) => acc + val, 0);
          const percent = ((value / total) * 100).toFixed(2);
            return `${context.label}: ${value.toLocaleString("cs-CZ")} Kč (${percent}%)`;
          },
        },
      },
    },
  };

  return (
    <div>
      <h4>{data.personName} — podíl fakturovaných částek</h4>
      <button className="btn btn-secondary mb-3" onClick={onBack}>
        Zpět na přehled
      </button>

      <div style={{ maxWidth: "400px", margin: "0 auto" }}>
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
};

export default PersonInvoiceChart;
