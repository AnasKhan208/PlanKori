import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, Users, Store, Activity, DollarSign, LogOut, User } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // Fetch basic platform stats
  const { count: usersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
  const { count: vendorsCount } = await supabase.from("vendors").select("*", { count: "exact", head: true });
  const { count: eventsCount } = await supabase.from("events").select("*", { count: "exact", head: true });
  const { count: paymentsCount } = await supabase.from("payments").select("*", { count: "exact", head: true });

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold">
              PK
            </div>
            <span className="font-bold text-zinc-900 text-lg">
              Plan<span className="text-purple-600">Kori</span> Admin Console
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <User className="w-4 h-4 text-zinc-400" />
              <span>{profile?.full_name || user.email}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 uppercase">
                {profile?.role}
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
              <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-purple-600" />
                Administrator Oversight
              </h1>
              <p className="text-zinc-600 text-sm mt-1">
                Platform-wide control: user management, vendor approvals, payout processing, and AI engine logs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 pt-8 border-t border-zinc-100">
            <div className="p-5 rounded-xl bg-purple-50/50 border border-purple-100">
              <Users className="w-6 h-6 text-purple-600 mb-2" />
              <h3 className="font-semibold text-zinc-900 text-sm">Total Users</h3>
              <p className="text-2xl font-bold text-zinc-900 mt-1">{usersCount ?? 0}</p>
              <p className="text-xs text-zinc-500 mt-1">Hosts & vendors</p>
            </div>
            <div className="p-5 rounded-xl bg-blue-50/50 border border-blue-100">
              <Store className="w-6 h-6 text-blue-600 mb-2" />
              <h3 className="font-semibold text-zinc-900 text-sm">Vendors</h3>
              <p className="text-2xl font-bold text-zinc-900 mt-1">{vendorsCount ?? 0}</p>
              <p className="text-xs text-zinc-500 mt-1">Active listings</p>
            </div>
            <div className="p-5 rounded-xl bg-amber-50/50 border border-amber-100">
              <Activity className="w-6 h-6 text-amber-600 mb-2" />
              <h3 className="font-semibold text-zinc-900 text-sm">Events</h3>
              <p className="text-2xl font-bold text-zinc-900 mt-1">{eventsCount ?? 0}</p>
              <p className="text-xs text-zinc-500 mt-1">In planning or booked</p>
            </div>
            <div className="p-5 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <DollarSign className="w-6 h-6 text-emerald-600 mb-2" />
              <h3 className="font-semibold text-zinc-900 text-sm">Transactions</h3>
              <p className="text-2xl font-bold text-zinc-900 mt-1">{paymentsCount ?? 0}</p>
              <p className="text-xs text-zinc-500 mt-1">Deposit & fee records</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/admin/vendors"
              className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-sm font-medium transition"
            >
              Manage Vendors
            </Link>
            <Link
              href="/admin/revenue"
              className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-sm font-medium transition"
            >
              Revenue & Payouts
            </Link>
            <Link
              href="/admin/ai"
              className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-sm font-medium transition"
            >
              AI Logs & Monitoring
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
