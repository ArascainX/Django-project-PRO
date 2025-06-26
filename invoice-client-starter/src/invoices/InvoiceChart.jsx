import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { apiGet } from "../utils/api";

// Globální registrace včetně datalabels pluginu
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ChartDataLabels);

const MONTHS = [
  "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
  "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
];

const InvoiceChart = () => {
  const currentYear = new Date().getFullYear();
  const availableYears = [2020, 2021, 2022, 2023, 2024, 2025];

  const [fromYear, setFromYear] = useState(2022);
  const [toYear, setToYear] = useState(currentYear);
  const [viewMode, setViewMode] = useState("monthly");
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);
  const [totalSum, setTotalSum] = useState(0);

  const loadData = async () => {
    setChartData(null);
    setError(null);

    try {
      if (viewMode === "monthly") {
        const datasets = [];
        let globalTotal = 0;

        for (let year = fromYear; year <= toYear; year++) {
          const data = await apiGet(`/api/invoices/monthly-summary?year=${year}`);
          const monthlyTotals = Array(12).fill(0);

          data.forEach(({ month, total }) => {
            const monthIndex = parseInt(month.split("-")[1], 10) - 1;
            monthlyTotals[monthIndex] = parseFloat(total);
          });

          const yearTotal = monthlyTotals.reduce((acc, val) => acc + val, 0);
          globalTotal += yearTotal;

          datasets.push({
            label: `Rok ${year}`,
            data: monthlyTotals,
            backgroundColor: `hsla(${(year - 2020) * 60}, 70%, 50%, 0.6)`,
            borderColor: `hsl(${(year - 2020) * 60}, 70%, 40%)`,
            borderWidth: 1,
          });
        }

        setTotalSum(globalTotal);

        setChartData({
          labels: MONTHS,
          datasets,
        });
      }

      if (viewMode === "yearly") {
        const data = await apiGet(`/api/invoices/yearly-summary`);
        const labels = data.map(d => d.year);
        const totals = data.map(d => parseFloat(d.total));
        const sum = totals.reduce((acc, v) => acc + v, 0);
        setTotalSum(sum);

        setChartData({
          labels,
          datasets: [
            {
              label: "Roční tržby",
              data: totals,
              backgroundColor: "rgba(54, 162, 235, 0.6)",
              borderColor: "rgba(54, 162, 235, 1)",
              borderWidth: 1,
            },
          ],
        });
      }
    } catch (err) {
      setError("Nepodařilo se načíst data pro graf.");
    }
  };

  useEffect(() => {
    loadData();
  }, [fromYear, toYear, viewMode]);

  return (
    <div>
      <div className="row mb-3">
        <div className="col-md-3">
          <label className="form-label">Zobrazit:</label>
          <select
            className="form-select"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="monthly">Měsíční tržby</option>
            <option value="yearly">Roční tržby</option>
          </select>
        </div>

        {viewMode === "monthly" && (
          <>
            <div className="col-md-3">
              <label className="form-label">Od roku:</label>
              <select
                className="form-select"
                value={fromYear}
                onChange={(e) => setFromYear(Number(e.target.value))}
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Do roku:</label>
              <select
                className="form-select"
                value={toYear}
                onChange={(e) => setToYear(Number(e.target.value))}
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {!chartData ? (
        <p>Načítám graf...</p>
      ) : (
        <>
          <div style={{ maxWidth: "1400px", height: "400px", overflowX: "auto" }}>
            <Bar
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
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
                  datalabels: {
                    display: viewMode === "yearly",
                    anchor: "end",
                    align: "start",
                    offset: 0,
                    formatter: (value, context) => {
                      const data = context.chart.data.datasets[0].data;
                      const total = data.reduce((acc, v) => acc + v, 0);
                      const percent = ((value / total) * 100).toFixed(1);
                      return `${value.toLocaleString("cs-CZ")} Kč\n(${percent}%)`;
                    },
                    font: {
                      weight: "bold",
                      size: 12,
                    },
                    color: "#000",
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
            {viewMode === "monthly" && (
              <>
                <strong>Celkový součet:</strong>{" "}
                <span>{totalSum.toLocaleString("cs-CZ")} Kč</span>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default InvoiceChart;
