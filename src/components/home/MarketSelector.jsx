import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ListingCard from "@/components/listings/ListingCard";
import { Waves, ShoppingBag, BookOpen, ChevronRight, Star } from "lucide-react";
import SellerAgreementModal from "@/components/sell/SellerAgreementModal";

function FeaturedRow({ market, label }) {
  const { data: listings = [] } = useQuery({
    queryKey: ["home-featured", market],
    queryFn: () => base44.entities.Listing.filter({ status: "active", market }, "-created_date", 6),
  });

  if (listings.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-xs font-bold text-white/60 uppercase tracking-widest">{label} · New</p>
        <Link to={`/browse?market=${market}`} className="text-xs text-white/80 font-semibold flex items-center gap-0.5">
          See all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {listings.map((l) => (
          <div key={l.id} className="min-w-[140px] max-w-[140px]">
            <ListingCard listing={l} compact />
          </div>
        ))}
      </div>
    </div>
  );
}

const TABS = [
  {
    id: "browse",
    label: "Browse",
    icon: Waves,
    img: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=600&q=80",
    gradient: "from-cyan-500/90 to-blue-800/90",
  },
  {
    id: "sell",
    label: "Sell",
    icon: ShoppingBag,
    img: "https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=600&q=80",
    gradient: "from-orange-400/90 to-rose-700/90",
  },
  {
    id: "learn",
    label: "Learn",
    icon: BookOpen,
    img: "https://images.unsplash.com/photo-1520302630591-fd1f82d2e4d3?w=600&q=80",
    gradient: "from-emerald-500/90 to-teal-800/90",
  },
];

const SELLER_AGREEMENT_KEY = "reef_seller_agreed_v1";

export default function MarketSelector({ onSelect }) {
  const [activeTab, setActiveTab] = useState("browse");
  const [showAgreement, setShowAgreement] = useState(false);
  const navigate = useNavigate();

  const handleSellClick = () => {
    if (localStorage.getItem(SELLER_AGREEMENT_KEY)) {
      navigate("/sell");
    } else {
      setShowAgreement(true);
    }
  };

  const handleAgree = () => {
    localStorage.setItem(SELLER_AGREEMENT_KEY, "true");
    setShowAgreement(false);
    navigate("/sell");
  };
  const activeTabData = TABS.find((t) => t.id === activeTab);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-950">

      {/* Full-page background that morphs per tab */}
      <AnimatePresence mode="sync">
        <motion.div
          key={activeTab + "-bg"}
          className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <img
            src={activeTabData.img}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-b ${activeTabData.gradient}`} />
          {/* Dark bottom fade for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Hero Header */}
        <div className="px-5 pt-14 pb-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Waves className="w-6 h-6 text-white/90 drop-shadow" />
            <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-lg">Reef Market</h1>
          </div>
          <p className="text-white/60 text-sm font-medium">The aquarium hobbyist marketplace</p>
        </div>

        {/* Tab Bar */}
        <div className="flex mx-5 gap-2 mb-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 relative overflow-hidden rounded-2xl h-20 group transition-all duration-300 ${
                  isActive ? "ring-2 ring-white/70 shadow-xl" : "opacity-60 hover:opacity-80"
                }`}
              >
                <img src={tab.img} alt={tab.label} className="w-full h-full object-cover scale-110" />
                <div className={`absolute inset-0 bg-gradient-to-b ${tab.gradient}`} />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                  <Icon className="w-4 h-4 text-white drop-shadow" />
                  <span className="text-white font-bold text-xs tracking-wide drop-shadow">{tab.label}</span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >

              {/* ── BROWSE TAB ── */}
              {activeTab === "browse" && (
                <div className="px-5 space-y-6">
                  <div className="text-center">
                    <p className="text-xl font-extrabold text-white drop-shadow">What are you shopping for?</p>
                    <p className="text-white/50 text-xs mt-0.5">Tap a market to start browsing</p>
                  </div>

                  {/* Saltwater */}
                  <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/10 shadow-xl">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSelect("saltwater")}
                      className="w-full relative overflow-hidden rounded-2xl shadow-lg h-40 group"
                    >
                      <img
                        src="https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=900&q=85"
                        alt="Saltwater"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/60 to-blue-900/70" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-1.5">
                        <span className="text-5xl drop-shadow-lg">🪸</span>
                        <span className="text-2xl font-extrabold tracking-tight drop-shadow-lg">Saltwater</span>
                        <span className="text-white/80 text-xs font-medium bg-black/20 px-3 py-0.5 rounded-full">Corals · Reef Fish · Equipment</span>
                      </div>
                    </motion.button>
                    <FeaturedRow market="saltwater" label="Saltwater" />
                  </div>

                  {/* Freshwater */}
                  <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/10 shadow-xl">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSelect("freshwater")}
                      className="w-full relative overflow-hidden rounded-2xl shadow-lg h-40 group"
                    >
                      <img
                       src="https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/d9e02985b_360_F_442044627_gYizFV5eCOJLKCxAaXyG47Lq1ow5LsmN.jpg"
                       alt="Freshwater"
                       className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-green-700/50 to-emerald-950/70" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-1.5">
                        <span className="text-5xl drop-shadow-lg">🐟</span>
                        <span className="text-2xl font-extrabold tracking-tight drop-shadow-lg">Freshwater</span>
                        <span className="text-white/80 text-xs font-medium bg-black/20 px-3 py-0.5 rounded-full">Fish · Amphibians · Plants · Equipment</span>
                      </div>
                    </motion.button>
                    <FeaturedRow market="freshwater" label="Freshwater" />
                  </div>
                </div>
              )}

              {/* ── SELL TAB ── */}
              {activeTab === "sell" && (
                <div className="px-5 space-y-5">
                  <div className="text-center">
                    <p className="text-2xl font-extrabold text-white drop-shadow">Start Selling Today</p>
                    <p className="text-white/60 text-sm mt-1">List corals, fish, amphibians & gear</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { emoji: "🪸", label: "Corals", desc: "Frags & colonies", img: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=400&q=80" },
                      { emoji: "🐠", label: "Reef Fish", desc: "Clownfish, tangs...", img: "https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=400&q=80" },
                      { emoji: "🐟", label: "FW Fish", desc: "Cichlids, bettas...", img: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/67df2e37b_generated_image.png" },
                      { emoji: "🦎", label: "Amphibians", desc: "Axolotls, frogs...", img: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/e49fee415_generated_image.png" },
                      { emoji: "🔧", label: "Equipment", desc: "Tanks, lights, pumps", img: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/4c2b2708e_generated_image.png" },
                      { emoji: "🌿", label: "Plants & More", desc: "Plants, inverts, food", img: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/8c3afb853_generated_image.png" },
                    ].map((item) => (
                      <motion.button
                        key={item.label}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSellClick}
                        className="relative overflow-hidden rounded-2xl h-32 shadow-lg group text-left"
                      >
                        <img src={item.img} alt={item.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <div className="absolute inset-0 flex flex-col justify-end p-3 text-white">
                          <span className="text-xl leading-none">{item.emoji}</span>
                          <span className="text-sm font-bold leading-tight mt-0.5">{item.label}</span>
                          <span className="text-[10px] text-white/60">{item.desc}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSellClick}
                    className="w-full h-14 rounded-2xl bg-white text-slate-900 font-extrabold text-base shadow-xl flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Create a Listing
                  </motion.button>

                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <p className="font-bold text-white mb-2 flex items-center gap-1.5"><Star className="w-4 h-4 text-yellow-400" /> Why sell here?</p>
                    <ul className="space-y-1.5 text-white/70 text-sm">
                      <li className="flex items-center gap-2">✅ Built for aquarium hobbyists</li>
                      <li className="flex items-center gap-2">✅ Buyer protection on every order</li>
                      <li className="flex items-center gap-2">✅ Easy photo uploads & listing tools</li>
                      <li className="flex items-center gap-2">✅ Reach thousands of buyers nationwide</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* ── LEARN TAB ── */}
              {activeTab === "learn" && (
                <div className="px-5 space-y-3">
                  <div className="text-center mb-2">
                    <p className="text-2xl font-extrabold text-white drop-shadow">Learn & Explore</p>
                    <p className="text-white/60 text-sm mt-1">Guides, tips & care info for hobbyists</p>
                  </div>

                  {[
                    { emoji: "🪸", label: "Coral Care", desc: "Lighting, flow, placement & fragging tips", img: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=600&q=80", overlay: "from-cyan-600/80 to-blue-900/80" },
                    { emoji: "🐠", label: "Reef Fish", desc: "Species profiles, compatibility & tank sizing", img: "https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=600&q=80", overlay: "from-blue-500/80 to-indigo-900/80" },
                    { emoji: "🐟", label: "Freshwater Fish", desc: "Cichlids, bettas, goldfish & more", img: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80", overlay: "from-emerald-500/80 to-teal-900/80" },
                    { emoji: "🦎", label: "Amphibians & Turtles", desc: "Axolotls, frogs, aquatic turtles", img: "https://images.unsplash.com/photo-1520302630591-fd1f82d2e4d3?w=600&q=80", overlay: "from-green-600/80 to-emerald-900/80" },
                    { emoji: "⚠️", label: "Common Problems", desc: "Ich, velvet, water quality issues & fixes", img: "https://images.unsplash.com/photo-1551189014-fe516f2e1b69?w=600&q=80", overlay: "from-amber-500/80 to-orange-900/80" },
                    { emoji: "🔧", label: "Equipment Guides", desc: "Filters, lights, skimmers, dosing & more", img: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=600&q=80", overlay: "from-slate-600/80 to-slate-900/80" },
                  ].map((item) => (
                    <Link key={item.label} to="/learn">
                      <motion.div
                        whileTap={{ scale: 0.98 }}
                        className="relative overflow-hidden rounded-2xl h-24 shadow-lg group"
                      >
                        <img src={item.img} alt={item.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className={`absolute inset-0 bg-gradient-to-r ${item.overlay}`} />
                        <div className="absolute inset-0 flex items-center px-5 gap-4">
                          <span className="text-4xl drop-shadow-lg">{item.emoji}</span>
                          <div className="text-white flex-1">
                            <p className="font-bold text-base leading-tight drop-shadow">{item.label}</p>
                            <p className="text-white/65 text-xs mt-0.5">{item.desc}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-white/50" />
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      {showAgreement && (
        <SellerAgreementModal
          onAgree={handleAgree}
          onClose={() => setShowAgreement(false)}
        />
      )}
    </div>
  );
}