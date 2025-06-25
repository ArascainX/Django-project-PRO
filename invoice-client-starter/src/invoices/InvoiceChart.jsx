import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const InvoiceChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("/api/invoices/monthly-summary/")
      .then((res) => res.json())
      .then((json) => setData(json));
  }, []);

  const chartData = {
    labels: data.map((item) => item.month),
    datasets: [
      {
        label: "Tržby",
        data: data.map((item) => item.total),
        backgroundColor: "#4e73df",
        stack: "stack1" // pro stacking
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      tooltip: { mode: "index", intersect: false }
    },
    interaction: { mode: "nearest", axis: "x", intersect: false },
    scales: {
      x: {
        stacked: true
      },
      y: {
        stacked: true
      }
    }
  };

  return (
    <div>
      <h2>Tržby dle měsíců</h2>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default InvoiceChart;
