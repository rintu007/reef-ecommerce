const APP_STORE_URL = "https://apps.apple.com/us/app/reef-market/id6761544326";

const AppleIcon = () => (
  <svg viewBox="0 0 814 1000" className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg">
    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 442.4 40.8 252 40.8 207.1c0-165 108.6-252 215.2-252 85 0 143.1 55.8 200.4 55.8 53.5 0 121.4-57.8 212.4-57.8 34.6 0 137.7 4.5 209.6 116.9zm-246.1-189c-38.1-45.2-105.6-82-176.2-82C373.5 69.9 315 156.3 315 224.6c0 89.4 58.9 184.4 149.3 217.2 20.5 7.4 43.5 11.3 67.3 11.3 81.4 0 160.1-60 192-143.5 10.7-27.2 17.7-58.2 17.7-91.7 0-17.1-2.6-33.9-7.3-50.3z"/>
  </svg>
);

const features = [
  {
    icon: "🐟",
    title: "Freshwater Fish",
    desc: "Cichlids, tetras, bettas, discus, plecos, and hundreds more species from hobbyists near you."
  },
  {
    icon: "🌿",
    title: "Aquatic Plants",
    desc: "Stem plants, mosses, carpeting species, rare tissue cultures — find the perfect aquascape plants."
  },
  {
    icon: "🦎",
    title: "Amphibians & More",
    desc: "Axolotls, turtles, newts, and other freshwater critters from trusted community sellers."
  },
  {
    icon: "🔧",
    title: "FW Equipment",
    desc: "Filters, heaters, CO2 systems, lighting, tanks — buy and sell gear at fair prices."
  },
  {
    icon: "💬",
    title: "Direct Messaging",
    desc: "Chat with sellers, ask care questions, and arrange local pickup — all inside the app."
  },
  {
    icon: "🔒",
    title: "Secure Checkout",
    desc: "Stripe-powered payments with buyer protection and transparent fees. Shop with confidence."
  },
];

const categories = [
  "🐟 Cichlids", "🐠 Tetras & Rasboras", "🐡 Bettas", "💧 Discus",
  "🌿 Live Plants", "🦎 Axolotls", "🐢 Turtles", "🔧 FW Equipment"
];

const screenshots = [
  {
    url: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/641e17b47_AdobeExpress-file-5.png",
    caption: "Freshwater Market"
  },
  {
    url: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/7b3f93c62_AdobeExpress-file-6.png",
    caption: "Browse by Category"
  },
  {
    url: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/48ea71959_AdobeExpress-file-3.png",
    caption: "Start Selling Today"
  },
  {
    url: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/44a38f61f_AdobeExpress-file-4.png",
    caption: "Care Guides & Tips"
  },
];

export default function FreshwaterLanding() {
  return (
    <div className="min-h-screen bg-white font-inter">

      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #14532d 0%, #15803d 45%, #16a34a 100%)" }}
      >
        {/* Subtle bubble/dot pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1.5px, transparent 1.5px)",
            backgroundSize: "36px 36px"
          }}
        />
        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 40 C360 80 1080 0 1440 40 L1440 80 L0 80 Z" fill="white"/>
          </svg>
        </div>

        <div className="relative max-w-5xl mx-auto px-6 pt-14 pb-24 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-white/20 backdrop-blur-sm">
            🌿 Built for Freshwater Hobbyists
          </div>

          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="text-4xl">🐟</span>
            <span className="text-4xl font-bold text-white tracking-tight">Reef Market</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-5">
            The Freshwater<br />Marketplace You've<br />Been Waiting For
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-xl mx-auto leading-relaxed">
            Buy and sell fish, plants, amphibians, and equipment with fellow freshwater enthusiasts — all in one free app.
          </p>

          {/* CTA */}
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-black text-white font-semibold text-lg px-8 py-4 rounded-2xl shadow-2xl hover:bg-gray-900 transition-colors"
          >
            <AppleIcon />
            Download on the App Store
          </a>
          <p className="text-white/50 text-sm mt-3">Free · iOS</p>

          {/* Hero image */}
          <div className="mt-10 flex justify-center">
            <img
              src="https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/641e17b47_AdobeExpress-file-5.png"
              alt="Freshwater Market App Preview"
              className="w-full max-w-xs md:max-w-sm rounded-3xl shadow-2xl border-4 border-white/20"
            />
          </div>
        </div>
      </div>

      {/* Category pills */}
      <div className="bg-gray-50 py-8 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap justify-center gap-3">
          {categories.map(c => (
            <span key={c} className="bg-white border border-green-100 rounded-full px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm">
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* About section */}
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5">A Market Built for Your Hobby</h2>
        <p className="text-gray-600 text-lg leading-relaxed">
          Whether you keep a planted nano tank, breed discus, or keep a colony of axolotls — Reef Market's dedicated Freshwater section connects you with thousands of hobbyists buying and selling the species and gear you actually care about. No more sifting through saltwater listings.
        </p>
      </div>

      {/* Features grid */}
      <div className="py-16" style={{ background: "linear-gradient(180deg, #f0fdf4 0%, #f9fafb 100%)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10">Everything a Freshwater Hobbyist Needs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-green-50 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Social proof */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-10">See It In Action</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {screenshots.map((s) => (
            <div key={s.url} className="flex flex-col items-center gap-2">
              <img
                src={s.url}
                alt={s.caption}
                className="w-full rounded-2xl shadow-md border border-gray-100 object-cover"
              />
              <p className="text-xs text-center text-gray-500">{s.caption}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonial-style highlight */}
      <div className="bg-green-50 border-y border-green-100 py-12">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="text-4xl mb-4">🌿</div>
          <p className="text-lg md:text-xl text-gray-700 font-medium leading-relaxed italic">
            "Finally an app where I can find quality freshwater fish and plants from people who actually care about the hobby."
          </p>
          <p className="text-sm text-gray-400 mt-4">— Freshwater hobbyist, Reef Market community</p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div
        className="py-16 text-center"
        style={{ background: "linear-gradient(135deg, #14532d 0%, #16a34a 100%)" }}
      >
        <div className="text-4xl mb-4">🐟</div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Start Exploring the Freshwater Market</h2>
        <p className="text-white/80 mb-8 text-lg max-w-md mx-auto">
          Join a growing community of freshwater enthusiasts. Free to download, free to browse.
        </p>
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-black text-white font-semibold text-lg px-8 py-4 rounded-2xl shadow-xl hover:bg-gray-900 transition-colors"
        >
          <AppleIcon />
          Download for Free
        </a>
        <p className="text-white/50 text-sm mt-3">Available on iOS · Free to download</p>
        <p className="text-white/60 text-sm mt-5">
          On a PC or Android?{" "}
          <a href="https://reefmarketonline.com" target="_blank" rel="noopener noreferrer" className="text-white underline hover:text-white/80">
            Visit reefmarketonline.com
          </a>
        </p>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-gray-500 text-center text-sm py-6 px-4">
        © {new Date().getFullYear()} Reef Market ·{" "}
        <a href="/privacy" className="hover:text-gray-300 underline">Privacy Policy</a> ·{" "}
        <a href="/terms" className="hover:text-gray-300 underline">Terms of Service</a>
      </div>
    </div>
  );
}