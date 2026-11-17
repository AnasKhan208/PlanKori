import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { demoStore, type DemoEvent } from "@/lib/demo-store";
import {
  Calendar,
  Sparkles,
  Plus,
  MapPin,
  Users,
  DollarSign,
  ArrowRight,
  LogOut,
  User,
  Settings,
  Clock,
} from "lucide-react";

export default async function HostDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  // Fetch host's events (try Supabase first, fallback to demo store)
  let events: DemoEvent[] = [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("host_id", user.id)
      .order("created_at", { ascending: false });

    if (data && !error && data.length > 0) {
      events = data as unknown as DemoEvent[];
    } else {
      events = demoStore.getEventsForHost(user.id);
    }
  } catch {
    events = demoStore.getEventsForHost(user.id);
  }

  function getStatusBadge(status: DemoEvent["status"]) {
    switch (status) {
      case "confirmed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "booking_requested":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "planned":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "draft":
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top Navbar */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white font-bold shadow-sm">
                PK
              </div>
              <span className="font-bold text-zinc-900 text-lg">
                Plan<span className="text-amber-600">Kori</span>
              </span>
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider ml-2">
              Host Portal
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-zinc-500" />
              <span className="hidden md:inline">Settings</span>
            </Link>

            <div className="flex items-center gap-2 text-sm text-zinc-700 pl-2 border-l border-zinc-200">
              <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-semibold text-xs">
                {user.full_name ? user.full_name.charAt(0) : "H"}
              </div>
              <span className="hidden sm:inline font-medium">{user.full_name || user.email}</span>
            </div>

            <form action="/auth/logout" method="post">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-4 h-4 text-zinc-500" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Welcome & Actions Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">
              Welcome back, {user.full_name || "Event Host"}!
            </h1>
            <p className="text-zinc-600 text-sm mt-1">
              Manage your upcoming events, browse curated vendors, and view AI recommendations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/dashboard/plan"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white font-semibold text-sm shadow-md shadow-orange-500/20 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Plan with AI</span>
            </Link>
            <Link
              href="/dashboard/events/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-800 font-semibold text-sm shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-600" />
              <span>New event (form)</span>
            </Link>
          </div>
        </div>

        {/* Events Section */}
        {events.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center shadow-sm max-w-2xl mx-auto my-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900">No events created yet</h2>
            <p className="text-zinc-500 text-sm max-w-md mx-auto mt-2 mb-8">
              Start planning your wedding, birthday, corporate gala, or engagement party. You can let our AI extract requirements from a prompt, or use our guided step-by-step form.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard/plan"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-md transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Plan with AI</span>
              </Link>
              <Link
                href="/dashboard/events/new"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 font-semibold text-sm shadow-sm transition"
              >
                <Plus className="w-4 h-4 text-amber-600" />
                <span>New event (form)</span>
              </Link>
            </div>
          </div>
        ) : (
          // Events Cards Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => {
              const formattedDate = evt.event_date
                ? new Date(evt.event_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Date TBA";

              return (
                <Link
                  key={evt.id}
                  href={`/dashboard/events/${evt.id}`}
                  className="bg-white rounded-2xl border border-zinc-200 hover:border-amber-400 p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-zinc-100 text-zinc-700 capitalize">
                        {evt.event_type}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${getStatusBadge(
                          evt.status
                        )}`}
                      >
                        {evt.status.replace("_", " ")}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-zinc-900 group-hover:text-amber-600 transition line-clamp-1">
                      {evt.title}
                    </h3>

                    {evt.theme_description && (
                      <p className="text-zinc-500 text-xs mt-1.5 line-clamp-2">
                        {evt.theme_description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-zinc-100 text-xs text-zinc-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="truncate">{evt.location_city}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{evt.headcount} guests</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-semibold text-zinc-900">
                        <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                        <span>{evt.budget.toLocaleString()} BDT</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-amber-600 group-hover:text-amber-700">
                    <span>Manage Event</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
