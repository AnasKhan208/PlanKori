import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Store, CalendarCheck, DollarSign, LogOut, User, Plus, ArrowRight } from "lucide-react";

export default async function VendorDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/vendor/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: vendors } = await supabase
    .from("vendors")
    .select("id, is_active")
    .eq("owner_id", user.id);

  const vendorList = vendors || [];
  const vendorIds = vendorList.map((v) => v.id);

  let pendingBookingsCount = 0;
  let totalBookingsCount = 0;

  if (vendorIds.length > 0) {
    const { count: pendingCount } = await supabase
      .from("booking_requests")
      .select("*", { count: "exact", head: true })
      .in("vendor_id", vendorIds)
      .eq("status", "pending");

    const { count: totalCount } = await supabase
      .from("booking_requests")
      .select("*", { count: "exact", head: true })
      .in("vendor_id", vendorIds);

    pendingBookingsCount = pendingCount ?? 0;
    totalBookingsCount = totalCount ?? 0;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white font-bold">
              PK
            </div>
            <span className="font-bold text-zinc-900 text-lg">
              Plan<span className="text-amber-600">Kori</span> Vendor Portal
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <User className="w-4 h-4 text-zinc-400" />
              <span>{profile?.full_name || user.email}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 uppercase">
                {profile?.role || "vendor"}
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
                Vendor Hub: {profile?.full_name || "Partner"}
              </h1>
              <p className="text-zinc-600 text-sm mt-1">
                Manage your service listings, respond to booking requests, and grow your event bookings.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/vendor/listings/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-medium text-sm hover:bg-amber-700 transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Listing</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-zinc-100">
            {/* Active Listings Card */}
            <Link
              href="/vendor/listings"
              className="p-5 rounded-xl bg-amber-50/50 border border-amber-100 hover:border-amber-300 transition group block"
            >
              <div className="flex items-center justify-between mb-2">
                <Store className="w-6 h-6 text-amber-600" />
                <ArrowRight className="w-4 h-4 text-amber-600 opacity-0 group-hover:opacity-100 transition" />
              </div>
              <h3 className="font-semibold text-zinc-900 text-sm">Active Listings</h3>
              <p className="text-2xl font-bold text-zinc-900 mt-1">{vendorList.length}</p>
              <p className="text-xs text-zinc-500 mt-1">View, edit, or deactivate services</p>
            </Link>

            {/* Booking Requests Card */}
            <Link
              href="/vendor/bookings"
              className="p-5 rounded-xl bg-blue-50/50 border border-blue-100 hover:border-blue-300 transition group block"
            >
              <div className="flex items-center justify-between mb-2">
                <CalendarCheck className="w-6 h-6 text-blue-600" />
                <ArrowRight className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition" />
              </div>
              <h3 className="font-semibold text-zinc-900 text-sm">Pending Booking Requests</h3>
              <p className="text-2xl font-bold text-zinc-900 mt-1">
                {pendingBookingsCount}
                <span className="text-xs font-normal text-zinc-500 ml-2">({totalBookingsCount} total)</span>
              </p>
              <p className="text-xs text-zinc-500 mt-1">Accept or decline host inquiries</p>
            </Link>

            {/* Payouts Card */}
            <div className="p-5 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-zinc-900 text-sm">Payouts & Earnings</h3>
              <p className="text-2xl font-bold text-zinc-900 mt-1">0 BDT</p>
              <p className="text-xs text-zinc-500 mt-1">Net earnings after platform commission</p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-zinc-100 flex flex-wrap gap-4">
            <Link
              href="/vendor/listings"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-800"
            >
              <span>Manage all listings</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <span className="text-zinc-300">•</span>
            <Link
              href="/vendor/bookings"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              <span>Review booking requests</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
