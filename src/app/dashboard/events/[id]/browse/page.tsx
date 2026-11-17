import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { demoStore, type DemoEvent, type DemoPackage } from "@/lib/demo-store";
import { SEED_VENDORS, type SeedVendor } from "../../../../../../data/vendors.seed.ts";
import { VendorBrowseView } from "@/components/events/VendorBrowseView";

interface BrowsePageProps {
  params: Promise<{ id: string }>;
}

export default async function BrowseVendorsPage({ params }: BrowsePageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?redirectTo=/dashboard/events/${id}/browse`);
  }

  let event: DemoEvent | null = null;
  let existingPackage: DemoPackage | null = null;
  let vendors: SeedVendor[] = [];

  // Try fetching event from Supabase
  try {
    const supabase = await createClient();
    const { data: dbEvent, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (dbEvent && !error) {
      event = dbEvent as unknown as DemoEvent;
    }
  } catch {}

  // Fallback to demo store
  if (!event) {
    event = demoStore.getEventById(id);
  }

  // Server-side ownership verification
  if (!event || event.host_id !== user.id) {
    notFound();
  }

  // Try fetching manual package from Supabase
  try {
    const supabase = await createClient();
    const { data: dbPackages } = await supabase
      .from("packages")
      .select("*, package_items(*)")
      .eq("event_id", id)
      .eq("notes", "manual")
      .order("created_at", { ascending: false })
      .limit(1);

    if (dbPackages && dbPackages.length > 0) {
      existingPackage = dbPackages[0] as unknown as DemoPackage;
    }
  } catch {}

  // Fallback to demo store for existing package
  if (!existingPackage) {
    const storePackages = demoStore.getPackagesForEvent(id);
    const manualPkg = storePackages.find((p) => p.notes === "manual") || null;
    existingPackage = manualPkg;
  }

  // Try fetching active vendors from Supabase
  try {
    const supabase = await createClient();
    const { data: dbVendors } = await supabase
      .from("vendors")
      .select("*")
      .eq("is_active", true);

    if (dbVendors && dbVendors.length > 0) {
      vendors = dbVendors.map((v) => ({
        seed_key: v.seed_key || v.id,
        business_name: v.business_name,
        category: v.category,
        location_city: v.location_city as "Dhaka" | "Chittagong" | "Sylhet",
        description: v.description || "",
        base_price: v.base_price,
        price_unit: v.price_unit,
        min_capacity: v.min_capacity,
        max_capacity: v.max_capacity,
        tags: v.tags || [],
        themes: v.themes || [],
        dietary_options: v.dietary_options || [],
        portfolio_image_urls: v.portfolio_image_urls || [],
        rating: Number(v.rating) || 4.5,
        review_count: v.review_count || 10,
        is_new: v.is_new || false,
        days_old: 15,
      }));
    }
  } catch {}

  // Fallback to seed vendors
  if (vendors.length === 0) {
    vendors = SEED_VENDORS;
  }

  return (
    <VendorBrowseView
      event={event}
      allVendors={vendors}
      existingPackage={existingPackage}
    />
  );
}
