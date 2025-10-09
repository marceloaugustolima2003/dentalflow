import React from "react";
import DashboardCard from "./DashboardCard";

export default function DashboardBoard({ board }) {
  return (
    <div className="dashboard-board">
      <h2 className="dashboard-board-title">{board.title}</h2>
      <div className="dashboard-board-cards">
        {board.cards.map((card, idx) => (
          <DashboardCard
            key={idx}
            label={card.label}
            value={board.data?.[card.key]}
            chartData={board.data?.[card.key + "_chart"]}
          />
        ))}
      </div>
    </div>
  );
}