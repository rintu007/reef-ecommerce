import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { queryListings } from "@/lib/server/listings";

const CATEGORY_CARDS = [
  {
    market: "saltwater" as const,
    emoji: "🪸",
    label: "Saltwater",
    subtitle: "Corals · Reef Fish · Equipment",
    gradient: "from-cyan-500 to-blue-800",
  },
  {
    market: "freshwater" as const,
    emoji: "🐟",
    label: "Freshwater",
    subtitle: "Fish · Amphibians · Plants · Equipment",
    gradient: "from-emerald-500 to-teal-800",
  },
];

/**
 * Legacy parity: legacy/vite-app/src/components/home/MarketSelector.jsx +
 * pages/Home.jsx — web's root previously just `redirect("/browse")`, with no
 * Home landing page at all (unlike mobile, which at least had a guest-facing
 * Learn link). Same simplification as apps/mobile's new (tabs)/home.tsx: the
 * Browse/Sell/Learn quick actions link out to the real screens instead of
 * duplicating their content inline, and solid gradients replace legacy's
 * hotlinked stock photography.
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

      <div className="max-w-4xl mx-auto px-6 flex gap-3 mb-8">
        <Link href="/browse" className="flex-1 h-16 rounded-2xl bg-white/15 hover:bg-white/20 transition-colors flex flex-col items-center justify-center gap-1">
          <span className="text-white font-bold text-sm">🌊 Browse</span>
        </Link>
        <Link href="/sell" className="flex-1 h-16 rounded-2xl bg-white/15 hover:bg-white/20 transition-colors flex flex-col items-center justify-center gap-1">
          <span className="text-white font-bold text-sm">🛍️ Sell</span>
        </Link>
        <Link href="/learn" className="flex-1 h-16 rounded-2xl bg-white/15 hover:bg-white/20 transition-colors flex flex-col items-center justify-center gap-1">
          <span className="text-white font-bold text-sm">📖 Learn</span>
        </Link>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-xl font-extrabold text-white">What are you shopping for?</h2>
        <p className="text-white/50 text-xs mt-0.5">Tap a market to start browsing</p>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-16 grid sm:grid-cols-2 gap-5">
        {CATEGORY_CARDS.map((card) => {
          const listings = previews[card.market];
          return (
            <div key={card.market} className="bg-white/10 rounded-3xl p-4 border border-white/10">
              <Link
                href={`/browse?market=${card.market}`}
                className={`block rounded-2xl h-40 bg-gradient-to-br ${card.gradient} flex flex-col items-center justify-center gap-1.5`}
              >
                <span className="text-5xl drop-shadow-lg">{card.emoji}</span>
                <span className="text-2xl font-extrabold text-white tracking-tight">{card.label}</span>
                <span className="text-white/90 text-xs font-medium bg-black/20 px-3 py-0.5 rounded-full">{card.subtitle}</span>
              </Link>

              {listings.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-white/70 uppercase tracking-widest">{card.label} · New</p>
                    <Link href={`/browse?market=${card.market}`} className="text-xs text-white/90 font-semibold">
                      See all →
                    </Link>
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto pb-1">
                    {listings.map((listing) => (
                      <Link key={listing.id} href={`/listings/${listing.id}`} className="min-w-[130px] max-w-[130px] rounded-xl overflow-hidden bg-white/10 shrink-0">
                        <div className="w-full h-[90px] bg-white/5">
                          {listing.photos[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-white text-xs font-semibold truncate">{listing.title}</p>
                          <p className="text-white/80 text-xs font-bold mt-0.5">${listing.price.toFixed(2)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
