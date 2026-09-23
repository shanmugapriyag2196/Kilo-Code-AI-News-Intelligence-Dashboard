import ToolsSection from "@/components/ToolsSection";

export default function ToolsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Top Recent AI Tools</h2>
        <p className="text-sm text-slate-400 mt-1">
          This week and this month AI tool releases
        </p>
      </div>
      <ToolsSection />
    </div>
  );
}