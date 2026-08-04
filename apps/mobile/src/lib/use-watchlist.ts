import { addToWatchlist, listWatchlist, removeFromWatchlist } from "@reef-market/shared";
import { useCallback, useEffect, useState } from "react";
import { apiClient } from "./api-client";
import { useAuth } from "./auth-context";

/** Mirrors legacy/vite-app's useWatchlist hook: a savedIds Set + optimistic toggle. */
export function useWatchlist() {
  const { session } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!session) {
      setSavedIds(new Set());
      return;
    }
    const { listings } = await listWatchlist(apiClient);
    setSavedIds(new Set(listings.map((l) => l.id)));
  }, [session]);

  useEffect(() => {
    const timer = setTimeout(refresh, 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  const toggle = useCallback(async (listingId: string, isSaved: boolean) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(listingId);
      else next.add(listingId);
      return next;
    });
    try {
      if (isSaved) await removeFromWatchlist(apiClient, listingId);
      else await addToWatchlist(apiClient, listingId);
    } catch (err) {
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(listingId);
        else next.delete(listingId);
        return next;
      });
      throw err;
    }
  }, []);

  return { savedIds, toggle };
}
