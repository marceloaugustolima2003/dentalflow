import React, { useEffect, useState } from "react";
import DashboardBoard from "../components/DashboardBoard";
import "../styles/dashboard.css";

const boardsConfig = [
  {
    title: "Agenda",
    api: "/api/consultas",
    cards: [
      { key: "hoje", label: "Consultas Hoje" },
      { key: "canceladas", label: "Canceladas" },
      { key: "proximas", label: "Próximos Horários" },
    ],
  },
  {
    title: "Financeiro",
    api: "/api/faturamento",
    cards: [
      { key: "mensal", label: "Faturamento do Mês" },
      { key: "pendentes", label: "Recebimentos Pendentes" },
      { key: "porConvenio", label: "Receitas por Convênio" },
    ],
  },
  {
    title: "Pacientes",
    api: "/api/pacientes",
    cards: [
      { key: "ativos", label: "Pacientes Ativos" },
      { key: "novos", label: "Novos Este Mês" },
      { key: "retornos", label: "Retornos Agendados" },
    ],
  },
  {
    title: "Estoque",
    api: "/api/estoque",
    cards: [
      { key: "baixos", label: "Materiais Críticos" },
      { key: "total", label: "Total de Itens" },
      { key: "validade", label: "Itens Vencendo" },
    ],
  },
];

export default function Dashboard() {
  const [boards, setBoards] = useState([]);

  useEffect(() => {
    async function fetchBoards() {
      const results = await Promise.all(
        boardsConfig.map(async (board) => {
          try {
            const response = await fetch(board.api);
            const data = await response.json();
            return { ...board, data };
          } catch (e) {
            return { ...board, data: {} };
          }
        })
      );
      setBoards(results);
    }
    fetchBoards();
  }, []);

  return (
    <div className="dashboard-root">
      <h1 className="dashboard-title">Dashboard Analítico DentalFlow</h1>
      <div className="dashboard-boards">
        {boards.map((board, idx) => (
          <DashboardBoard key={idx} board={board} />
        ))}
      </div>
    </div>
  );
}