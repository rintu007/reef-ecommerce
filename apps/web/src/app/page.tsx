import { getAuthenticatedUser } from "@/lib/server/auth";
import { queryListings } from "@/lib/server/listings";
import { HomeTabs } from "./HomeTabs";

/**
 * Legacy parity: legacy/vite-app/src/components/home/MarketSelector.jsx +
 * pages/Home.jsx — web's root previously just `redirect("/browse")`, with no
 * Home landing page at all (unlike mobile, which at least had a guest-facing
 * Learn link). The Browse/Sell/Learn tabs below switch content in place
 * (via <HomeTabs>) rather than navigating away immediately — solid
 * gradients replace legacy's hotlinked stock photography.
 */
export default async function HomePage() {
  const viewer = await getAuthenticatedUser();

  const [saltwater, freshwater] = await Promise.all([
    queryListings({ market: "saltwater", status: "active", sort: "newest", limit: 6 }, viewer),
    queryListings({ market: "freshwater", status: "active", sort: "newest", limit: 6 }, viewer),
  ]);
  const previews = { saltwater: saltwater.listings, freshwater: freshwater.listings };

  return (
    <div className="bg-gradient-to-b from-blue-700 to-[#0a4a6b] min-h-[calc(100vh-57px)]">
      <div className="max-w-4xl mx-auto px-6 pt-14 pb-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-2xl">🪸</span>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Reef Market</h1>
        </div>
        <p className="text-white/70 text-sm font-medium">The aquarium hobbyist marketplace</p>
      </div>

      <HomeTabs previews={previews} />
    </div>
  );
}
