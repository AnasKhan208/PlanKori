import { getCurrentUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EventCreateMultiStepForm } from "@/components/events/EventCreateMultiStepForm";

export default async function NewEventPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=/dashboard/events/new");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <EventCreateMultiStepForm />
    </div>
  );
}
