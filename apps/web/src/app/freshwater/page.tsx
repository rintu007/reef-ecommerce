import Link from "next/link";

const FEATURES = [
  { icon: "🐟", title: "Freshwater Fish", desc: "Cichlids, tetras, bettas, discus, plecos, and hundreds more species from hobbyists near you." },
  { icon: "🌿", title: "Aquatic Plants", desc: "Stem plants, mosses, carpeting species, rare tissue cultures — find the perfect aquascape plants." },
  { icon: "🦎", title: "Amphibians & More", desc: "Axolotls, turtles, newts, and other freshwater critters from trusted community sellers." },
  { icon: "🔧", title: "FW Equipment", desc: "Filters, heaters, CO2 systems, lighting, tanks — buy and sell gear at fair prices." },
  { icon: "💬", title: "Direct Messaging", desc: "Chat with sellers, ask care questions, and arrange local pickup — all inside the app." },
  { icon: "🔒", title: "Secure Checkout", desc: "Stripe-powered payments with buyer protection and transparent fees. Shop with confidence." },
];

const CATEGORIES = ["🐟 Cichlids", "🐠 Tetras & Rasboras", "🐡 Bettas", "💧 Discus", "🌿 Live Plants", "🦎 Axolotls", "🐢 Turtles", "🔧 FW Equipment"];

export default function FreshwaterLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(160deg, #14532d 0%, #15803d 45%, #16a34a 100%)" }}>
        <div className="relative max-w-5xl mx-auto px-6 pt-14 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-white/20">
            🌿 Built for Freshwater Hobbyists
          </div>
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="text-4xl">🐟</span>
            <span className="text-4xl font-bold text-white tracking-tight">Reef Market</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-5">
            The Freshwater
            <br />
            Marketplace You&apos;ve
            <br />
            Been Waiting For
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-xl mx-auto leading-relaxed">
            Buy and sell fish, plants, amphibians, and equipment with fellow freshwater enthusiasts.
          </p>

          <Link
            href="/browse?market=freshwater"
            className="inline-flex items-center gap-3 bg-black text-white font-semibold text-lg px-8 py-4 rounded-2xl shadow-2xl hover:bg-gray-900 transition-colors"
          >
            Browse Freshwater Listings
          </Link>
          <p className="text-white/50 text-sm mt-3">Free to join</p>
        </div>
      </div>

      <div className="bg-gray-50 py-8 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap justify-center gap-3">
          {CATEGORIES.map((c) => (
            <span key={c} className="bg-white border border-green-100 rounded-full px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5">A Market Built for Your Hobby</h2>
        <p className="text-gray-600 text-lg leading-relaxed">
          Whether you keep a planted nano tank, breed discus, or keep a colony of axolotls — Reef Market&apos;s dedicated Freshwater
          section connects you with hobbyists buying and selling the species and gear you actually care about.
        </p>
      </div>

      <div className="py-16" style={{ background: "linear-gradient(180deg, #f0fdf4 0%, #f9fafb 100%)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10">Everything a Freshwater Hobbyist Needs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-green-50 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-16 text-center" style={{ background: "linear-gradient(135deg, #14532d 0%, #16a34a 100%)" }}>
        <div className="text-4xl mb-4">🐟</div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Start Exploring the Freshwater Market</h2>
        <p className="text-white/80 mb-8 text-lg max-w-md mx-auto">Join a growing community of freshwater enthusiasts. Free to browse.</p>
        <Link
          href="/browse?market=freshwater"
          className="inline-flex items-center gap-3 bg-black text-white font-semibold text-lg px-8 py-4 rounded-2xl shadow-xl hover:bg-gray-900 transition-colors"
        >
          Browse Now
        </Link>
      </div>

      <div className="bg-gray-900 text-gray-500 text-center text-sm py-6 px-4">
        © {new Date().getFullYear()} Reef Market ·{" "}
        <Link href="/privacy" className="hover:text-gray-300 underline">Privacy Policy</Link> ·{" "}
        <Link href="/terms" className="hover:text-gray-300 underline">Terms of Service</Link>
      </div>
    </div>
  );
}
