"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createEventSchema,
  eventStep1Schema,
  eventStep2Schema,
  eventStep3Schema,
  eventStep4Schema,
  type CreateEventInput,
} from "@/lib/validators/event";
import { createEventAction } from "@/app/dashboard/actions";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  PartyPopper,
  Briefcase,
  Cake,
  Heart,
  Palette,
  Utensils,
  Loader2,
} from "lucide-react";

const EVENT_TYPES = [
  { value: "Wedding", label: "Wedding", icon: Heart },
  { value: "Gaye Holud", label: "Gaye Holud", icon: Sparkles },
  { value: "Birthday", label: "Birthday Party", icon: Cake },
  { value: "Corporate", label: "Corporate Retreat / Gala", icon: Briefcase },
  { value: "Engagement", label: "Engagement", icon: Heart },
  { value: "Anniversary", label: "Anniversary", icon: PartyPopper },
  { value: "Other", label: "Other Celebration", icon: Calendar },
];

const PRESET_CITIES = ["Dhaka", "Chittagong", "Sylhet"];

const DIETARY_OPTIONS = [
  "halal",
  "traditional Bengali",
  "vegan",
  "vegetarian",
  "gluten-free",
  "nut-free",
  "continental",
];

const CATEGORY_OPTIONS = [
  { id: "venue", label: "Venue (Hall / Lawn / Resort)" },
  { id: "catering", label: "Catering & Banqueting" },
  { id: "decoration", label: "Decoration & Floral Architecture" },
  { id: "av_tech", label: "AV, Sound & Lighting" },
  { id: "photography", label: "Photography & Cinema" },
  { id: "entertainment", label: "Live Music, DJ & Band" },
];

const THEME_INSPIRATIONS = [
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
];

export function EventCreateMultiStepForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Tomorrow's date formatted as YYYY-MM-DD
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateString = tomorrow.toISOString().split("T")[0];

  const form = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    mode: "onBlur",
    defaultValues: {
      event_type: "Wedding",
      title: "",
      event_date: minDateString,
      location_city: "Dhaka",
      headcount: 100,
      budget: 500000,
      dietary_needs: ["halal"],
      theme_description: "",
      must_have_categories: ["venue", "catering", "decoration", "photography"],
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = form;

  const watchedValues = watch();

  async function handleNextStep() {
    let isValid = false;
    setSubmitError(null);

    if (currentStep === 1) {
      isValid = await trigger(["event_type", "title", "event_date"]);
    } else if (currentStep === 2) {
      isValid = await trigger(["location_city", "headcount"]);
    } else if (currentStep === 3) {
      isValid = await trigger(["budget", "dietary_needs"]);
    } else if (currentStep === 4) {
      isValid = await trigger(["theme_description", "must_have_categories"]);
    }

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  }

  function handlePrevStep() {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }

  function toggleDietary(diet: string) {
    const current = watchedValues.dietary_needs || [];
    if (current.includes(diet)) {
      setValue(
        "dietary_needs",
        current.filter((d) => d !== diet)
      );
    } else {
      setValue("dietary_needs", [...current, diet]);
    }
  }

  function toggleCategory(catId: string) {
    const current = watchedValues.must_have_categories || [];
    if (current.includes(catId)) {
      setValue(
        "must_have_categories",
        current.filter((c) => c !== catId)
      );
    } else {
      setValue("must_have_categories", [...current, catId]);
    }
  }

  function appendThemeWord(theme: string) {
    const current = watchedValues.theme_description || "";
    if (!current) {
      setValue("theme_description", `${theme} aesthetic`);
    } else if (!current.toLowerCase().includes(theme.toLowerCase())) {
      setValue("theme_description", `${current}, ${theme} style`);
    }
  }

  async function onSubmit(data: CreateEventInput) {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await createEventAction(data);
      if (res.success && res.id) {
        router.refresh();
        router.push(`/dashboard/events/${res.id}`);
      } else {
        setSubmitError("Failed to save event. Please check inputs and try again.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating event";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const stepsList = [
    { num: 1, label: "Basics" },
    { num: 2, label: "Location" },
    { num: 3, label: "Budget" },
    { num: 4, label: "Theme" },
    { num: 5, label: "Review" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Top back link */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 sm:p-10">
        {/* Progress Stepper */}
        <div className="mb-8 pb-6 border-b border-zinc-100">
          <div className="flex items-center justify-between max-w-xl mx-auto">
            {stepsList.map((step, idx) => {
              const isPassed = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              return (
                <div key={step.num} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (step.num < currentStep) setCurrentStep(step.num);
                      }}
                      disabled={step.num > currentStep}
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isPassed
                          ? "bg-amber-600 text-white cursor-pointer"
                          : isCurrent
                          ? "bg-amber-600 text-white ring-4 ring-amber-100"
                          : "bg-zinc-100 text-zinc-400"
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : step.num}
                    </button>
                    <span
                      className={`text-[11px] font-medium mt-1.5 hidden sm:inline ${
                        isCurrent
                          ? "text-amber-700 font-bold"
                          : isPassed
                          ? "text-zinc-700"
                          : "text-zinc-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < stepsList.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 transition-all ${
                        currentStep > step.num ? "bg-amber-600" : "bg-zinc-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {submitError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            <div>{submitError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* STEP 1: Type, Title, Date */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Step 1: Event Basics</h2>
                <p className="text-zinc-500 text-xs mt-1">
                  What kind of celebration are you hosting, and when is it scheduled?
                </p>
              </div>

              {/* Event Type Grid */}
              <div>
                <label className="block text-sm font-semibold text-zinc-800 mb-2">
                  Select Event Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {EVENT_TYPES.map((et) => {
                    const Icon = et.icon;
                    const isSelected = watchedValues.event_type === et.value;
                    return (
                      <button
                        key={et.value}
                        type="button"
                        onClick={() => setValue("event_type", et.value)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? "bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-500"
                            : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? "text-amber-600" : "text-zinc-400"}`} />
                        <span>{et.label}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.event_type && (
                  <p className="text-xs text-red-600 mt-1">{errors.event_type.message}</p>
                )}
              </div>

              {/* Event Title */}
              <div>
                <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
                  Event Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Arif & Nusrat's Grand Holud & Wedding"
                  {...register("title")}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm"
                />
                {errors.title && (
                  <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>
                )}
              </div>

              {/* Event Date */}
              <div>
                <label className="block text-sm font-semibold text-zinc-800 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Event Date (Must be in the future)</span> <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  min={minDateString}
                  {...register("event_date")}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm bg-white"
                />
                {errors.event_date && (
                  <p className="text-xs text-red-600 mt-1">{errors.event_date.message}</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: City & Headcount */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Step 2: Location & Guests</h2>
                <p className="text-zinc-500 text-xs mt-1">
                  Where will the event be held, and how many guests do you plan to invite?
                </p>
              </div>

              {/* City Selection */}
              <div>
                <label className="block text-sm font-semibold text-zinc-800 mb-2 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span>Location City</span> <span className="text-red-500">*</span>
                </label>

                {/* Preset City Buttons */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_CITIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setValue("location_city", c)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        watchedValues.location_city === c
                          ? "bg-amber-600 border-amber-600 text-white shadow-sm"
                          : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <div className="mt-2">
                  <span className="text-xs text-zinc-500 block mb-1">Or enter a custom city / region:</span>
                  <input
                    type="text"
                    placeholder="e.g. Cox's Bazar, Sreemangal, Gazipur"
                    {...register("location_city")}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm"
                  />
                </div>
                {errors.location_city && (
                  <p className="text-xs text-red-600 mt-1">{errors.location_city.message}</p>
                )}
              </div>

              {/* Headcount */}
              <div>
                <label className="block text-sm font-semibold text-zinc-800 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span>Expected Headcount (Number of Guests)</span> <span className="text-red-500">*</span>
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    {...register("headcount", { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm font-semibold text-zinc-900"
                  />
                </div>

                <div className="flex flex-wrap gap-2 mt-2.5">
                  {[40, 80, 150, 200, 350, 500].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setValue("headcount", count)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium transition cursor-pointer"
                    >
                      {count} guests
                    </button>
                  ))}
                </div>

                {errors.headcount && (
                  <p className="text-xs text-red-600 mt-1">{errors.headcount.message}</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Budget & Dietary Needs */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Step 3: Budget & Dining</h2>
                <p className="text-zinc-500 text-xs mt-1">
                  Specify your total event budget in Bangladeshi Taka (BDT) and any dietary requirements.
                </p>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-semibold text-zinc-800 mb-1.5 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <span>Stated Total Budget (BDT)</span> <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 font-bold text-xs">
                    BDT
                  </div>
                  <input
                    type="number"
                    min={5000}
                    step={1000}
                    {...register("budget", { valueAsNumber: true })}
                    className="w-full pl-14 pr-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm font-bold text-zinc-900"
                  />
                </div>

                {/* Quick Budget Presets */}
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {[
                    { label: "2.5 Lakh", val: 250000 },
                    { label: "5 Lakh", val: 500000 },
                    { label: "8 Lakh", val: 800000 },
                    { label: "12 Lakh", val: 1200000 },
                    { label: "20 Lakh", val: 2000000 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setValue("budget", preset.val)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium transition cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-zinc-500 mt-2">
                  PlanKori will automatically curate Economy (~70%), Standard (~90%), and Premium (up to 100%) packages within this budget.
                </p>

                {errors.budget && (
                  <p className="text-xs text-red-600 mt-1">{errors.budget.message}</p>
                )}
              </div>

              {/* Dietary Needs */}
              <div className="pt-2">
                <label className="block text-sm font-semibold text-zinc-800 mb-1.5 flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-amber-600" />
                  <span>Dietary Preferences (Catering)</span>
                </label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DIETARY_OPTIONS.map((diet) => {
                    const isSelected = (watchedValues.dietary_needs || []).includes(diet);
                    return (
                      <button
                        key={diet}
                        type="button"
                        onClick={() => toggleDietary(diet)}
                        className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition cursor-pointer ${
                          isSelected
                            ? "bg-amber-100 border-amber-300 text-amber-900 font-semibold"
                            : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                        }`}
                      >
                        {diet}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Theme & Categories */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Step 4: Theme, Vibe & Categories</h2>
                <p className="text-zinc-500 text-xs mt-1">
                  Describe the atmosphere and select which vendor services you want recommended.
                </p>
              </div>

              {/* Theme Description */}
              <div>
                <label className="block text-sm font-semibold text-zinc-800 mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-amber-600" />
                  <span>Theme & Vibe Description</span> <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. A romantic rustic garden ceremony under open skies with warm fairy lights and acoustic melodies..."
                  {...register("theme_description")}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm"
                />

                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-zinc-400">Inspiration:</span>
                  {THEME_INSPIRATIONS.map((thm) => (
                    <button
                      key={thm}
                      type="button"
                      onClick={() => appendThemeWord(thm)}
                      className="text-[11px] text-zinc-500 hover:text-amber-700 underline underline-offset-2 cursor-pointer"
                    >
                      +{thm}
                    </button>
                  ))}
                </div>

                {errors.theme_description && (
                  <p className="text-xs text-red-600 mt-1">{errors.theme_description.message}</p>
                )}
              </div>

              {/* Must-Have Categories */}
              <div className="pt-2">
                <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
                  Must-Have Service Categories
                </label>
                <p className="text-xs text-zinc-500 mb-3">
                  Uncheck any categories you already have covered on your own:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const isChecked = (watchedValues.must_have_categories || []).includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
                          isChecked
                            ? "bg-amber-50/70 border-amber-500 text-amber-950"
                            : "bg-zinc-50 border-zinc-200 text-zinc-400"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                            isChecked
                              ? "bg-amber-600 border-amber-600 text-white"
                              : "border-zinc-300 bg-white"
                          }`}
                        >
                          {isChecked && "✓"}
                        </div>
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Submit */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Step 5: Review & Confirm</h2>
                <p className="text-zinc-500 text-xs mt-1">
                  Double check your event details before saving it as draft.
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-6 space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-zinc-200">
                  <div>
                    <span className="text-xs text-zinc-400 uppercase font-semibold">Event Title</span>
                    <p className="font-bold text-zinc-900 mt-0.5">{watchedValues.title}</p>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 uppercase font-semibold">Event Type</span>
                    <p className="font-medium text-zinc-800 mt-0.5">{watchedValues.event_type}</p>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 uppercase font-semibold">Scheduled Date</span>
                    <p className="font-medium text-zinc-800 mt-0.5">
                      {watchedValues.event_date
                        ? new Date(watchedValues.event_date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "TBA"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 uppercase font-semibold">Location City</span>
                    <p className="font-medium text-zinc-800 mt-0.5">{watchedValues.location_city}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-zinc-200">
                  <div>
                    <span className="text-xs text-zinc-400 uppercase font-semibold">Stated Budget</span>
                    <p className="font-bold text-amber-700 text-base mt-0.5">
                      {Number(watchedValues.budget).toLocaleString()} BDT
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 uppercase font-semibold">Headcount</span>
                    <p className="font-bold text-zinc-900 text-base mt-0.5">
                      {watchedValues.headcount} Guests
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-zinc-400 uppercase font-semibold">Theme & Vibe</span>
                  <p className="text-zinc-700 text-xs mt-1 leading-relaxed">
                    {watchedValues.theme_description || "None specified"}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-zinc-400 uppercase font-semibold">Dietary Needs</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(watchedValues.dietary_needs || []).length > 0 ? (
                      watchedValues.dietary_needs.map((d) => (
                        <span key={d} className="text-xs px-2 py-0.5 bg-white border border-zinc-200 rounded capitalize">
                          {d}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-500">None specified</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-zinc-400 uppercase font-semibold">Selected Categories</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(watchedValues.must_have_categories || []).map((cat) => (
                      <span key={cat} className="text-xs px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded font-medium capitalize">
                        {cat.replace("_", " ")}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Actions Bar */}
          <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition"
              >
                Cancel
              </Link>
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-sm transition cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Event...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Draft & View Event</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

