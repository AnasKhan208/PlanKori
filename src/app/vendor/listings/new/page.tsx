import { VendorListingForm } from "@/components/vendor/VendorListingForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NewListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/vendor/listings/new");
  }

  return <VendorListingForm isEdit={false} />;
}
