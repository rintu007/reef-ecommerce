import Link from "next/link";

const FEATURES = [
  { title: "Saltwater & Freshwater", desc: "Browse corals, fish, amphibians, turtles, and equipment — all in one dedicated marketplace built for hobbyists." },
  { title: "Buyer Protection", desc: "Secure payments via Stripe. DOA policies protect you if livestock arrives in poor condition." },
  { title: "Shipping or Local Pickup", desc: "Choose to ship nationwide or arrange local pickup directly with the seller — your choice." },
  { title: "Verified Seller Ratings", desc: "Every seller has a public rating based on real buyer reviews, so you know who you're buying from." },
  { title: "Built for the Community", desc: "Made by hobbyists, for hobbyists. A dedicated platform that understands the unique needs of reef and freshwater keepers." },
  { title: "Easy Selling", desc: "List your corals, fish, or gear in minutes. Get paid directly to your bank via Stripe when your item sells." },
];

const STEPS = [
  { num: "1", title: "Create an Account", desc: "Sign up free in seconds." },
  { num: "2", title: "Browse or List", desc: "Search thousands of listings or sell your own." },
  { num: "3", title: "Buy or Sell Securely", desc: "Payments processed safely via Stripe." },
  { num: "4", title: "Enjoy Your Hobby", desc: "Grow your tank with confidence." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-700 via-cyan-600 to-blue-800 text-white">
        <div className="relative max-w-5xl mx-auto px-4 py-24 text-center">
          <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
            The Aquarium Hobbyist Marketplace
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">Buy &amp; Sell Corals, Fish &amp; Equipment</h1>
          <p className="text-cyan-100 text-lg max-w-xl mx-auto mb-8">
            Reef Market connects saltwater and freshwater hobbyists across the country. Find rare frags, quality livestock, and trusted
            gear — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/browse"
              className="bg-white text-cyan-700 font-bold px-8 py-3 rounded-full text-base hover:bg-cyan-50 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/support"
              className="border border-white/40 text-white font-semibold px-8 py-3 rounded-full text-base hover:bg-white/10 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold mb-3">Everything you need to buy &amp; sell</h2>
          <p className="text-gray-500 max-w-lg mx-auto">Reef Market was purpose-built for the aquarium hobby — not a generic classifieds site.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="font-bold text-base mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-br from-cyan-50 to-blue-50 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-3">How it works</h2>
            <p className="text-gray-500">Up and running in minutes.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s) => (
              <div key={s.num} className="bg-white rounded-2xl p-6 border border-cyan-100 text-center shadow-sm">
                <div className="w-10 h-10 rounded-full bg-cyan-600 text-white font-extrabold text-lg flex items-center justify-center mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="font-bold mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cyan-700 text-white py-20 text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold mb-3">Join the Reef Market community</h2>
          <p className="text-cyan-100 mb-8">Free to join. Browse thousands of listings today or list your first item in minutes.</p>
          <Link href="/browse" className="inline-flex items-center gap-2 bg-white text-cyan-700 font-bold px-8 py-3 rounded-full text-base hover:bg-cyan-50 transition-colors">
            Open Reef Market
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <div className="flex justify-center gap-6 mb-4">
          <Link href="/support" className="hover:text-white transition-colors">Support</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
        </div>
        <p>© {new Date().getFullYear()} Reef Market. All rights reserved.</p>
      </footer>
    </div>
  );
}
