import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface SentimentPieChartProps {
  data: { positive: number; neutral: number; negative: number };
}

export function SentimentPieChart({ data }: SentimentPieChartProps) {
  const total = data.positive + data.neutral + data.negative || 1;

  const config = {
    labels: ["Positive", "Neutral", "Negative"],
    datasets: [
      {
        data: [data.positive, data.neutral, data.negative],
        backgroundColor: ["#34d399", "#64748b", "#fb7185"],
        borderColor: "#0f172a",
        borderWidth: 2,
        hoverOffset: 8
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "#cbd5e1",
          font: { size: 12 },
          padding: 16,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: "#1e293b",
        borderColor: "#334155",
        borderWidth: 1,
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        callbacks: {
          label: (ctx: any) => {
            const val = ctx.parsed;
            const pct = ((val / total) * 100).toFixed(1);
            return ` ${ctx.label}: ${val} (${pct}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
      <h3 className="text-lg font-semibold text-white mb-4">Sentiment Breakdown</h3>
      <div className="h-64 flex items-center justify-center">
        <div className="w-full max-w-[260px] h-full">
          <Doughnut data={config} options={options as any} />
        </div>
      </div>
      <div className="flex items-center justify-center gap-6 mt-3 text-xs">
        <span className="flex items-center gap-2 text-slate-300">
          <span className="w-3 h-3 rounded-full bg-emerald-500" /> Positive: {data.positive}
        </span>
        <span className="flex items-center gap-2 text-slate-300">
          <span className="w-3 h-3 rounded-full bg-slate-500" /> Neutral: {data.neutral}
        </span>
        <span className="flex items-center gap-2 text-slate-300">
          <span className="w-3 h-3 rounded-full bg-rose-500" /> Negative: {data.negative}
        </span>
      </div>
    </div>
  );
}