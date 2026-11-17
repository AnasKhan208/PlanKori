"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
import {
  createEventSchema,
  updateEventSchema,
  type CreateEventInput,
  type UpdateEventInput,
} from "@/lib/validators/event";
import { demoStore } from "@/lib/demo-store";
import { revalidatePath } from "next/cache";

export async function createEventAction(input: CreateEventInput) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: Please log in to create an event.");
  }

  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(`Validation failed: ${parsed.error.issues.map((i) => i.message).join(", ")}`);
  }

  const data = parsed.data;

  // Try saving to Supabase first
  try {
    const supabase = await createClient();
    const { data: event, error } = await supabase
      .from("events")
      .insert({
        host_id: user.id,
        title: data.title,
        event_type: data.event_type,
        event_date: data.event_date,
        location_city: data.location_city,
        budget: data.budget,
        headcount: data.headcount,
        theme_description: data.theme_description,
        dietary_needs: data.dietary_needs,
        must_have_categories: data.must_have_categories,
        status: "draft",
      })
      .select("id")
      .single();

    if (event && !error) {
      revalidatePath("/dashboard");
      return { success: true, id: event.id };
    }
  } catch (err) {
    console.warn("[createEventAction] Supabase insert failed, saving to local store:", err);
  }

  // Fallback to demo store
  const event = demoStore.createEvent(user.id, data);
  revalidatePath("/dashboard");
  return { success: true, id: event.id };
}

export async function updateEventAction(id: string, input: UpdateEventInput) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const parsed = updateEventSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(`Validation failed: ${parsed.error.issues.map((i) => i.message).join(", ")}`);
  }

  const updates = parsed.data;

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("events")
      .update({
        title: updates.title,
        event_type: updates.event_type,
        event_date: updates.event_date,
        location_city: updates.location_city,
        budget: updates.budget,
        headcount: updates.headcount,
        theme_description: updates.theme_description,
        dietary_needs: updates.dietary_needs,
        must_have_categories: updates.must_have_categories,
        status: updates.status,
      })
      .eq("id", id)
      .eq("host_id", user.id);

    if (!error) {
      revalidatePath("/dashboard");
      revalidatePath(`/dashboard/events/${id}`);
      return { success: true };
    }
  } catch (err) {
    console.warn("[updateEventAction] Supabase update failed, using demo store:", err);
  }

  const updated = demoStore.updateEvent(id, updates);
  if (!updated) {
    throw new Error("Event not found or cannot be updated.");
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/events/${id}`);
  return { success: true };
}

export async function saveManualPackageAction(eventId: string, vendorKeys: string[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  if (vendorKeys.length === 0) {
    throw new Error("Please select at least one vendor for your package.");
  }

  // Save manual package in demo store & Supabase
  const pkg = demoStore.saveManualPackage(eventId, vendorKeys);
  if (!pkg) {
    throw new Error("Event not found.");
  }

  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath(`/dashboard/events/${eventId}/browse`);
  return { success: true, packageId: pkg.id, totalCost: pkg.totalCost };
}

export async function updateProfileAction(data: { full_name: string; phone: string }) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!data.full_name.trim()) {
    throw new Error("Full name cannot be empty.");
  }

  try {
    const supabase = await createClient();
    await supabase
      .from("profiles")
      .update({
        full_name: data.full_name.trim(),
        phone: data.phone.trim() || null,
      })
      .eq("id", user.id);
  } catch (err) {
    console.warn("[updateProfileAction] Supabase update failed, updating demo store:", err);
  }

  demoStore.updateProfile(user.id, {
    full_name: data.full_name.trim(),
    phone: data.phone.trim(),
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { success: true };
}

