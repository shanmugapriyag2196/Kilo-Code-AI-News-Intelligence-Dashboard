import TechnologySection from "@/components/TechnologySection";

export default function TechnologyPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Technology</h2>
        <p className="text-sm text-slate-400 mt-1">
          Recent RPA, automation, and business intelligence updates
        </p>
      </div>
      <TechnologySection />
    </div>
  );
}