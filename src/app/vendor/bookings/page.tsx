import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarCheck, ArrowLeft, Calendar, MapPin, Users } from "lucide-react";
import { BookingActions } from "@/components/vendor/BookingActions";

export default async function VendorBookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/vendor/bookings");
  }

  // Get all vendor IDs owned by this user
  const { data: myVendors } = await supabase
    .from("vendors")
    .select("id, business_name")
    .eq("owner_id", user.id);

  const vendorIds = (myVendors || []).map((v) => v.id);

  type BookingRequestRow = {
    id: string;
    status: "pending" | "accepted" | "declined";
    created_at: string;
    responded_at: string | null;
    vendor_id: string;
    vendors: { id: string; business_name: string; category: string } | null;
    events: {
      id: string;
      title: string;
      event_type: string;
      event_date: string | null;
      location_city: string;
      headcount: number;
    } | null;
    packages: { tier: string } | null;
    package_items: { estimated_cost: number } | null;
  };

  let bookingRequests: BookingRequestRow[] = [];

  if (vendorIds.length > 0) {
    const { data } = await supabase
      .from("booking_requests")
      .select(`
        id,
        status,
        created_at,
        responded_at,
        vendor_id,
        vendors (id, business_name, category),
        events (id, title, event_type, event_date, location_city, headcount),
        packages (tier),
        package_items (estimated_cost)
      `)
      .in("vendor_id", vendorIds)
      .order("created_at", { ascending: false });

    if (data) {
      bookingRequests = data as unknown as BookingRequestRow[];
    }
  }

  const pendingCount = bookingRequests.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-zinc-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
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
              <CalendarCheck className="w-6 h-6 text-blue-600" />
              <span>Booking Inquiries & Requests</span>
            </h1>
            <p className="text-zinc-600 text-sm mt-1">
              Review and respond to event hosts requesting your services. You have{" "}
              <span className="font-semibold text-amber-700">{pendingCount} pending</span> request
              {pendingCount === 1 ? "" : "s"}.
            </p>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          {bookingRequests.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">No booking requests yet</h3>
              <p className="text-zinc-500 text-sm max-w-md mx-auto mt-1">
                When hosts generate vendor packages and send booking requests for your services, they will appear here for you to accept or decline.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Event Details</th>
                    <th className="py-3.5 px-4">Your Listing</th>
                    <th className="py-3.5 px-4">Headcount & Date</th>
                    <th className="py-3.5 px-4">Package & Estimated Fee</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {bookingRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-zinc-50/60 transition">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-semibold text-zinc-900">
                          {req.events?.title || "Untitled Event"}
                        </div>
                        <div className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          <span className="capitalize">{req.events?.event_type || "Event"}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-zinc-400" />
                            {req.events?.location_city}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-medium text-zinc-800">
                          {req.vendors?.business_name || "Service Listing"}
                        </div>
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-zinc-100 text-zinc-600 mt-0.5">
                          {req.vendors?.category}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-xs text-zinc-600">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{req.events?.headcount} guests</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-zinc-500">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{req.events?.event_date || "Date TBA"}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-zinc-900">
                          {req.package_items?.estimated_cost
                            ? `${req.package_items.estimated_cost.toLocaleString()} BDT`
                            : "N/A"}
                        </div>
                        <div className="text-xs text-zinc-500 capitalize mt-0.5">
                          Tier: {req.packages?.tier || "Standard"}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            req.status === "accepted"
                              ? "bg-emerald-100 text-emerald-800"
                              : req.status === "declined"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-right">
                        <BookingActions requestId={req.id} currentStatus={req.status} />
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
