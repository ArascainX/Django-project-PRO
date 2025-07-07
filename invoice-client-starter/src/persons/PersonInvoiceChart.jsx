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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const MONTHS = [
  "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
  "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
];

const PersonInvoiceChart = ({ personId, onBack }) => {
  const currentYear = new Date().getFullYear();
  const [yearFrom, setYearFrom] = useState(currentYear - 1);
  const [yearTo, setYearTo] = useState(currentYear);
  const [data, setData] = useState(null);
  const [availableYears] = useState([2020, 2021, 2022, 2023, 2024, 2025]);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const result = await apiGet(`/api/persons/${personId}/invoice-summary/`, {
        year_from: yearFrom,
        year_to: yearTo,
      });
      setData(result);
    } catch (e) {
      setError("Nepodařilo se načíst data.");
      console.error(e);
    }
  };

  useEffect(() => {
    if (personId) {
      fetchData();
    }
  }, [personId, yearFrom, yearTo]);

  if (error) return <p>{error}</p>;
  if (!data || !data.monthly) return <p>Načítání dat...</p>;

  const chartData = {
    labels: MONTHS,
    datasets: [
      {
        label: "Výdaje",
        data: data.monthly.received || Array(12).fill(0),
        fill: false,
        tension: 0.3,
        borderColor: "rgba(239, 68, 68, 0.8)",
        backgroundColor: "rgba(239, 68, 68, 0.3)",
        pointBackgroundColor: "rgb(107, 6, 6)",
      },
      {
        label: "Příjmy",
        data: data.monthly.issued || Array(12).fill(0),
        fill: false,
        tension: 0.3,
        borderColor: "rgba(34, 197, 94, 0.8)",
        backgroundColor: "rgba(34, 197, 94, 0.3)",
        pointBackgroundColor: "rgb(16, 82, 14)",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      datalabels: false,
      legend: { position: "top" },
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
          callback: (value) => value.toLocaleString("cs-CZ") + " Kč",
        },
      },
    },
  };

  return (
    <div className="person-chart">
      <h4 className="chart-title">
        {data.personName} — Měsíční vývoj příjmů a výdajů
      </h4>

      <button className="btn btn-secondary mb-3" onClick={onBack}>
        Zpět na přehled osob
      </button>

      <div className="chart-controls mb-4">
        <div>
          <label>Od roku:</label>
          <select
            className="form-select"
            value={yearFrom}
            onChange={(e) => setYearFrom(Number(e.target.value))}
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Do roku:</label>
          <select
            className="form-select"
            value={yearTo}
            onChange={(e) => setYearTo(Number(e.target.value))}
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="chart-wrapper">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default PersonInvoiceChart;
