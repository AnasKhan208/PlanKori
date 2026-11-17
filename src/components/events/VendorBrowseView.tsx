"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveManualPackageAction } from "@/app/dashboard/actions";
import type { DemoEvent, DemoPackage } from "@/lib/demo-store";
import type { SeedVendor } from "../../../data/vendors.seed.ts";
import {
  Store,
  Filter,
  DollarSign,
  Users,
  Star,
  Check,
  Plus,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  X,
  MapPin,
  Tag,
  Loader2,
} from "lucide-react";

interface VendorBrowseViewProps {
  event: DemoEvent;
  allVendors: SeedVendor[];
  existingPackage?: DemoPackage | null;
}

const CATEGORIES = [
  { id: "all", label: "All Categories" },
  { id: "venue", label: "Venue" },
  { id: "catering", label: "Catering" },
  { id: "decoration", label: "Decoration" },
  { id: "av_tech", label: "AV & Sound" },
  { id: "photography", label: "Photography" },
  { id: "entertainment", label: "Entertainment" },
];

const THEME_TAGS = [
  "rustic",
  "cyberpunk",
  "minimalist",
  "traditional Bengali",
  "boho",
  "royal luxury",
  "garden",
  "modern corporate",
  "vintage",
  "fairy-tale",
  "eco-friendly",
  "holud",
];

const DIETARY_TAGS = ["vegan", "halal", "vegetarian", "gluten-free", "traditional Bengali"];

export function VendorBrowseView({ event, allVendors, existingPackage }: VendorBrowseViewProps) {
  const router = useRouter();

  // Initial selection from existing package if any
  const initialSelected = useMemo(() => {
    if (existingPackage && existingPackage.items) {
      return existingPackage.items.map((it) => it.vendor_id);
    }
    return [];
  }, [existingPackage]);

  const [selectedVendorKeys, setSelectedVendorKeys] = useState<string[]>(initialSelected);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>(event.location_city || "all");
  const [fitsHeadcount, setFitsHeadcount] = useState<boolean>(false);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [selectedDiet, setSelectedDiet] = useState<string>("");
  const [sortBy, setSortBy] = useState<"rating" | "price_asc" | "price_desc" | "reviews" | "newest">("rating");

  const [savingPackage, setSavingPackage] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function toggleVendorSelection(seedKey: string) {
    if (selectedVendorKeys.includes(seedKey)) {
      setSelectedVendorKeys(selectedVendorKeys.filter((k) => k !== seedKey));
    } else {
      setSelectedVendorKeys([...selectedVendorKeys, seedKey]);
    }
    setSaveSuccess(false);
  }

  // Calculate selected costs
  const selectedVendors = useMemo(() => {
    return allVendors.filter((v) => selectedVendorKeys.includes(v.seed_key));
  }, [allVendors, selectedVendorKeys]);

  const totalCost = useMemo(() => {
    return selectedVendors.reduce((acc, v) => {
      let cost = v.base_price;
      if (v.price_unit === "per_person") {
        cost = v.base_price * (event.headcount || 1);
      } else if (v.price_unit === "per_hour") {
        cost = v.base_price * 4; // standard 4-hour event duration
      }
      return acc + cost;
    }, 0);
  }, [selectedVendors, event.headcount]);

  const budgetUsedPercent = Number(((totalCost / (event.budget || 1)) * 100).toFixed(1));
  const budgetCapMax = (event.budget * 105) / 100;
  const isOverBudget = totalCost > event.budget;
  const isOverCap = totalCost > budgetCapMax;

  // Filtered and sorted vendor list
  const filteredVendors = useMemo(() => {
    return allVendors
      .filter((v) => {
        // Category
        if (selectedCategory !== "all" && v.category !== selectedCategory) return false;

        // City
        if (selectedCity !== "all" && v.location_city.toLowerCase() !== selectedCity.toLowerCase()) {
          return false;
        }

        // Capacity
        if (fitsHeadcount) {
          const hc = event.headcount || 1;
          if (v.category === "venue") {
            const min = v.min_capacity ?? 0;
            const max = v.max_capacity ?? Infinity;
            if (min > hc || max < hc) return false;
          } else {
            const min = v.min_capacity ?? 0;
            const max = v.max_capacity ?? Infinity;
            if ((v.min_capacity != null && min > hc) || (v.max_capacity != null && max < hc)) {
              return false;
            }
          }
        }

        // Price range (comparing base_price)
        if (minPrice && v.base_price < parseInt(minPrice, 10)) return false;
        if (maxPrice && v.base_price > parseInt(maxPrice, 10)) return false;

        // Theme
        if (selectedTheme) {
          const hasTheme = (v.themes || []).includes(selectedTheme) || (v.tags || []).includes(selectedTheme);
          if (!hasTheme) return false;
        }

        // Dietary
        if (selectedDiet) {
          const hasDiet = (v.dietary_options || []).includes(selectedDiet);
          if (!hasDiet) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
        if (sortBy === "price_asc") return a.base_price - b.base_price;
        if (sortBy === "price_desc") return b.base_price - a.base_price;
        if (sortBy === "reviews") return b.review_count - a.review_count;
        if (sortBy === "newest") return (a.days_old || 999) - (b.days_old || 999);
        return 0;
      });
  }, [
    allVendors,
    selectedCategory,
    selectedCity,
    fitsHeadcount,
    minPrice,
    maxPrice,
    selectedTheme,
    selectedDiet,
    sortBy,
    event.headcount,
  ]);

  async function handleSavePackage() {
    if (selectedVendorKeys.length === 0) {
      setSaveError("Please select at least one vendor before saving.");
      return;
    }

    setSavingPackage(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await saveManualPackageAction(event.id, selectedVendorKeys);
      setSaveSuccess(true);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error saving package";
      setSaveError(msg);
    } finally {
      setSavingPackage(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/events/${event.id}`}
              className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-600 transition"
              title="Back to Event"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-zinc-900 leading-tight">
                Browse & Select Vendors
              </h1>
              <span className="text-xs text-zinc-500">
                For: <span className="font-semibold text-zinc-800">{event.title}</span> ({event.headcount} guests • {event.location_city})
              </span>
            </div>
          </div>

          {/* Quick budget summary */}
          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <span className="text-zinc-400 block font-medium">Stated Budget</span>
              <span className="font-bold text-zinc-900">{event.budget.toLocaleString()} BDT</span>
            </div>
            <div className="h-7 w-px bg-zinc-200" />
            <div className="text-right">
              <span className="text-zinc-400 block font-medium">Selected Total</span>
              <span className={`font-bold ${isOverBudget ? "text-red-600" : "text-amber-700"}`}>
                {totalCost.toLocaleString()} BDT
              </span>
            </div>
            <button
              type="button"
              onClick={handleSavePackage}
              disabled={savingPackage || selectedVendorKeys.length === 0}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {savingPackage ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Save Selection ({selectedVendorKeys.length})</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Alerts */}
        {saveSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Custom package saved successfully! View your saved selection in event details.</span>
            </div>
            <Link
              href={`/dashboard/events/${event.id}`}
              className="underline hover:text-emerald-950 font-bold"
            >
              Go to Event Detail →
            </Link>
          </div>
        )}

        {saveError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <X className="w-4 h-4 text-red-600" />
            <span>{saveError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* LEFT: FILTERS SIDEBAR */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl border border-zinc-200 p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-amber-600" />
                  <span>Filters</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedCity("all");
                    setFitsHeadcount(false);
                    setMinPrice("");
                    setMaxPrice("");
                    setSelectedTheme("");
                    setSelectedDiet("");
                  }}
                  className="text-[11px] font-semibold text-zinc-400 hover:text-amber-700 cursor-pointer"
                >
                  Reset all
                </button>
              </div>

              {/* City Filter */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-2">Location City</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {["all", "Dhaka", "Chittagong", "Sylhet"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedCity(c)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize border transition cursor-pointer ${
                        selectedCity.toLowerCase() === c.toLowerCase()
                          ? "bg-amber-600 border-amber-600 text-white"
                          : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      {c === "all" ? "All Cities" : c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Capacity Filter */}
              <div>
                <label className="flex items-start gap-2.5 cursor-pointer text-xs font-medium text-zinc-700 select-none">
                  <input
                    type="checkbox"
                    checked={fitsHeadcount}
                    onChange={(e) => setFitsHeadcount(e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span>Only show vendors fitting {event.headcount} guests</span>
                </label>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-2">Base Price (BDT)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min BDT"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Max BDT"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs"
                  />
                </div>
              </div>

              {/* Themes Filter */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-2">Theme / Aesthetic</label>
                <select
                  value={selectedTheme}
                  onChange={(e) => setSelectedTheme(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs bg-white capitalize"
                >
                  <option value="">Any Theme</option>
                  {THEME_TAGS.map((thm) => (
                    <option key={thm} value={thm}>
                      {thm}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dietary Filter */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-2">Dietary Cuisine</label>
                <select
                  value={selectedDiet}
                  onChange={(e) => setSelectedDiet(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs bg-white capitalize"
                >
                  <option value="">Any Dietary</option>
                  {DIETARY_TAGS.map((dt) => (
                    <option key={dt} value={dt}>
                      {dt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* LIVE BUDGET TRACKER CARD */}
            <div className="bg-white rounded-3xl border border-zinc-200 p-5 shadow-xs space-y-4 sticky top-20">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 block">
                Live Selection Budget
              </span>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-zinc-600">Budget Used</span>
                  <span
                    className={`font-bold ${
                      isOverCap ? "text-red-600" : isOverBudget ? "text-amber-600" : "text-emerald-600"
                    }`}
                  >
                    {budgetUsedPercent}%
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-zinc-100 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isOverCap ? "bg-red-500" : isOverBudget ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-zinc-600 pt-2 border-t border-zinc-100">
                <div className="flex justify-between">
                  <span>Selected Vendors:</span>
                  <span className="font-bold text-zinc-900">{selectedVendors.length} services</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Cost:</span>
                  <span className="font-bold text-zinc-900">{totalCost.toLocaleString()} BDT</span>
                </div>
                <div className="flex justify-between">
                  <span>Stated Budget:</span>
                  <span>{event.budget.toLocaleString()} BDT</span>
                </div>
              </div>

              {/* Warning if over cap */}
              {isOverCap && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <span className="font-bold">Over 105% Budget Cap:</span> Total package price must not exceed {budgetCapMax.toLocaleString()} BDT.
                  </div>
                </div>
              )}

              {/* Selected Vendors chips */}
              {selectedVendors.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-zinc-100 max-h-48 overflow-y-auto">
                  <span className="text-[11px] font-semibold text-zinc-400 block mb-1">
                    Items in your package:
                  </span>
                  {selectedVendors.map((sv) => (
                    <div
                      key={sv.seed_key}
                      className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-zinc-50"
                    >
                      <span className="truncate max-w-[140px] font-medium text-zinc-800">
                        {sv.business_name}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleVendorSelection(sv.seed_key)}
                        className="text-zinc-400 hover:text-red-600 font-bold p-0.5 cursor-pointer"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleSavePackage}
                disabled={savingPackage || selectedVendorKeys.length === 0}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {savingPackage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Save Package Selection</span>
              </button>
            </div>
          </div>

          {/* RIGHT: VENDOR CARDS LIST */}
          <div className="lg:col-span-3 space-y-6">
            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-zinc-200">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-zinc-900 text-white shadow-xs"
                      : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Results Header and Sort */}
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>
                Showing <strong className="text-zinc-900">{filteredVendors.length}</strong> available vendor listings
              </span>
              <div className="flex items-center gap-2">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-2.5 py-1 rounded-lg border border-zinc-200 bg-white font-medium text-zinc-800"
                >
                  <option value="rating">Top Rated</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="reviews">Most Reviews</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>

            {/* Cards Grid */}
            {filteredVendors.length === 0 ? (
              <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center shadow-xs">
                <Store className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                <h3 className="font-bold text-zinc-800 text-sm">No vendors match your current filters</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Try clearing some filters or searching for another city or category.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredVendors.map((vendor) => {
                  const isSelected = selectedVendorKeys.includes(vendor.seed_key);
                  const firstPhoto = vendor.portfolio_image_urls?.[0] || `https://picsum.photos/seed/${vendor.seed_key}-1/800/600`;

                  let calculatedCost = vendor.base_price;
                  if (vendor.price_unit === "per_person") {
                    calculatedCost = vendor.base_price * (event.headcount || 1);
                  } else if (vendor.price_unit === "per_hour") {
                    calculatedCost = vendor.base_price * 4;
                  }

                  return (
                    <div
                      key={vendor.seed_key}
                      className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between shadow-xs ${
                        isSelected
                          ? "border-amber-500 ring-2 ring-amber-500/20 shadow-md"
                          : "border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      {/* Photo Header */}
                      <div className="relative aspect-[16/9] w-full bg-zinc-100 overflow-hidden">
                        <Image
                          src={firstPhoto}
                          alt={vendor.business_name}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/70 text-white backdrop-blur-xs">
                            {vendor.category.replace("_", " ")}
                          </span>
                          {vendor.is_new && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                              New
                            </span>
                          )}
                        </div>

                        <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px] font-bold text-zinc-900 shadow-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{vendor.rating}</span>
                          <span className="text-zinc-400 font-normal">({vendor.review_count})</span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-sm text-zinc-900 leading-snug line-clamp-1">
                              {vendor.business_name}
                            </h3>
                            <span className="text-xs font-semibold text-zinc-500 flex items-center gap-0.5 shrink-0">
                              <MapPin className="w-3 h-3 text-zinc-400" />
                              {vendor.location_city}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                            {vendor.description}
                          </p>

                          {/* Capacity / Dietary Details */}
                          <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] text-zinc-600">
                            {(vendor.min_capacity != null || vendor.max_capacity != null) && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100">
                                <Users className="w-3 h-3 text-zinc-400" />
                                <span>
                                  {vendor.min_capacity ?? 0} – {vendor.max_capacity ?? "∞"} guests
                                </span>
                              </span>
                            )}
                            {(vendor.themes || []).slice(0, 2).map((thm) => (
                              <span key={thm} className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 capitalize">
                                {thm}
                              </span>
                            ))}
                            {(vendor.dietary_options || []).slice(0, 2).map((d) => (
                              <span key={d} className="px-2 py-0.5 rounded bg-orange-50 text-orange-800 capitalize">
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Price & Selection Button */}
                        <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-zinc-400 block uppercase font-semibold">
                              Base Price
                            </span>
                            <div className="font-bold text-sm text-zinc-900">
                              {vendor.base_price.toLocaleString()} BDT
                              <span className="text-[11px] font-normal text-zinc-400 ml-1">
                                / {vendor.price_unit.replace("_", " ")}
                              </span>
                            </div>
                            {vendor.price_unit !== "flat" && (
                              <span className="text-[10px] text-amber-700 block font-medium">
                                ~{calculatedCost.toLocaleString()} BDT for {event.headcount} guests
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleVendorSelection(vendor.seed_key)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? "bg-emerald-600 hover:bg-red-600 text-white shadow-xs group"
                                : "bg-zinc-900 hover:bg-amber-600 text-white"
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3.5 h-3.5 group-hover:hidden" />
                                <span className="group-hover:hidden">Selected</span>
                                <X className="w-3.5 h-3.5 hidden group-hover:inline" />
                                <span className="hidden group-hover:inline">Remove</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

