import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { apiGet } from "../utils/api";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const MONTHS = [
  "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
  "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
];

const PersonInvoiceChart = ({ personId, onBack }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (personId) {
      apiGet(`/api/persons/${personId}/invoice-summary/`)
        .then(setData)
        .catch(() => alert("Chyba při načítání dat."));
    }
  }, [personId]);

  if (!data || !data.monthly) return <p>Načítání...</p>;

  const received = data.monthly.received || Array(12).fill(0);
  const issued = data.monthly.issued || Array(12).fill(0);

  const chartData = {
    labels: MONTHS,
    datasets: [
      {
        label: "Výdaje",
        data: received,
        fill: false,
        tension: 0.4,
        borderColor: "rgb(223, 16, 16)",
        backgroundColor: "rgba(231, 12, 12, 0.5)",
        pointBackgroundColor: "rgb(85, 11, 11)",
      },
      {
        label: "Příjmy",
        data: issued,
        fill: false,
        tension: 0.4,
        borderColor: "rgb(60, 219, 20)",
        backgroundColor: "rgba(60, 219, 20, 0.5)",
        pointBackgroundColor: "rgb(23, 87, 7)",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      datalabels: {
        display: false,
      },
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.raw;
            const dataset = context.dataset.data;
            const total = dataset.reduce((acc, val) => acc + val, 0);
            const percent = ((value / total) * 100).toFixed(2);
            return `${context.label}: ${value.toLocaleString("cs-CZ")} Kč (${percent}%)`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return value.toLocaleString("cs-CZ") + " Kč";
          },
        },
      },
    },
  };

  return (
    <div>
      <h4>{data.personName} — Roční přehled faktur</h4>
      <button className="btn btn-secondary mb-3" onClick={onBack}>
        Zpět na přehled osob
      </button>

      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default PersonInvoiceChart;
