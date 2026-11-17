import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { demoStore, type DemoEvent, type DemoPackage } from "@/lib/demo-store";
import { EventDetailView } from "@/components/events/EventDetailView";

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?redirectTo=/dashboard/events/${id}`);
  }

  let event: DemoEvent | null = null;
  let packages: DemoPackage[] = [];

  // Try fetching from Supabase
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

  // Fetch packages for event
  try {
    const supabase = await createClient();
    const { data: dbPackages } = await supabase
      .from("packages")
      .select("*, package_items(*)")
      .eq("event_id", id);

    if (dbPackages && dbPackages.length > 0) {
      packages = dbPackages as unknown as DemoPackage[];
    }
  } catch {}

  if (packages.length === 0) {
    packages = demoStore.getPackagesForEvent(id);
  }

  return <EventDetailView event={event} packages={packages} />;
}
