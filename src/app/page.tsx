import Link from "next/link";
import { Sparkles, Calendar, ShieldCheck, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 via-white to-zinc-50 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-zinc-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white font-bold shadow-md shadow-orange-500/20">
              PK
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900">
              Plan<span className="text-amber-600">Kori</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-zinc-700 hover:text-zinc-900 px-3.5 py-2 rounded-lg hover:bg-zinc-100 transition"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-xl shadow-sm transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100/70 text-amber-800 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation AI Event Planner for Bangladesh</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-zinc-900 tracking-tight max-w-3xl leading-[1.15]">
          Plan dream events with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-500">
            smart AI vendor matching
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-zinc-600 max-w-2xl">
          Describe your vision in natural language. PlanKori automatically extracts requirements, generates aesthetic mood boards, and curates 3 tailored vendor packages.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-base shadow-lg shadow-amber-600/25 transition"
          >
            <span>Plan an Event</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 font-semibold text-base shadow-sm transition"
          >
            <span>Join as Vendor</span>
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl text-left">
          <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-zinc-900 text-lg">AI Event Architect</h3>
            <p className="text-zinc-600 text-sm mt-2">
              Conversational requirements extraction converts natural language into exact budget breakdowns and dietary/theme parameters.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center mb-4">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-zinc-900 text-lg">Smart Matchmaker</h3>
            <p className="text-zinc-600 text-sm mt-2">
              pgvector semantic search matches venues, caterers, photographers, and decorators across Economy, Standard, and Premium tiers.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-zinc-900 text-lg">Safe Payments</h3>
            <p className="text-zinc-600 text-sm mt-2">
              Pay deposits only after all vendors accept. Enforces strict budget caps and automatic commission payouts.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-500">
        PlanKori © 2026. Built with strict TypeScript, Supabase, pgvector, and Gemini AI.
      </footer>
    </div>
  );
}
