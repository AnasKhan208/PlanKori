import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, Sparkles, LogOut, User } from "lucide-react";

export default async function HostDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white font-bold">
              PK
            </div>
            <span className="font-bold text-zinc-900 text-lg">
              Plan<span className="text-amber-600">Kori</span> Host Portal
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <User className="w-4 h-4 text-zinc-400" />
              <span>{profile?.full_name || user.email}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 uppercase">
                {profile?.role || "host"}
              </span>
            </div>
            <form action="/auth/logout" method="post">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">
                Welcome back, {profile?.full_name || "Event Host"}!
              </h1>
              <p className="text-zinc-600 text-sm mt-1">
                Plan your weddings, corporate events, and parties with AI-recommended vendor packages.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/plan"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-medium text-sm hover:bg-amber-700 transition shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Planning Event</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-zinc-100">
            <div className="p-5 rounded-xl bg-amber-50/50 border border-amber-100">
              <Calendar className="w-6 h-6 text-amber-600 mb-2" />
              <h3 className="font-semibold text-zinc-900 text-sm">Create New Event</h3>
              <p className="text-xs text-zinc-600 mt-1">
                Describe your requirements or fill out our guided smart form.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-orange-50/50 border border-orange-100">
              <Sparkles className="w-6 h-6 text-orange-600 mb-2" />
              <h3 className="font-semibold text-zinc-900 text-sm">Smart Tier Matching</h3>
              <p className="text-xs text-zinc-600 mt-1">
                Get Economy, Standard, and Premium packages with vendor swapping.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-zinc-50 border border-zinc-200">
              <User className="w-6 h-6 text-zinc-600 mb-2" />
              <h3 className="font-semibold text-zinc-900 text-sm">Profile & Settings</h3>
              <p className="text-xs text-zinc-600 mt-1">
                Manage your contact info, booking requests, and payments.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
