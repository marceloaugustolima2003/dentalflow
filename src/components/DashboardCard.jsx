import React from "react";
import { Bar, Pie } from "react-chartjs-2";

export default function DashboardCard({ label, value, chartData }) {
  return (
    <div className="dashboard-card">
      <div className="dashboard-card-label">{label}</div>
      <div className="dashboard-card-value">{value !== undefined ? value : "--"}</div>
      {chartData && (
        <div className="dashboard-card-chart">
          {chartData.type === "pie" ? (
            <Pie data={chartData.data} />
          ) : (
            <Bar data={chartData.data} />
          )}
        </div>
      )}
    </div>
  );
}