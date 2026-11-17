"use client";

import { useState } from "react";
import { toggleVendorActiveAction } from "@/app/vendor/actions";
import { Power, Loader2 } from "lucide-react";

interface ListingStatusToggleProps {
  id: string;
  initialActive: boolean;
}

export function ListingStatusToggle({ id, initialActive }: ListingStatusToggleProps) {
  const [active, setActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    const nextState = !active;
    try {
      await toggleVendorActiveAction(id, nextState);
      setActive(nextState);
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
        active
          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-zinc-200"
      }`}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Power className="w-3 h-3" />
      )}
      <span>{active ? "Active" : "Inactive"}</span>
    </button>
  );
}
