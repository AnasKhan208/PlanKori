"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateEventAction } from "@/app/dashboard/actions";
import type { DemoEvent, DemoPackage } from "@/lib/demo-store";
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Store,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Clock,
  Palette,
  Utensils,
  MessageSquare,
  Wand2,
  PackageCheck,
  Layers,
  Save,
  X,
  Loader2,
} from "lucide-react";

interface EventDetailViewProps {
  event: DemoEvent;
  packages: DemoPackage[];
}

export function EventDetailView({ event, packages }: EventDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "moodboard" | "packages" | "chat">("overview");

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [eventType, setEventType] = useState(event.event_type);
  const [eventDate, setEventDate] = useState(event.event_date || "");
  const [city, setCity] = useState(event.location_city);
  const [budget, setBudget] = useState(event.budget.toString());
  const [headcount, setHeadcount] = useState(event.headcount.toString());
  const [themeDesc, setThemeDesc] = useState(event.theme_description || "");
  const [dietary, setDietary] = useState<string[]>(event.dietary_needs || []);
  const [mustHave, setMustHave] = useState<string[]>(event.must_have_categories || []);
  const [status, setStatus] = useState<DemoEvent["status"]>(event.status);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selectedManualPkg = packages.find((p) => p.is_selected) || packages[0];

  function toggleDietary(item: string) {
    if (dietary.includes(item)) {
      setDietary(dietary.filter((d) => d !== item));
    } else {
      setDietary([...dietary, item]);
    }
  }

  function toggleCategory(cat: string) {
    if (mustHave.includes(cat)) {
      setMustHave(mustHave.filter((c) => c !== cat));
    } else {
      setMustHave([...mustHave, cat]);
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      await updateEventAction(event.id, {
        title: title.trim(),
        event_type: eventType.trim(),
        event_date: eventDate || undefined,
        location_city: city.trim(),
        budget: parseInt(budget, 10) || event.budget,
        headcount: parseInt(headcount, 10) || event.headcount,
        theme_description: themeDesc.trim(),
        dietary_needs: dietary,
        must_have_categories: mustHave,
        status,
      });

      setMsg({ type: "success", text: "Event requirements updated successfully!" });
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      const errorText = err instanceof Error ? err.message : "Failed to update event";
      setMsg({ type: "error", text: errorText });
    } finally {
      setSaving(false);
    }
  }

  const formattedDate = event.event_date
    ? new Date(event.event_date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Date TBA";

  return (
    <div className="min-h-screen bg-zinc-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Events</span>
          </Link>
        </div>

        {/* Top Header Card */}
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 sm:p-8 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-zinc-100 text-zinc-700 capitalize">
                  {event.event_type}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize bg-amber-100 text-amber-800 border border-amber-200">
                  {event.status.replace("_", " ")}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                {event.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-xs text-zinc-600">
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <MapPin className="w-4 h-4 text-zinc-400" />
                  <span>{event.location_city}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Users className="w-4 h-4 text-zinc-400" />
                  <span>{event.headcount} Guests</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-amber-700">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <span>{event.budget.toLocaleString()} BDT Budget</span>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/dashboard/events/${event.id}/browse`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm transition"
              >
                <Store className="w-4 h-4" />
                <span>Browse & Select Vendors</span>
              </Link>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-zinc-200 mt-8 gap-2 sm:gap-6 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`pb-3.5 px-2 text-sm font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "overview"
                  ? "border-amber-600 text-amber-700 font-bold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Overview & Requirements</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("moodboard")}
              className={`pb-3.5 px-2 text-sm font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "moodboard"
                  ? "border-amber-600 text-amber-700 font-bold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Mood Board</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("packages")}
              className={`pb-3.5 px-2 text-sm font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "packages"
                  ? "border-amber-600 text-amber-700 font-bold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Packages {selectedManualPkg && "(1 Saved)"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`pb-3.5 px-2 text-sm font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "chat"
                  ? "border-amber-600 text-amber-700 font-bold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>AI Chat</span>
            </button>
          </div>
        </div>

        {msg && (
          <div
            className={`mb-6 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              msg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {msg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between pb-6 border-b border-zinc-100 mb-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Event Requirements</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  These parameters guide the vendor matchmaker and budget allocation.
                </p>
              </div>

              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Edit Requirements</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}
            </div>

            {!isEditing ? (
              // READ-ONLY REQUIREMENTS DISPLAY
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase">Event Type</span>
                    <p className="text-sm font-bold text-zinc-900 mt-1">{event.event_type}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase">Event Date</span>
                    <p className="text-sm font-bold text-zinc-900 mt-1">{formattedDate}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase">Location City</span>
                    <p className="text-sm font-bold text-zinc-900 mt-1">{event.location_city}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                    <span className="text-[11px] font-semibold text-amber-700 uppercase">Budget</span>
                    <p className="text-sm font-bold text-amber-900 mt-1">
                      {event.budget.toLocaleString()} BDT
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase">Theme & Vibe</h3>
                    <p className="text-sm text-zinc-800 mt-1.5 leading-relaxed font-medium">
                      {event.theme_description || "No specific theme described."}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-200/60">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase">Dietary Requirements</h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(event.dietary_needs || []).length > 0 ? (
                        event.dietary_needs.map((d) => (
                          <span
                            key={d}
                            className="px-2.5 py-1 rounded-md text-xs font-medium capitalize bg-white border border-zinc-200 text-zinc-800"
                          >
                            {d}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-zinc-500">None specified</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-200/60">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase">Must-Have Service Categories</h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(event.must_have_categories || []).length > 0 ? (
                        event.must_have_categories.map((c) => (
                          <span
                            key={c}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold capitalize bg-amber-50 text-amber-800 border border-amber-200"
                          >
                            {c.replace("_", " ")}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-zinc-500">All 6 categories included</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <div className="text-xs text-zinc-400">
                    Created on {new Date(event.created_at).toLocaleDateString()}
                  </div>
                  <Link
                    href={`/dashboard/events/${event.id}/browse`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800"
                  >
                    <span>Browse vendors for this event</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              // EDIT MODE FORM
              <form onSubmit={handleSaveEdit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Event Title</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Event Type</label>
                    <input
                      type="text"
                      required
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Event Date</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm font-medium bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Location City</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm font-medium bg-white"
                    >
                      <option value="Dhaka">Dhaka</option>
                      <option value="Chittagong">Chittagong</option>
                      <option value="Sylhet">Sylhet</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Budget (BDT)</label>
                    <input
                      type="number"
                      min={5000}
                      step={1000}
                      required
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm font-semibold text-amber-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Headcount (Guests)</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={headcount}
                      onChange={(e) => setHeadcount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Theme Description</label>
                  <textarea
                    rows={3}
                    value={themeDesc}
                    onChange={(e) => setThemeDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Dietary Preferences</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["halal", "traditional Bengali", "vegan", "vegetarian", "gluten-free", "nut-free"].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDietary(d)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                          dietary.includes(d)
                            ? "bg-amber-100 border-amber-300 text-amber-900 font-semibold"
                            : "bg-white border-zinc-200 text-zinc-600"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Must-Have Categories</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["venue", "catering", "decoration", "av_tech", "photography", "entertainment"].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`text-xs px-2.5 py-1 rounded-lg border capitalize transition cursor-pointer ${
                          mustHave.includes(cat)
                            ? "bg-amber-100 border-amber-300 text-amber-900 font-semibold"
                            : "bg-white border-zinc-200 text-zinc-600"
                        }`}
                      >
                        {cat.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: MOOD BOARD */}
        {activeTab === "moodboard" && (
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
              <Palette className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900">AI Mood Board Visualizer</h2>
            <p className="text-zinc-500 text-xs max-w-lg mx-auto mt-1 mb-8">
              PlanKori uses Gemini Imagen to generate custom aesthetic mood boards matching your theme (&quot;{event.theme_description || "Aesthetic event"}&quot;).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
              {[
                { title: "Stage & Floral Concept", subtitle: "Color palette: Emerald & Gold" },
                { title: "Ambient Lighting & Lawn", subtitle: "Fairy lit tree canopy" },
                { title: "Table Dining Setup", subtitle: "Rustic burlap & wild florals" },
              ].map((ph, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-dashed border-zinc-300 p-8 flex flex-col items-center justify-center bg-zinc-50 text-zinc-400 aspect-[4/3]"
                >
                  <Sparkles className="w-6 h-6 mb-2 text-zinc-300" />
                  <span className="text-xs font-semibold text-zinc-600">{ph.title}</span>
                  <span className="text-[10px] text-zinc-400 mt-0.5">{ph.subtitle}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => alert("AI Mood Board generation will be triggered in the AI Engine integration phase!")}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white font-semibold text-xs shadow-md transition cursor-pointer"
            >
              <Wand2 className="w-4 h-4" />
              <span>Generate Mood Board with AI</span>
            </button>
          </div>
        )}

        {/* TAB 3: PACKAGES */}
        {activeTab === "packages" && (
          <div className="space-y-6">
            {/* Show Saved Custom Manual Package if exists */}
            {selectedManualPkg && (
              <div className="bg-white rounded-3xl border border-amber-300 shadow-sm p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-100">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Custom Saved Package</span>
                    </div>
                    <h2 className="text-xl font-bold text-zinc-900">
                      Host Selection ({selectedManualPkg.items.length} Vendors)
                    </h2>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs text-zinc-500 block">Total Package Cost</span>
                    <span className="text-xl font-bold text-amber-700">
                      {selectedManualPkg.total_cost.toLocaleString()} BDT
                    </span>
                    <span className="text-xs text-zinc-400 block">
                      ({selectedManualPkg.budget_used_percent}% of stated budget)
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-zinc-100 mt-4">
                  {selectedManualPkg.items.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-zinc-900 block">
                          {(item.vendor as { business_name?: string })?.business_name || item.vendor_id}
                        </span>
                        <span className="text-zinc-500 capitalize">{item.category.replace("_", " ")}</span>
                      </div>
                      <span className="font-semibold text-zinc-800">
                        {item.estimated_cost.toLocaleString()} BDT
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <Link
                    href={`/dashboard/events/${event.id}/browse`}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1"
                  >
                    <span>Modify Selected Vendors</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* AI Tiered Package Matcher Placeholder */}
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
                <Layers className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900">Smart Vendor Matchmaker</h2>
              <p className="text-zinc-500 text-xs max-w-lg mx-auto mt-1 mb-8">
                The smart matchmaker automatically curates 3 tiered packages (Economy ~70%, Standard ~90%, and Premium up to 100%) optimizing for your budget cap and category priorities.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={`/dashboard/events/${event.id}/browse`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm transition"
                >
                  <Store className="w-4 h-4" />
                  <span>Manually Browse & Select Vendors</span>
                </Link>
                <button
                  type="button"
                  onClick={() => alert("Automated 3-tier matching will be unlocked in the Recommender Engine task!")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-semibold text-xs shadow-sm transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Generate Tiered Packages with AI</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CHAT */}
        {activeTab === "chat" && (
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900">AI Event Architect Chat</h2>
            <p className="text-zinc-500 text-xs max-w-lg mx-auto mt-1 mb-6">
              Have an interactive dialogue with PlanKori AI to tweak your budget breakdown, explore theme options, or swap vendor specialties.
            </p>
            <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200 max-w-md mx-auto text-xs text-zinc-600 text-left mb-6">
              <span className="font-semibold text-zinc-900 block mb-1">Upcoming in AI Extractor Phase:</span>
              • Multi-turn chat context linked to your event requirements
              <br />
              • Real-time budget reallocation advice
              <br />
              • Vendor questions & package modifications
            </div>
            <Link
              href={`/dashboard/events/${event.id}/browse`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm transition"
            >
              <span>Explore Vendors Manually For Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

