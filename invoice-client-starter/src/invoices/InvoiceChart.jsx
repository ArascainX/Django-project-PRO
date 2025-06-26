import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { apiGet } from "../utils/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const MONTHS = [
  "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
  "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
];

const InvoiceChart = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [chartData, setChartData] = useState(null);
  const [yearTotal, setYearTotal] = useState(0);
  const [error, setError] = useState(null);

  const loadData = (year) => {
    setChartData(null); // reset při načítání
    apiGet(`/api/invoices/monthly-summary?year=${year}`)
      .then((data) => {
        const monthlyTotals = Array(12).fill(0);
        data.forEach(({ month, total }) => {
          const monthIndex = parseInt(month.split("-")[1], 10) - 1;
          monthlyTotals[monthIndex] = parseFloat(total);
        });

        const totalSum = monthlyTotals.reduce((acc, val) => acc + val, 0);
        setYearTotal(totalSum);

        setChartData({
          labels: MONTHS,
          datasets: [
            {
              label: `Tržby za rok ${year}`,
              data: monthlyTotals,
              backgroundColor: "rgba(16, 34, 229, 0.6)",
              borderColor: "rgb(29, 71, 177)",
              borderWidth: 1,
            },
          ],
        });
      })
      .catch(() => setError("Nepodařilo se načíst data pro graf."));
  };

  useEffect(() => {
    loadData(selectedYear);
  }, [selectedYear]);

  const availableYears = [2022, 2023, 2024, 2025];

  return (
    <div>
      <div className="mb-3">
        <label htmlFor="yearSelect" className="form-label">Zvolte rok:</label>
        <select
          id="yearSelect"
          className="form-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {!chartData ? (
        <p>Načítám graf...</p>
      ) : (
        <>
          <div style={{ maxWidth: "100%", height: "400px" }}>
            <Bar
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "top" },
                  tooltip: {
                    mode: "index",
                    intersect: false,
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
              }}
            />
          </div>
          <div className="mt-3">
            <strong>Celkový součet za {selectedYear}:</strong>{" "}
            {yearTotal.toLocaleString("cs-CZ")} Kč
          </div>
        </>
      )}
    </div>
  );
};

export default InvoiceChart;
