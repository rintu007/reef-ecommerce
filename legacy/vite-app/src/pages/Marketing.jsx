import { Fish, ShoppingBag, Star, Shield, Truck, Users, ChevronRight, Check, Smartphone } from "lucide-react";

const features = [
  {
    icon: Fish,
    title: "Saltwater & Freshwater",
    desc: "Browse corals, fish, amphibians, turtles, and equipment — all in one dedicated marketplace built for hobbyists.",
  },
  {
    icon: Shield,
    title: "Buyer Protection",
    desc: "Secure payments via Stripe. DOA policies protect you if livestock arrives in poor condition.",
  },
  {
    icon: Truck,
    title: "Shipping or Local Pickup",
    desc: "Choose to ship nationwide or arrange local pickup directly with the seller — your choice.",
  },
  {
    icon: Star,
    title: "Verified Seller Ratings",
    desc: "Every seller has a public rating based on real buyer reviews, so you know who you're buying from.",
  },
  {
    icon: Users,
    title: "Built for the Community",
    desc: "Made by hobbyists, for hobbyists. A dedicated platform that understands the unique needs of reef and freshwater keepers.",
  },
  {
    icon: ShoppingBag,
    title: "Easy Selling",
    desc: "List your corals, fish, or gear in minutes. Get paid directly to your bank via Stripe when your item sells.",
  },
];

const steps = [
  { num: "1", title: "Create an Account", desc: "Sign up free in seconds." },
  { num: "2", title: "Browse or List", desc: "Search thousands of listings or sell your own." },
  { num: "3", title: "Buy or Sell Securely", desc: "Payments processed safely via Stripe." },
  { num: "4", title: "Enjoy Your Hobby", desc: "Grow your tank with confidence." },
];

export default function Marketing() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-inter">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fish className="w-6 h-6 text-cyan-600" />
            <span className="font-bold text-lg text-gray-900">Reef Market</span>
          </div>
          <a
            href="https://reef-trade-flow.base44.app"
            className="bg-cyan-600 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-cyan-700 transition-colors"
          >
            Open App
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-700 via-cyan-600 to-blue-800 text-white">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1546074177-31bfa593f731?w=1400&q=80')] bg-cover bg-center" />
        <div className="relative max-w-5xl mx-auto px-4 py-24 text-center">
          <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
            The Aquarium Hobbyist Marketplace
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
            Buy &amp; Sell Corals, Fish<br className="hidden sm:block" /> &amp; Equipment
          </h1>
          <p className="text-cyan-100 text-lg max-w-xl mx-auto mb-8">
            Reef Market connects saltwater and freshwater hobbyists across the country. Find rare frags, quality livestock, and trusted gear — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://reef-trade-flow.base44.app"
              className="bg-white text-cyan-700 font-bold px-8 py-3 rounded-full text-base hover:bg-cyan-50 transition-colors flex items-center justify-center gap-2"
            >
              Get Started Free <ChevronRight className="w-4 h-4" />
            </a>
            <a
              href="/support"
              className="border border-white/40 text-white font-semibold px-8 py-3 rounded-full text-base hover:bg-white/10 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-5 flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm text-gray-500">
          <span className="flex items-center gap-1.5"><Fish className="w-4 h-4 text-cyan-500" /> Saltwater &amp; Freshwater</span>
          <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-cyan-500" /> Secure Stripe Payments</span>
          <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-cyan-500" /> Verified Seller Reviews</span>
          <span className="flex items-center gap-1.5"><Smartphone className="w-4 h-4 text-cyan-500" /> iOS &amp; Android App</span>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold mb-3">Everything you need to buy &amp; sell</h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            Reef Market was purpose-built for the aquarium hobby — not a generic classifieds site.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-cyan-600" />
              </div>
              <h3 className="font-bold text-base mb-1">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gradient-to-br from-cyan-50 to-blue-50 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-3">How it works</h2>
            <p className="text-gray-500">Up and running in minutes.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="bg-white rounded-2xl p-6 border border-cyan-100 text-center shadow-sm">
                <div className="w-10 h-10 rounded-full bg-cyan-600 text-white font-extrabold text-lg flex items-center justify-center mx-auto mb-4">
                  {num}
                </div>
                <h3 className="font-bold mb-1">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Selling section */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="bg-gray-900 text-white rounded-3xl p-10 flex flex-col sm:flex-row items-center gap-8">
          <div className="flex-1">
            <h2 className="text-2xl font-extrabold mb-3">Ready to sell your livestock or gear?</h2>
            <p className="text-gray-300 mb-5 leading-relaxed">
              List in minutes. Our platform fee is just 5% — far lower than most marketplaces — so you keep more of every sale.
            </p>
            <ul className="space-y-2 mb-6">
              {["5% platform fee", "Payouts via Stripe", "Featured listings available", "DOA policy controls"].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-200">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" /> {item}
                </li>
              ))}
            </ul>
            <a
              href="https://reef-trade-flow.base44.app/sell"
              className="inline-flex items-center gap-2 bg-cyan-500 text-white font-bold px-6 py-3 rounded-full hover:bg-cyan-400 transition-colors"
            >
              Start Selling <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shrink-0">
            <img
              src="https://images.unsplash.com/photo-1571752726703-5e7d1f6a986d?w=400&q=80"
              alt="Coral frag"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-cyan-700 text-white py-20 text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold mb-3">Join the Reef Market community</h2>
          <p className="text-cyan-100 mb-8">
            Free to join. Browse thousands of listings today or list your first item in minutes.
          </p>
          <a
            href="https://reef-trade-flow.base44.app"
            className="inline-flex items-center gap-2 bg-white text-cyan-700 font-bold px-8 py-3 rounded-full text-base hover:bg-cyan-50 transition-colors"
          >
            Open Reef Market <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Fish className="w-5 h-5 text-cyan-500" />
          <span className="font-bold text-white">Reef Market</span>
        </div>
        <div className="flex justify-center gap-6 mb-4">
          <a href="/support" className="hover:text-white transition-colors">Support</a>
          <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="mailto:Andrew@freedomrisingnow.org" className="hover:text-white transition-colors">Contact</a>
        </div>
        <p>© {new Date().getFullYear()} Reef Market. All rights reserved.</p>
      </footer>
    </div>
  );
}