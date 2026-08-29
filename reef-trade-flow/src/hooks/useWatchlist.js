import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

/**
 * Single shared query for all watchlist entries.
 * All ListingCards share the same queryKey so only ONE network call is made,
 * no matter how many cards are on screen.
 */
export function useWatchlist() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const queryClient = useQueryClient();

  const { data: watchlist = [] } = useQuery({
    queryKey: ["watchlist", "all"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Watchlist.filter({ user_email: user.email, type: "listing" });
    },
    enabled: isAuthenticated && !isLoadingAuth,
    staleTime: 1000 * 60 * 5,
  });

  const savedIds = new Set(watchlist.map((w) => w.listing_id));

  const toggle = async (listingId, currentlySaved) => {
    // Optimistic update
    queryClient.setQueryData(["watchlist", "all"], (old = []) =>
      currentlySaved
        ? old.filter((w) => w.listing_id !== listingId)
        : [...old, { listing_id: listingId, type: "listing" }]
    );
    try {
      await base44.functions.invoke("toggleWatchlist", {
        listingId,
        action: currentlySaved ? "unsave" : "save",
      });
    } catch {
      // Revert on failure
      queryClient.invalidateQueries({ queryKey: ["watchlist", "all"] });
    }
  };

  return { savedIds, toggle };
}