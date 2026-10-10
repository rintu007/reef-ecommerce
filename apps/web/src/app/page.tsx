import Link from "next/link";
import { ArrowRight, ArrowUpRight, Search, ShieldCheck, Truck, Wallet } from "lucide-react";
import { HELP_CATEGORIES } from "@reef-market/shared";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { queryListings } from "@/lib/server/listings";
import { listSavedListingIds } from "@/lib/server/watchlist";
import { ListingCard } from "@/components/ListingCard";

// Same hotlinked photos legacy's MarketSelector.jsx used, kept so the market
// cards carry real imagery rather than flat gradients.
const HERO_IMAGE = "https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=2000&q=85";

const MARKETS = [
  {
    market: "saltwater" as const,
    label: "Saltwater",
    accent: "& reef",
    subtitle: "Corals · Reef fish · Inverts · Equipment",
    image: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1200&q=85",
    overlay: "from-blue-950/90 via-blue-900/30",
  },
  {
    market: "freshwater" as const,
    label: "Freshwater",
    accent: "& planted",
    subtitle: "Fish · Amphibians · Plants · Equipment",
    image:
      "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/d9e02985b_360_F_442044627_gYizFV5eCOJLKCxAaXyG47Lq1ow5LsmN.jpg",
    overlay: "from-emerald-950/90 via-emerald-900/30",
  },
];

const SELL_CATEGORIES = [
  { label: "Corals", desc: "Frags & colonies", image: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=600&q=80" },
  { label: "Reef fish", desc: "Clownfish, tangs…", image: "https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=600&q=80" },
  { label: "Freshwater fish", desc: "Cichlids, bettas…", image: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/67df2e37b_generated_image.png" },
  { label: "Amphibians", desc: "Axolotls, frogs…", image: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/e49fee415_generated_image.png" },
  { label: "Equipment", desc: "Tanks, lights, pumps", image: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/4c2b2708e_generated_image.png" },
  { label: "Plants & more", desc: "Plants, inverts, food", image: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/8c3afb853_generated_image.png" },
];

const STEPS = [
  { title: "List in minutes", body: "Photos, care details, price, shipping or local pickup — everything a buyer needs to decide." },
  { title: "Sell with protection", body: "Buyers pay through Reef Market. Livestock that arrives dead is covered by a DOA claim process." },
  { title: "Get paid", body: "Funds go to your bank via Stripe once the order is delivered or picked up." },
];

const PROMISES = [
  { icon: ShieldCheck, title: "Buyer protection", body: "Every order paid in-app, with DOA claims for livestock." },
  { icon: Truck, title: "Ship or meet up", body: "Shipping tiers or local pickup, filtered by distance." },
  { icon: Wallet, title: "Seller payouts", body: "Stripe-powered payouts straight to your bank." },
];

/**
 * Landing page. Replaces the legacy Browse/Sell/Learn tab switcher
 * (legacy MarketSelector.jsx) with one scrolling page carrying the same three
 * pieces of content — market entry, sell teaser, learn topics — so nothing
 * from the tabs is lost, and guests still see the sell teaser before any
 * sign-in wall.
 */
export default async function HomePage() {
  const viewer = await getAuthenticatedUser();

  const [saltwater, freshwater, savedIds] = await Promise.all([
    queryListings({ market: "saltwater", status: "active", sort: "newest", limit: 6 }, viewer),
    queryListings({ market: "freshwater", status: "active", sort: "newest", limit: 6 }, viewer),
    viewer ? listSavedListingIds(viewer.id) : Promise.resolve<string[]>([]),
  ]);
  const savedSet = new Set(savedIds);
  const totalLive = saltwater.total + freshwater.total;
  const totals = { saltwater: saltwater.total, freshwater: freshwater.total };

  // "both"-market listings come back in both queries — dedupe before merging.
  const seen = new Set<string>();
  const newArrivals = [...saltwater.listings, ...freshwater.listings]
    .filter((l) => (seen.has(l.id) ? false : (seen.add(l.id), true)))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 8);

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-abyss text-white grain">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 -z-10 w-full h-full object-cover opacity-55 scale-105 animate-fade" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-abyss via-abyss/60 to-abyss/20" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-abyss/80 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-24">
          <p className="animate-rise text-xs uppercase tracking-[0.25em] text-lagoon mb-6">The aquarium hobbyist marketplace</p>
          <h1 className="animate-rise [animation-delay:80ms] font-display text-[3.4rem] leading-[0.92] sm:text-8xl lg:text-[8.5rem] max-w-5xl">
            Living reefs, <br className="hidden sm:block" />
            <em className="italic text-white/80">traded with care.</em>
          </h1>
          <p className="animate-rise [animation-delay:160ms] mt-7 max-w-lg text-base sm:text-lg text-white/70 leading-relaxed">
            Buy and sell corals, fish, inverts and aquarium gear with hobbyists near you — protected payments, local pickup or shipped to your door.
          </p>

          <form
            action="/browse"
            className="animate-rise [animation-delay:240ms] mt-10 max-w-xl flex items-center gap-2 p-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-xl focus-within:bg-white/15 transition-colors"
          >
            <Search size={18} className="ml-3 text-white/60 shrink-0" aria-hidden />
            <input
              name="q"
              placeholder="Try “zoanthids”, “clownfish”, “return pump”…"
              aria-label="Search listings"
              className="flex-1 min-w-0 h-11 bg-transparent! text-white! placeholder:text-white/45 border-0 outline-none text-[15px]"
            />
            <input type="hidden" name="market" value="saltwater" />
            <button type="submit" className="h-11 px-5 sm:px-6 rounded-full bg-white text-ink text-sm font-medium hover:bg-lagoon transition-colors">
              Search
            </button>
          </form>

          <div className="animate-rise [animation-delay:320ms] mt-14 flex flex-wrap gap-x-10 gap-y-4 text-sm text-white/60">
            <span>
              <strong className="font-display text-3xl font-normal text-white mr-2">{totalLive}</strong>live listings
            </span>
            <span>
              <strong className="font-display text-3xl font-normal text-white mr-2">2</strong>markets — salt &amp; fresh
            </span>
          </div>
        </div>
      </section>

      {/* Markets */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28">
        <SectionHeading eyebrow="Choose your water" title="Two markets," accent="one community." />
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {MARKETS.map((m) => (
            <Link
              key={m.market}
              href={`/browse?market=${m.market}`}
              className="group relative isolate overflow-hidden rounded-[2rem] h-[26rem] sm:h-[32rem] flex flex-col justify-end p-7 sm:p-10 text-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.image}
                alt=""
                className="absolute inset-0 -z-10 w-full h-full object-cover transition-transform duration-[1.6s] ease-[var(--ease-out-expo)] group-hover:scale-[1.07]"
              />
              <div className={`absolute inset-0 -z-10 bg-gradient-to-t ${m.overlay} to-transparent`} />
              <span className="absolute top-6 right-6 sm:top-8 sm:right-8 w-12 h-12 rounded-full bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center transition-all duration-500 ease-[var(--ease-out-expo)] group-hover:bg-white group-hover:text-ink group-hover:rotate-45">
                <ArrowUpRight size={20} />
              </span>
              <p className="text-xs uppercase tracking-[0.2em] text-white/70 mb-3">{totals[m.market]} listings</p>
              <h3 className="font-display text-5xl sm:text-6xl leading-none">
                {m.label} <em className="italic text-white/75">{m.accent}</em>
              </h3>
              <p className="mt-3 text-sm text-white/75">{m.subtitle}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* New arrivals */}
      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28">
          <div className="flex items-end justify-between gap-4">
            <SectionHeading eyebrow="Fresh in the tank" title="New" accent="arrivals." />
            <Link href="/browse" className="group mb-10 sm:mb-12 shrink-0 inline-flex items-center gap-2 text-sm font-medium text-ink">
              View all
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10">
            {newArrivals.map((listing) => (
              <ListingCard key={listing.id} listing={listing} saved={viewer ? savedSet.has(listing.id) : undefined} />
            ))}
          </div>
        </section>
      )}

      {/* Promises */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28">
        <div className="grid sm:grid-cols-3 border-y border-gray-900/10 divide-y sm:divide-y-0 sm:divide-x divide-gray-900/10">
          {PROMISES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="py-8 sm:px-8 first:sm:pl-0 last:sm:pr-0">
              <Icon size={22} strokeWidth={1.5} className="text-blue-600" />
              <p className="mt-4 font-medium text-ink">{title}</p>
              <p className="mt-1 text-sm text-gray-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sell */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-ink text-white grain px-6 sm:px-12 py-14 sm:py-20">
          <div className="absolute -top-40 -right-40 -z-10 w-[36rem] h-[36rem] rounded-full bg-blue-600/40 blur-3xl" />
          <div className="absolute -bottom-48 -left-24 -z-10 w-[28rem] h-[28rem] rounded-full bg-lagoon/20 blur-3xl" />

          <div className="grid lg:grid-cols-[1fr_1.15fr] gap-12 lg:gap-16 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-lagoon mb-5">For sellers</p>
              <h2 className="font-display text-5xl sm:text-7xl leading-[0.95]">
                Turn your frag tank <em className="italic text-white/70">into income.</em>
              </h2>
              <ol className="mt-10 space-y-6">
                {STEPS.map((step, i) => (
                  <li key={step.title} className="flex gap-5">
                    <span className="font-display text-2xl text-lagoon w-8 shrink-0">0{i + 1}</span>
                    <div>
                      <p className="font-medium">{step.title}</p>
                      <p className="mt-1 text-sm text-white/60 leading-relaxed max-w-sm">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link href="/sell" className="h-12 px-6 inline-flex items-center gap-2 rounded-full bg-white text-ink text-sm font-medium hover:bg-lagoon transition-colors">
                  Create a listing <ArrowRight size={16} />
                </Link>
                <Link href="/sell/fee-calculator" className="h-12 px-6 inline-flex items-center rounded-full border border-white/20 text-sm font-medium hover:bg-white/10 transition-colors">
                  Fee calculator
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SELL_CATEGORIES.map((cat, i) => (
                <Link
                  key={cat.label}
                  href="/sell"
                  className={`group relative isolate overflow-hidden rounded-2xl aspect-[3/4] p-4 flex flex-col justify-end ${i % 3 === 1 ? "sm:translate-y-6" : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cat.image}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 -z-10 w-full h-full object-cover transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-110"
                  />
                  <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  <span className="text-sm font-medium">{cat.label}</span>
                  <span className="text-[11px] text-white/60">{cat.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Learn */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28">
        <div className="flex items-end justify-between gap-4">
          <SectionHeading eyebrow="Learn & explore" title="Keep it" accent="thriving." />
          <Link href="/learn" className="group mb-10 sm:mb-12 shrink-0 inline-flex items-center gap-2 text-sm font-medium text-ink">
            All guides
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 border-t border-gray-900/10">
          {HELP_CATEGORIES.slice(0, 6).map((cat, i) => (
            <Link
              key={cat.value}
              href="/learn"
              className="group flex items-center gap-5 py-6 border-b border-gray-900/10 sm:px-4 hover:bg-white transition-colors"
            >
              <span className="font-display text-lg text-gray-400 w-6">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-2xl" aria-hidden>
                {cat.icon}
              </span>
              <span className="flex-1 font-medium text-ink">{cat.label}</span>
              <ArrowUpRight size={18} className="text-gray-400 transition-all duration-300 group-hover:text-ink group-hover:rotate-45" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function SectionHeading({ eyebrow, title, accent }: { eyebrow: string; title: string; accent: string }) {
  return (
    <div className="mb-10 sm:mb-12">
      <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-3">{eyebrow}</p>
      <h2 className="font-display text-5xl sm:text-6xl leading-[0.95] text-ink">
        {title} <em className="italic text-blue-600">{accent}</em>
      </h2>
    </div>
  );
}
