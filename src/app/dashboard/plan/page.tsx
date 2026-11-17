import { getCurrentUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowLeft, ArrowRight, Wand2, FormInput, Calendar } from "lucide-react";

export default async function PlanWithAIPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=/dashboard/plan");
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8 sm:p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center mx-auto mb-6 shadow-md shadow-orange-500/20">
            <Sparkles className="w-7 h-7" />
          </div>

          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            How would you like to plan your event?
          </h1>
          <p className="text-zinc-600 text-base max-w-xl mx-auto mt-2 mb-10">
            PlanKori gives you two seamless ways to plan: conversational AI prompt extraction or our guided step-by-step form.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-2xl mx-auto">
            {/* Step-by-Step Form Card */}
            <Link
              href="/dashboard/events/new"
              className="p-6 rounded-2xl border-2 border-amber-600 bg-amber-50/30 hover:bg-amber-50 transition group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                  <FormInput className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 group-hover:text-amber-700 transition">
                  Step-by-Step Form
                </h3>
                <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">
                  Fill in your date, city, headcount, budget, theme, and dietary preferences in our 5-step guided form.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-amber-700">
                <span>Start 5-Step Form</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition" />
              </div>
            </Link>

            {/* AI Natural Language Planner (Coming in AI phase) */}
            <div className="p-6 rounded-2xl border border-zinc-200 bg-zinc-50/50 flex flex-col justify-between opacity-95">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-200 text-zinc-700 flex items-center justify-center">
                    <Wand2 className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-200 text-zinc-600">
                    Next Task
                  </span>
                </div>
                <h3 className="text-lg font-bold text-zinc-900">
                  AI Natural Language
                </h3>
                <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">
                  Simply describe what you want in plain text (&quot;Rustic wedding in Sylhet for 150 guests under 12 lakh&quot;) and let our Gemini extractor parse it.
                </p>
              </div>
              <div className="mt-6">
                <Link
                  href="/dashboard/events/new"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 hover:text-amber-600 transition"
                >
                  <span>Use Step-by-Step Form instead</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

