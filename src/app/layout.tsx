import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI News Intelligence Dashboard",
  description: "Daily AI news intelligence dashboard with curated insights, sentiment analysis, and smart filtering.",
  keywords: ["AI", "artificial intelligence", "news", "dashboard", "machine learning"],
  authors: [{ name: "AI News Intelligence Bot" }],
  openGraph: {
    title: "AI News Intelligence Dashboard",
    description: "Daily AI news intelligence dashboard with curated insights.",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-slate-950">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <footer className="border-t border-slate-800 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-slate-500">
              AI News Intelligence Dashboard · Powered by Next.js & Airtable · Data sourced from NewsAPI.org
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}