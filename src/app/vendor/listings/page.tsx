import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Store, Plus, Edit3, ArrowLeft } from "lucide-react";
import { ListingStatusToggle } from "@/components/vendor/ListingStatusToggle";

export default async function VendorListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/vendor/listings");
  }

  const { data: listings } = await supabase
    .from("vendors")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-zinc-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation & Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/vendor/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Vendor Hub</span>
            </Link>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2.5">
              <Store className="w-6 h-6 text-amber-600" />
              <span>My Service Listings</span>
            </h1>
            <p className="text-zinc-600 text-sm mt-1">
              Manage your event services, pricing, capacity, and active availability.
            </p>
          </div>

          <Link
            href="/vendor/listings/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Listing</span>
          </Link>
        </div>

        {/* Listings Table */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          {!listings || listings.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">No listings yet</h3>
              <p className="text-zinc-500 text-sm max-w-md mx-auto mt-1 mb-6">
                You haven&apos;t created any service listings yet. Add your first venue, catering, decoration, or entertainment service to start receiving host booking requests.
              </p>
              <Link
                href="/vendor/listings/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white font-semibold text-sm hover:bg-amber-700 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Listing</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Business / Service</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">City</th>
                    <th className="py-3.5 px-4">Base Price</th>
                    <th className="py-3.5 px-4">Capacity</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {listings.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/60 transition">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-semibold text-zinc-900">{item.business_name}</div>
                        <div className="text-xs text-zinc-500 line-clamp-1 max-w-xs mt-0.5">
                          {item.description}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize bg-amber-50 text-amber-800 border border-amber-200">
                          {item.category.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-medium text-zinc-700">{item.location_city}</td>
                      <td className="py-4 px-4 text-zinc-900 font-semibold">
                        {item.base_price.toLocaleString()} BDT
                        <span className="text-xs text-zinc-400 font-normal ml-1">
                          / {item.price_unit.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-zinc-600 text-xs">
                        {item.min_capacity != null || item.max_capacity != null
                          ? `${item.min_capacity ?? 0} – ${item.max_capacity ?? "∞"}`
                          : "No limit"}
                      </td>
                      <td className="py-4 px-4">
                        <ListingStatusToggle id={item.id} initialActive={item.is_active} />
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={`/vendor/listings/${item.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 bg-white text-zinc-700 text-xs font-medium hover:bg-zinc-50 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
