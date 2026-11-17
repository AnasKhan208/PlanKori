"use client";

import { useState } from "react";
import { respondToBookingRequestAction } from "@/app/vendor/actions";
import { Check, X, Loader2 } from "lucide-react";

interface BookingActionsProps {
  requestId: string;
  currentStatus: "pending" | "accepted" | "declined";
}

export function BookingActions({ requestId, currentStatus }: BookingActionsProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleRespond(newStatus: "accepted" | "declined") {
    setLoading(true);
    try {
      await respondToBookingRequestAction(requestId, newStatus);
      setStatus(newStatus);
    } catch (err) {
      console.error(err);
      alert("Failed to respond to booking request.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "accepted") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
        <Check className="w-3.5 h-3.5" />
        Accepted
      </span>
    );
  }

  if (status === "declined") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
        <X className="w-3.5 h-3.5" />
        Declined
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => handleRespond("accepted")}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        Accept
      </button>

      <button
        type="button"
        disabled={loading}
        onClick={() => handleRespond("declined")}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
        Decline
      </button>
    </div>
  );
}
