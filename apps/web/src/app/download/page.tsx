import Link from "next/link";

const FEATURES = [
  { icon: "🐠", title: "Two Markets in One", desc: "Shop and sell in dedicated Saltwater and Freshwater marketplaces, each tailored to hobbyists like you." },
  { icon: "🪸", title: "Corals, Fish & Equipment", desc: "From rare frags and reef fish to cichlids, axolotls, plants, and gear — everything aquarium in one place." },
  { icon: "📦", title: "Easy Listing", desc: "List your livestock or equipment in minutes with photos, pricing, DOA policy, and shipping options." },
  { icon: "📚", title: "Care Guides & Tips", desc: "Built-in learning hub with coral care, fish profiles, compatibility guides, and expert tips for all skill levels." },
  { icon: "💬", title: "Direct Messaging", desc: "Chat with buyers and sellers directly in the app to ask questions, negotiate, or arrange local pickup." },
  { icon: "🔒", title: "Secure Payments", desc: "Powered by Stripe with buyer protection, transparent fees, and seamless seller payouts." },
];

export default function DownloadAppPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(160deg, #0369a1 0%, #0ea5e9 40%, #06b6d4 100%)" }}>
        <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-4xl">🐠</span>
            <span className="text-4xl font-bold text-white tracking-tight">Reef Market</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4">
            Buy &amp; Sell Coral,
            <br />
            Fish &amp; Supplies
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl mx-auto">
            The #1 marketplace built exclusively for aquarium hobbyists. Saltwater and freshwater — all in one free app.
          </p>

          <Link
            href="/browse"
            className="inline-flex items-center gap-3 bg-black text-white font-semibold text-lg px-8 py-4 rounded-2xl shadow-xl hover:bg-gray-900 transition-colors"
          >
            Open Reef Market
          </Link>
          <p className="text-white/60 text-sm mt-3">Free · Web app available now · Mobile apps coming soon</p>
        </div>
      </div>

      <div className="bg-gray-50 py-8 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap justify-center gap-3">
          {["🪸 Corals & Frags", "🐟 Reef Fish", "🐠 Freshwater Fish", "🦎 Amphibians", "🔧 Equipment", "🌿 Plants"].map((f) => (
            <span key={f} className="bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm">
              {f}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Your Aquarium Hobby, Simplified</h2>
        <p className="text-gray-600 text-lg leading-relaxed">
          Reef Market connects aquarium enthusiasts across the country — whether you&apos;re looking to add a stunning coral to your reef,
          rehome a colony of frags, find cichlids for your freshwater tank, or upgrade your equipment. Our community-first platform makes
          it easy and safe to buy, sell, and learn.
        </p>
      </div>

      <div className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10">Everything You Need</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-16 text-center" style={{ background: "linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)" }}>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Ready to Dive In?</h2>
        <p className="text-white/80 mb-8 text-lg">Join hobbyists already buying and selling on Reef Market.</p>
        <Link
          href="/browse"
          className="inline-flex items-center gap-3 bg-black text-white font-semibold text-lg px-8 py-4 rounded-2xl shadow-xl hover:bg-gray-900 transition-colors"
        >
          Get Started
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
