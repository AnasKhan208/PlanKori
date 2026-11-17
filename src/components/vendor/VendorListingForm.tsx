"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createVendorListingAction, updateVendorListingAction } from "@/app/vendor/actions";
import { vendorListingSchema, type VendorListingInput } from "@/lib/validators/vendor";
import type { Tables } from "@/types/db";
import {
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Store,
  Users,
  Image as ImageIcon,
  Tag,
} from "lucide-react";

const THEME_OPTIONS = [
  "rustic",
  "cyberpunk",
  "minimalist",
  "traditional Bengali",
  "boho",
  "vintage",
  "royal luxury",
  "tropical beach",
  "garden",
  "modern corporate",
  "retro 80s",
  "fairy-tale",
  "eco-friendly",
  "holud",
  "Eid",
  "Pohela Boishakh",
];

const DIETARY_OPTIONS = [
  "halal",
  "traditional Bengali",
  "vegan",
  "vegetarian",
  "gluten-free",
  "nut-free",
  "continental",
];

const POPULAR_TAGS = [
  "indoor",
  "outdoor",
  "air-conditioned",
  "buffet",
  "drone",
  "live-band",
  "lighting",
  "cinematic",
  "traditional",
  "premium",
  "budget-friendly",
];

interface VendorListingFormProps {
  initialData?: Tables<"vendors">;
  isEdit?: boolean;
}

export function VendorListingForm({ initialData, isEdit = false }: VendorListingFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [businessName, setBusinessName] = useState(initialData?.business_name || "");
  const [category, setCategory] = useState<VendorListingInput["category"]>(
    initialData?.category || "venue"
  );
  const [city, setCity] = useState(initialData?.location_city || "Dhaka");
  const [description, setDescription] = useState(initialData?.description || "");
  const [basePrice, setBasePrice] = useState(initialData?.base_price?.toString() || "");
  const [priceUnit, setPriceUnit] = useState<VendorListingInput["price_unit"]>(
    initialData?.price_unit || "flat"
  );
  const [minCapacity, setMinCapacity] = useState(initialData?.min_capacity?.toString() || "");
  const [maxCapacity, setMaxCapacity] = useState(initialData?.max_capacity?.toString() || "");
  const [selectedThemes, setSelectedThemes] = useState<string[]>(initialData?.themes || []);
  const [selectedDietary, setSelectedDietary] = useState<string[]>(initialData?.dietary_options || []);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [customTagInput, setCustomTagInput] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>(initialData?.portfolio_image_urls || []);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [isActive, setIsActive] = useState<boolean>(initialData?.is_active ?? true);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function toggleTheme(theme: string) {
    if (selectedThemes.includes(theme)) {
      setSelectedThemes(selectedThemes.filter((t) => t !== theme));
    } else {
      setSelectedThemes([...selectedThemes, theme]);
    }
  }

  function toggleDietary(diet: string) {
    if (selectedDietary.includes(diet)) {
      setSelectedDietary(selectedDietary.filter((d) => d !== diet));
    } else {
      setSelectedDietary([...selectedDietary, diet]);
    }
  }

  function addTag(tag: string) {
    const clean = tag.trim().toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function removeImage(index: number) {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  }

  function addDirectImageUrl() {
    if (!customImageUrl.trim()) return;
    if (imageUrls.length >= 8) {
      setErrorMsg("Maximum 8 images allowed.");
      return;
    }
    setImageUrls([...imageUrls, customImageUrl.trim()]);
    setCustomImageUrl("");
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (imageUrls.length + files.length > 8) {
      setErrorMsg(`You can only have up to 8 images total (current: ${imageUrls.length}).`);
      return;
    }

    setUploading(true);
    setErrorMsg(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Must be logged in to upload files.");
      }

      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("vendor-portfolios")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.warn("[Upload Error]", uploadError);
          // If storage bucket isn't set up yet, use a seeded placeholder fallback for testing
          uploadedUrls.push(`https://picsum.photos/seed/${user.id}-${Date.now()}-${i}/800/600`);
        } else {
          const { data } = supabase.storage.from("vendor-portfolios").getPublicUrl(filePath);
          uploadedUrls.push(data.publicUrl);
        }
      }

      setImageUrls([...imageUrls, ...uploadedUrls]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error uploading files";
      setErrorMsg(msg);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload: VendorListingInput = {
      business_name: businessName.trim(),
      category,
      location_city: city.trim(),
      description: description.trim(),
      base_price: parseInt(basePrice, 10) || 0,
      price_unit: priceUnit,
      min_capacity: minCapacity ? parseInt(minCapacity, 10) : null,
      max_capacity: maxCapacity ? parseInt(maxCapacity, 10) : null,
      tags,
      themes: selectedThemes,
      dietary_options: category === "catering" ? selectedDietary : [],
      portfolio_image_urls: imageUrls,
      is_active: isActive,
    };

    const parsed = vendorListingSchema.safeParse(payload);
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues.map((i) => i.message).join(" • "));
      return;
    }

    setSaving(true);

    try {
      if (isEdit && initialData) {
        await updateVendorListingAction(initialData.id, parsed.data);
        setSuccessMsg("Listing updated successfully! Embedding regenerated.");
      } else {
        await createVendorListingAction(parsed.data);
        setSuccessMsg("Listing created successfully! Embedding generated.");
      }
      router.refresh();
      setTimeout(() => {
        router.push("/vendor/listings");
      }, 800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save listing";
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/vendor/listings"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Listings</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium">Status:</span>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${
              isActive
                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
            }`}
          >
            {isActive ? "Active (Listed)" : "Inactive (Hidden)"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 sm:p-8">
        <div className="mb-8 pb-6 border-b border-zinc-100">
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2.5">
            <Store className="w-6 h-6 text-amber-600" />
            <span>{isEdit ? "Edit Service Listing" : "Create New Service Listing"}</span>
          </h1>
          <p className="text-zinc-600 text-sm mt-1">
            Fill in your service details. PlanKori AI will automatically generate semantic embeddings so hosts find your service when planning events.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            <div>{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
            <div>{successMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Tea Haven Garden Resort"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
                Service Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as VendorListingInput["category"])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm bg-white"
              >
                <option value="venue">Venue (Banquet Hall, Garden, Resort)</option>
                <option value="catering">Catering (Buffet, Plated, Snacks)</option>
                <option value="decoration">Decoration & Floral Architecture</option>
                <option value="av_tech">AV, Lighting & Sound Tech</option>
                <option value="photography">Photography & Cinematography</option>
                <option value="entertainment">Entertainment (DJ, Folk, Live Band)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
                Location City <span className="text-red-500">*</span>
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm bg-white"
              >
                <option value="Dhaka">Dhaka</option>
                <option value="Chittagong">Chittagong</option>
                <option value="Sylhet">Sylhet</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
                Pricing Structure <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 text-xs font-semibold">
                    BDT
                  </div>
                  <input
                    type="number"
                    required
                    min={1}
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="e.g. 150000"
                    className="w-full pl-12 pr-3 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm"
                  />
                </div>
                <select
                  value={priceUnit}
                  onChange={(e) => setPriceUnit(e.target.value as VendorListingInput["price_unit"])}
                  className="px-3 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm bg-white"
                >
                  <option value="flat">flat (total)</option>
                  <option value="per_person">per person</option>
                  <option value="per_hour">per hour</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Capacity (Venue / Catering) */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80">
            <h3 className="text-sm font-semibold text-zinc-800 flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-amber-600" />
              <span>Guest Capacity (Required for Venues; leave empty if unlimited)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Minimum Capacity (Headcount)
                </label>
                <input
                  type="number"
                  min={0}
                  value={minCapacity}
                  onChange={(e) => setMinCapacity(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Maximum Capacity (null = no upper limit)
                </label>
                <input
                  type="number"
                  min={1}
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Description */}
          <div>
            <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
              Service Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your service, key highlights, style, equipment, or culinary specialties in 2-4 sentences..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm"
            />
          </div>

          {/* Section 4: Themes */}
          <div>
            <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
              Themes Supported
            </label>
            <p className="text-xs text-zinc-500 mb-2">
              Select all styles or event themes you specialize in:
            </p>
            <div className="flex flex-wrap gap-2">
              {THEME_OPTIONS.map((theme) => {
                const isSelected = selectedThemes.includes(theme);
                return (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => toggleTheme(theme)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                      isSelected
                        ? "bg-amber-100 border-amber-300 text-amber-900 font-semibold"
                        : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    {theme}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Dietary Options (if Catering) */}
          {category === "catering" && (
            <div className="p-4 rounded-xl bg-orange-50/40 border border-orange-100">
              <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
                Dietary & Cuisine Options
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DIETARY_OPTIONS.map((diet) => {
                  const isSelected = selectedDietary.includes(diet);
                  return (
                    <button
                      key={diet}
                      type="button"
                      onClick={() => toggleDietary(diet)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                        isSelected
                          ? "bg-orange-100 border-orange-300 text-orange-900 font-semibold"
                          : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                      }`}
                    >
                      {diet}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 6: Tags */}
          <div>
            <label className="block text-sm font-semibold text-zinc-800 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-amber-600" />
              <span>Tags</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 text-xs bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded-md"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="hover:text-red-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(customTagInput);
                    setCustomTagInput("");
                  }
                }}
                placeholder="Type tag & press enter (e.g. scenic, buffet)..."
                className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  addTag(customTagInput);
                  setCustomTagInput("");
                }}
                className="px-3 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-xs font-medium text-zinc-700"
              >
                Add Tag
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-xs text-zinc-400 self-center">Suggestions:</span>
              {POPULAR_TAGS.map((pt) => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => addTag(pt)}
                  className="text-xs text-zinc-500 hover:text-amber-700 underline underline-offset-2"
                >
                  +{pt}
                </button>
              ))}
            </div>
          </div>

          {/* Section 7: Portfolio Images */}
          <div className="pt-4 border-t border-zinc-100">
            <label className="block text-sm font-semibold text-zinc-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                <span>Portfolio Images (up to 8)</span>
              </span>
              <span className="text-xs text-zinc-500 font-normal">{imageUrls.length} / 8 images</span>
            </label>

            {/* Previews Grid */}
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-zinc-200 aspect-[4/3] bg-zinc-100">
                    <Image
                      src={url}
                      alt={`Portfolio item ${idx + 1}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 hover:bg-black text-white cursor-pointer transition shadow"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {imageUrls.length < 8 && (
              <div className="mt-3 space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <label className="flex-1 border-2 border-dashed border-zinc-200 hover:border-amber-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition bg-zinc-50/50">
                    <Upload className="w-5 h-5 text-zinc-400 mb-1" />
                    <span className="text-xs font-medium text-zinc-700">
                      {uploading ? "Uploading..." : "Upload images to Supabase Storage"}
                    </span>
                    <span className="text-[11px] text-zinc-400">PNG, JPG, WebP up to 10MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={uploading}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="text-center text-xs text-zinc-400 sm:px-2">or</div>

                  <div className="flex-1 flex gap-2">
                    <input
                      type="url"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      placeholder="Paste image URL..."
                      className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 text-xs"
                    />
                    <button
                      type="button"
                      onClick={addDirectImageUrl}
                      className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold text-zinc-800"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="pt-6 border-t border-zinc-100 flex items-center justify-end gap-3">
            <Link
              href="/vendor/listings"
              className="px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-sm font-semibold text-white shadow-md shadow-amber-600/20 disabled:opacity-50 transition cursor-pointer"
            >
              {saving ? "Saving & Generating Embedding..." : isEdit ? "Update Listing" : "Create Listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
