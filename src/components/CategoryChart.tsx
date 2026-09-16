import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface CategoryChartProps {
  data: Record<string, number>;
}

export function CategoryChart({ data }: CategoryChartProps) {
  const labels = Object.keys(data).sort((a, b) => data[b] - data[a]);
  const values = labels.map((l) => data[l]);

  const config = {
    labels,
    datasets: [
      {
        label: "Articles",
        data: values,
        backgroundColor: "rgba(99, 102, 241, 0.7)",
        borderColor: "rgba(99, 102, 241, 1)",
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        borderColor: "#334155",
        borderWidth: 1,
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1"
      }
    },
    scales: {
      x: {
        ticks: { color: "#94a3b8", font: { size: 11 } },
        grid: { color: "rgba(148,163,184,0.1)" }
      },
      y: {
        ticks: { color: "#94a3b8", precision: 0 },
        grid: { color: "rgba(148,163,184,0.1)" }
      }
    }
  };

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
      <h3 className="text-lg font-semibold text-white mb-4">Articles by Category</h3>
      <div className="h-72">
        <Bar data={config} options={options as any} />
      </div>
    </div>
  );
}