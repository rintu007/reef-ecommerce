"use client";

import { useState } from "react";
import { addToWatchlist, removeFromWatchlist } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

export function SaveButton({
  listingId,
  initialSaved,
  className,
}: {
  listingId: string;
  initialSaved: boolean;
  className?: string;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const next = !saved;
    setSaved(next);
    try {
      if (next) await addToWatchlist(apiClient, listingId);
      else await removeFromWatchlist(apiClient, listingId);
    } catch {
      setSaved(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={saved ? "Remove from saved" : "Save listing"}
      className={
        className ??
        "w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-base shadow hover:scale-105 transition-transform"
      }
    >
      {saved ? "❤️" : "🤍"}
    </button>
  );
}
