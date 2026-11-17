import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { demoStore } from "@/lib/demo-store";
import { SettingsForm } from "@/components/dashboard/SettingsForm";
import { ArrowLeft, LogOut } from "lucide-react";

export default async function DashboardSettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard/settings");
  }

  let fullName = user.full_name || "Valued User";
  let phone = user.phone || "";
  const email = user.email || "user@plankori.test";
  const role = user.role || "host";

  // Try fetching profile from Supabase
  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .single();

    if (profile) {
      if (profile.full_name) fullName = profile.full_name;
      if (profile.phone) phone = profile.phone;
    }
  } catch {}

  // Fallback to demo store
  const storeProfile = demoStore.getProfileById(user.id);
  if (storeProfile) {
    if (storeProfile.full_name) fullName = storeProfile.full_name;
    if (storeProfile.phone) phone = storeProfile.phone;
  }

  return (
    <div className="min-h-screen bg-slate-50/70">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                PK
              </span>
              <span className="font-bold text-lg text-slate-900">
                Plan<span className="text-emerald-600">Kori</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              My Events
            </Link>
            <form action="/auth/logout" method="POST">
              <button
                type="submit"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Account Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your personal profile, contact information, and account preferences.
          </p>
        </div>

        <SettingsForm
          initialFullName={fullName}
          initialPhone={phone}
          email={email}
          role={role}
        />
      </main>
    </div>
  );
}
