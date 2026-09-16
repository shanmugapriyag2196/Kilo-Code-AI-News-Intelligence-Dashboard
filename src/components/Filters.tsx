"use client";

import { useState } from "react";
import { Search, Filter, X } from "lucide-react";

interface FiltersProps {
  categories: string[];
  value: {
    category: string;
    search: string;
    sentiment: string;
    isFavorite: boolean | null;
    isRead: boolean | null;
  };
  onChange: (filters: FiltersProps["value"]) => void;
}

export default function Filters({ categories, value, onChange }: FiltersProps) {
  const [open, setOpen] = useState(false);

  const sentiments = [
    { label: "All", value: "" },
    { label: "Positive", value: "positive" },
    { label: "Neutral", value: "neutral" },
    { label: "Negative", value: "negative" }
  ];

  const readOptions = [
    { label: "All", value: null },
    { label: "Unread", value: false },
    { label: "Read", value: true }
  ];

  const favOptions = [
    { label: "All", value: null },
    { label: "Favorites", value: true }
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search AI news by title, description, or summary..."
            value={value.search}
            onChange={(e) => onChange({ ...value, search: e.target.value })}
            className="w-full pl-9 pr-9 py-2.5 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-transparent"
          />
          {value.search && (
            <button
              onClick={() => onChange({ ...value, search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg border transition-colors ${
            open ? "bg-brand-600 border-brand-500 text-white" : "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800"
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {open && (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400 mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onChange({ ...value, category: "" })}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  !value.category ? "bg-brand-600 border-brand-500 text-white" : "bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700"
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => onChange({ ...value, category: c })}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    value.category === c ? "bg-brand-600 border-brand-500 text-white" : "bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 mb-2 block">Sentiment</label>
            <div className="flex flex-wrap gap-2">
              {sentiments.map((s) => (
                <button
                  key={s.value}
                  onClick={() => onChange({ ...value, sentiment: s.value })}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    value.sentiment === s.value ? "bg-brand-600 border-brand-500 text-white" : "bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-2 block">Read Status</label>
              <div className="flex flex-wrap gap-2">
                {readOptions.map((r) => (
                  <button
                    key={String(r.value)}
                    onClick={() => onChange({ ...value, isRead: r.value })}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      value.isRead === r.value ? "bg-brand-600 border-brand-500 text-white" : "bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-2 block">Favorites</label>
              <div className="flex flex-wrap gap-2">
                {favOptions.map((f) => (
                  <button
                    key={String(f.value)}
                    onClick={() => onChange({ ...value, isFavorite: f.value })}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      value.isFavorite === f.value ? "bg-brand-600 border-brand-500 text-white" : "bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}