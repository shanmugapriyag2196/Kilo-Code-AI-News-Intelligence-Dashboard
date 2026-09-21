import Link from "next/link";
import { RefreshCw, Brain, Newspaper, TrendingUp } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/70 border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">AI News Intelligence</h1>
              <p className="text-xs text-slate-400 -mt-0.5">Daily AI insights, curated</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm text-slate-300 hover:text-white transition-colors flex items-center gap-2">
              <Newspaper className="w-4 h-4" /> News
            </Link>
            <Link href="/dashboard" className="text-sm text-slate-300 hover:text-white transition-colors flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Dashboard
            </Link>
          </nav>
          <form action="/api/news/refresh" method="POST">
            <button
              type="submit"
              className="flex items-center gap-2 text-sm bg-brand-600 hover:bg-brand-700 text-white px-3 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh News</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}