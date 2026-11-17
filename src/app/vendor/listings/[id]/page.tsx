import { VendorListingForm } from "@/components/vendor/VendorListingForm";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/vendor/listings/${id}`);
  }

  const { data: vendor, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !vendor || vendor.owner_id !== user.id) {
    notFound();
  }

  return <VendorListingForm initialData={vendor} isEdit={true} />;
}
