"use server";

import { createClient } from "@/lib/supabase/server";
import { vendorListingSchema, type VendorListingInput } from "@/lib/validators/vendor";
import { embedVendor } from "@/lib/ai/embeddings";
import { revalidatePath } from "next/cache";

export async function createVendorListingAction(input: VendorListingInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized: Please log in to create a listing.");
  }

  const validation = vendorListingSchema.safeParse(input);
  if (!validation.success) {
    const errorMsg = validation.error.issues.map((i) => i.message).join(", ");
    throw new Error(`Validation failed: ${errorMsg}`);
  }

  const data = validation.data;

  // Generate embedding server-side
  const { embedding, source } = await embedVendor({
    business_name: data.business_name,
    category: data.category,
    description: data.description,
    tags: data.tags,
    themes: data.themes,
    dietary_options: data.dietary_options,
    location_city: data.location_city,
  });

  const { data: vendor, error } = await supabase
    .from("vendors")
    .insert({
      owner_id: user.id,
      business_name: data.business_name,
      category: data.category,
      description: data.description,
      location_city: data.location_city,
      base_price: data.base_price,
      price_unit: data.price_unit,
      min_capacity: data.min_capacity || null,
      max_capacity: data.max_capacity || null,
      tags: data.tags,
      themes: data.themes,
      dietary_options: data.dietary_options,
      portfolio_image_urls: data.portfolio_image_urls,
      is_new: true,
      is_active: data.is_active,
      is_featured: false,
      embedding: `[${embedding.join(",")}]`,
      embedding_source: source,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[createVendorListingAction] Error inserting vendor:", error);
    throw new Error(`Failed to create vendor: ${error.message}`);
  }

  revalidatePath("/vendor/listings");
  revalidatePath("/vendor/dashboard");
  return { success: true, id: vendor.id };
}

export async function updateVendorListingAction(id: string, input: VendorListingInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const validation = vendorListingSchema.safeParse(input);
  if (!validation.success) {
    const errorMsg = validation.error.issues.map((i) => i.message).join(", ");
    throw new Error(`Validation failed: ${errorMsg}`);
  }

  const data = validation.data;

  // Verify ownership
  const { data: existing } = await supabase
    .from("vendors")
    .select("owner_id")
    .eq("id", id)
    .single();

  if (!existing || existing.owner_id !== user.id) {
    throw new Error("Forbidden: You do not own this listing.");
  }

  // Regenerate embedding server-side
  const { embedding, source } = await embedVendor({
    business_name: data.business_name,
    category: data.category,
    description: data.description,
    tags: data.tags,
    themes: data.themes,
    dietary_options: data.dietary_options,
    location_city: data.location_city,
  });

  const { error } = await supabase
    .from("vendors")
    .update({
      business_name: data.business_name,
      category: data.category,
      description: data.description,
      location_city: data.location_city,
      base_price: data.base_price,
      price_unit: data.price_unit,
      min_capacity: data.min_capacity || null,
      max_capacity: data.max_capacity || null,
      tags: data.tags,
      themes: data.themes,
      dietary_options: data.dietary_options,
      portfolio_image_urls: data.portfolio_image_urls,
      is_active: data.is_active,
      embedding: `[${embedding.join(",")}]`,
      embedding_source: source,
    })
    .eq("id", id);

  if (error) {
    console.error("[updateVendorListingAction] Error updating vendor:", error);
    throw new Error(`Failed to update vendor: ${error.message}`);
  }

  revalidatePath("/vendor/listings");
  revalidatePath(`/vendor/listings/${id}`);
  revalidatePath("/vendor/dashboard");
  return { success: true };
}

export async function toggleVendorActiveAction(id: string, is_active: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("vendors")
    .update({ is_active })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) {
    throw new Error(`Failed to update status: ${error.message}`);
  }

  revalidatePath("/vendor/listings");
  revalidatePath("/vendor/dashboard");
  return { success: true };
}

export async function respondToBookingRequestAction(
  requestId: string,
  status: "accepted" | "declined"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Verify that this booking request is for a vendor owned by the current user
  const { data: request, error: fetchError } = await supabase
    .from("booking_requests")
    .select("id, vendor_id, vendors!inner(owner_id)")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) {
    throw new Error("Booking request not found.");
  }

  const vendorOwnerId = (request as unknown as { vendors: { owner_id: string } }).vendors?.owner_id;
  if (vendorOwnerId !== user.id) {
    throw new Error("Forbidden: You do not have permission to manage this booking request.");
  }

  const { error: updateError } = await supabase
    .from("booking_requests")
    .update({
      status,
      responded_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (updateError) {
    throw new Error(`Failed to respond to booking: ${updateError.message}`);
  }

  revalidatePath("/vendor/bookings");
  revalidatePath("/vendor/dashboard");
  return { success: true };
}
