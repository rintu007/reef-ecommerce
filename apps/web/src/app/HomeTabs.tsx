"use client";

import { HELP_CATEGORIES, type Listing } from "@reef-market/shared";
import Link from "next/link";
import { useState } from "react";

type HomeTab = "browse" | "sell" | "learn";

const TAB_ACCENT: Record<HomeTab, string> = {
  browse: "bg-cyan-600",
  sell: "bg-orange-500",
  learn: "bg-emerald-600",
};

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

const SELL_CATEGORIES = [
  { emoji: "🪸", label: "Corals", desc: "Frags & colonies", gradient: "from-cyan-500 to-blue-900" },
  { emoji: "🐠", label: "Reef Fish", desc: "Clownfish, tangs...", gradient: "from-orange-400 to-rose-800" },
  { emoji: "🐟", label: "FW Fish", desc: "Cichlids, bettas...", gradient: "from-green-600 to-emerald-950" },
  { emoji: "🦎", label: "Amphibians", desc: "Axolotls, frogs...", gradient: "from-lime-600 to-green-950" },
  { emoji: "🔧", label: "Equipment", desc: "Tanks, lights, pumps", gradient: "from-slate-600 to-slate-950" },
  { emoji: "🌿", label: "Plants & More", desc: "Plants, inverts, food", gradient: "from-teal-600 to-teal-950" },
];

/**
 * Legacy parity: legacy/vite-app/src/components/home/MarketSelector.jsx — the
 * three tabs switch content in place rather than navigating away immediately.
 * Tapping "Sell" used to link straight to /sell, which shows a sign-in wall
 * for guests; legacy shows a category teaser first and only requires auth
 * once the user picks a category or taps "Create a Listing".
 */
export function HomeTabs({ previews }: { previews: Record<"saltwater" | "freshwater", Listing[]> }) {
  const [activeTab, setActiveTab] = useState<HomeTab>("browse");

  return (
    <>
      <div className="max-w-4xl mx-auto px-6 flex gap-3 mb-8">
        {(["browse", "sell", "learn"] as HomeTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 h-16 rounded-2xl transition-colors flex flex-col items-center justify-center gap-1 ${
              activeTab === tab ? `${TAB_ACCENT[tab]} ring-1 ring-white/60` : "bg-white/15 hover:bg-white/20"
            }`}
          >
            <span className="text-white font-bold text-sm">
              {tab === "browse" ? "🌊 Browse" : tab === "sell" ? "🛍️ Sell" : "📖 Learn"}
            </span>
          </button>
        ))}
      </div>

      {activeTab === "browse" && (
        <>
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
        </>
      )}

      {activeTab === "sell" && (
        <div className="max-w-4xl mx-auto px-6 pb-16">
          <div className="text-center mb-6">
            <h2 className="text-xl font-extrabold text-white">Start Selling Today</h2>
            <p className="text-white/60 text-sm mt-1">List corals, fish, amphibians & gear</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {SELL_CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                href="/sell"
                className={`rounded-2xl h-28 p-3 flex flex-col justify-end bg-gradient-to-br ${cat.gradient}`}
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-white text-sm font-bold mt-0.5">{cat.label}</span>
                <span className="text-white/70 text-[10px]">{cat.desc}</span>
              </Link>
            ))}
          </div>

          <Link
            href="/sell"
            className="block h-14 rounded-2xl bg-white text-slate-900 font-extrabold text-base shadow-xl flex items-center justify-center gap-2 mb-6"
          >
            🛍️ Create a Listing
          </Link>

          <div className="bg-white/10 rounded-2xl p-4 border border-white/10 max-w-md mx-auto">
            <p className="font-bold text-white mb-2">⭐ Why sell here?</p>
            <ul className="space-y-1.5 text-white/70 text-sm">
              <li>✅ Built for aquarium hobbyists</li>
              <li>✅ Buyer protection on every order</li>
              <li>✅ Easy photo uploads & listing tools</li>
              <li>✅ Reach thousands of buyers nationwide</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === "learn" && (
        <div className="max-w-2xl mx-auto px-6 pb-16">
          <div className="text-center mb-6">
            <h2 className="text-xl font-extrabold text-white">Learn & Explore</h2>
            <p className="text-white/60 text-sm mt-1">Guides, tips & care info for hobbyists</p>
          </div>

          <div className="space-y-3">
            {HELP_CATEGORIES.slice(0, 6).map((cat) => (
              <Link
                key={cat.value}
                href="/learn"
                className="flex items-center gap-3 rounded-2xl h-16 bg-white/10 border border-white/10 px-4"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-white font-bold text-sm flex-1">{cat.label}</span>
                <span className="text-white/50">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
