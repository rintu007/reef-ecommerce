export default function DownloadApp() {
  const screenshots = [
    {
      url: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/1616b464f_AdobeExpress-file-2.png",
      caption: "Browse the Saltwater Market"
    },
    {
      url: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/48ea71959_AdobeExpress-file-3.png",
      caption: "Start Selling Today"
    },
    {
      url: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/44a38f61f_AdobeExpress-file-4.png",
      caption: "Learn & Explore Care Guides"
    },
    {
      url: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/641e17b47_AdobeExpress-file-5.png",
      caption: "Freshwater Market"
    },
    {
      url: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/7b3f93c62_AdobeExpress-file-6.png",
      caption: "Browse by Category"
    },
    {
      url: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/60ba6474c_AdobeExpress-file-7.png",
      caption: "Saltwater Home Feed"
    },
  ];

  const features = [
    {
      icon: "🐠",
      title: "Two Markets in One",
      desc: "Shop and sell in dedicated Saltwater and Freshwater marketplaces, each tailored to hobbyists like you."
    },
    {
      icon: "🪸",
      title: "Corals, Fish & Equipment",
      desc: "From rare frags and reef fish to cichlids, axolotls, plants, and gear — everything aquarium in one place."
    },
    {
      icon: "📦",
      title: "Easy Listing",
      desc: "List your livestock or equipment in minutes with photos, pricing, DOA policy, and shipping options."
    },
    {
      icon: "📚",
      title: "Care Guides & Tips",
      desc: "Built-in learning hub with coral care, fish profiles, compatibility guides, and expert tips for all skill levels."
    },
    {
      icon: "💬",
      title: "Direct Messaging",
      desc: "Chat with buyers and sellers directly in the app to ask questions, negotiate, or arrange local pickup."
    },
    {
      icon: "🔒",
      title: "Secure Payments",
      desc: "Powered by Stripe with buyer protection, transparent fees, and seamless seller payouts."
    },
  ];

  return (
    <div className="min-h-screen bg-white font-inter">
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0369a1 0%, #0ea5e9 40%, #06b6d4 100%)"
        }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 80%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />
        <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-4xl">🐠</span>
            <span className="text-4xl font-bold text-white tracking-tight">Reef Market</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4">
            Buy & Sell Coral,<br />Fish & Supplies
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl mx-auto">
            The #1 marketplace built exclusively for aquarium hobbyists. Saltwater and freshwater — all in one free app.
          </p>

          {/* CTA */}
          <a
            href="https://apps.apple.com/us/app/reef-market/id6761544326"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-black text-white font-semibold text-lg px-8 py-4 rounded-2xl shadow-xl hover:bg-gray-900 transition-colors"
          >
            <svg viewBox="0 0 814 1000" className="w-7 h-7 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 442.4 40.8 252 40.8 207.1c0-165 108.6-252 215.2-252 85 0 143.1 55.8 200.4 55.8 53.5 0 121.4-57.8 212.4-57.8 34.6 0 137.7 4.5 209.6 116.9zm-246.1-189c-38.1-45.2-105.6-82-176.2-82C373.5 69.9 315 156.3 315 224.6c0 89.4 58.9 184.4 149.3 217.2 20.5 7.4 43.5 11.3 67.3 11.3 81.4 0 160.1-60 192-143.5 10.7-27.2 17.7-58.2 17.7-91.7 0-17.1-2.6-33.9-7.3-50.3z"/>
            </svg>
            Download on the App Store
          </a>
          <p className="text-white/60 text-sm mt-3">Free • iOS</p>

          {/* Hero image */}
          <div className="mt-10 flex justify-center">
            <img
              src="https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/6cd2ae5ef_reefadd.png"
              alt="Reef Market App Preview"
              className="w-full max-w-sm md:max-w-md rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>

      {/* Feature pills */}
      <div className="bg-gray-50 py-8 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap justify-center gap-3">
          {["🪸 Corals & Frags", "🐟 Reef Fish", "🐠 Freshwater Fish", "🦎 Amphibians", "🔧 Equipment", "🌿 Plants"].map(f => (
            <span key={f} className="bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm">{f}</span>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Your Aquarium Hobby, Simplified</h2>
        <p className="text-gray-600 text-lg leading-relaxed">
          Reef Market connects aquarium enthusiasts across the country — whether you're looking to add a stunning Gem Tang to your reef, rehome a colony of corals, find cichlids for your freshwater tank, or upgrade your equipment. Our community-first platform makes it easy and safe to buy, sell, and learn.
        </p>
      </div>

      {/* Features grid */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10">Everything You Need</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Screenshots */}
      <div className="py-16 max-w-6xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10">See It In Action</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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

      {/* Bottom CTA */}
      <div
        className="py-16 text-center"
        style={{ background: "linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)" }}
      >
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Ready to Dive In?</h2>
        <p className="text-white/80 mb-8 text-lg">Join thousands of hobbyists already buying and selling on Reef Market.</p>
        <a
          href="https://apps.apple.com/us/app/reef-market/id6761544326"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-black text-white font-semibold text-lg px-8 py-4 rounded-2xl shadow-xl hover:bg-gray-900 transition-colors"
        >
          <svg viewBox="0 0 814 1000" className="w-7 h-7 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 442.4 40.8 252 40.8 207.1c0-165 108.6-252 215.2-252 85 0 143.1 55.8 200.4 55.8 53.5 0 121.4-57.8 212.4-57.8 34.6 0 137.7 4.5 209.6 116.9zm-246.1-189c-38.1-45.2-105.6-82-176.2-82C373.5 69.9 315 156.3 315 224.6c0 89.4 58.9 184.4 149.3 217.2 20.5 7.4 43.5 11.3 67.3 11.3 81.4 0 160.1-60 192-143.5 10.7-27.2 17.7-58.2 17.7-91.7 0-17.1-2.6-33.9-7.3-50.3z"/>
          </svg>
          Download for Free
        </a>
        <p className="text-white/50 text-sm mt-3">Available on iOS · Free to download</p>
        <p className="text-white/60 text-sm mt-6">
          Using a PC or Android device?{" "}
          <a
            href="https://reefmarketonline.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white underline hover:text-white/80"
          >
            Visit us at reefmarketonline.com
          </a>
        </p>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-gray-500 text-center text-sm py-6 px-4">
        © {new Date().getFullYear()} Reef Market · <a href="/privacy" className="hover:text-gray-300 underline">Privacy Policy</a> · <a href="/terms" className="hover:text-gray-300 underline">Terms of Service</a>
      </div>
    </div>
  );
}