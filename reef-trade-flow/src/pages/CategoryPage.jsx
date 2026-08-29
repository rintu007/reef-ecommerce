import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  CORAL_CATEGORIES, FISH_CATEGORIES, EQUIPMENT_CATEGORIES,
  FW_FISH_CATEGORIES, FW_AMPHIBIAN_CATEGORIES, FW_TURTLE_CATEGORIES,
  FW_OTHER_CATEGORIES, FW_EQUIPMENT_CATEGORIES
} from "@/lib/categories";
import { cn } from "@/lib/utils";

const TYPE_META = {
  // Saltwater
  coral: {
    label: "Corals",
    emoji: "🪸",
    image: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=800&q=80",
    gradient: "from-cyan-600/70 to-blue-800/70",
    categories: CORAL_CATEGORIES,
    market: "saltwater",
  },
  fish: {
    label: "Saltwater Fish",
    emoji: "🐠",
    image: "https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=800&q=80",
    gradient: "from-blue-500/70 to-indigo-700/70",
    categories: FISH_CATEGORIES,
    market: "saltwater",
  },
  equipment: {
    label: "SW Equipment",
    emoji: "🔧",
    image: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/542a5e47e_Screenshot2026-04-04at122510PM.png",
    gradient: "from-slate-600/70 to-slate-800/70",
    categories: EQUIPMENT_CATEGORIES,
    market: "saltwater",
  },
  // Freshwater
  fw_fish: {
    label: "Freshwater Fish",
    emoji: "🐟",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
    gradient: "from-blue-500/70 to-teal-700/70",
    categories: FW_FISH_CATEGORIES,
    market: "freshwater",
  },
  fw_amphibian: {
    label: "Amphibians",
    emoji: "🦎",
    image: "https://images.unsplash.com/photo-1551189014-fe516f2e1b69?w=800&q=80",
    gradient: "from-emerald-600/70 to-green-900/70",
    categories: FW_AMPHIBIAN_CATEGORIES,
    market: "freshwater",
  },
  fw_turtle: {
    label: "Turtles",
    emoji: "🐢",
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
    gradient: "from-green-600/70 to-emerald-900/70",
    categories: FW_TURTLE_CATEGORIES,
    market: "freshwater",
  },
  fw_other: {
    label: "Other Freshwater",
    emoji: "🌿",
    image: "https://images.unsplash.com/photo-1520302630591-fd1f82d2e4d3?w=800&q=80",
    gradient: "from-teal-600/70 to-cyan-900/70",
    categories: FW_OTHER_CATEGORIES,
    market: "freshwater",
  },
  fw_equipment: {
    label: "FW Equipment",
    emoji: "⚙️",
    image: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&q=80",
    gradient: "from-slate-600/70 to-slate-800/70",
    categories: FW_EQUIPMENT_CATEGORIES,
    market: "freshwater",
  },
};

export default function CategoryPage() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const meta = TYPE_META[type];

  if (!meta) {
    navigate("/");
    return null;
  }

  const allCategories = ["All", ...meta.categories];
  const filtered = allCategories.filter(cat =>
    cat === "All" || cat.toLowerCase().includes(query.toLowerCase())
  );

  const handleCatSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/browse?type=${type}&market=${meta.market}&q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header */}
      <div className="relative h-36 overflow-hidden">
        <img src={meta.image} alt={meta.label} className="w-full h-full object-cover" />
        <div className={cn("absolute inset-0 bg-gradient-to-b", meta.gradient)} />
        <div className="absolute inset-0 flex flex-col justify-end p-4 pb-3">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="w-11 h-11 flex items-center justify-center text-white/80 hover:text-white -ml-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-2xl">{meta.emoji}</span>
            <h1 className="text-xl font-bold text-white">{meta.label}</h1>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 pt-3 pb-2 border-b border-border bg-card">
        <form onSubmit={handleCatSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={`Search in ${meta.label}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl text-sm pr-20"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="absolute right-16 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-lg"
          >
            Search
          </button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          Or browse a subcategory below
        </p>
      </div>

      {/* Subcategory list */}
      <div className="p-4 space-y-2">
        {filtered.map((cat) => {
          const isAll = cat === "All";
          const href = isAll
            ? `/browse?type=${type}&market=${meta.market}`
            : `/browse?type=${type}&category=${encodeURIComponent(cat)}&market=${meta.market}`;
          return (
            <Link
              key={cat}
              to={href}
              className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-card border border-border shadow-sm hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors group"
            >
              <span className={cn("font-medium text-sm", isAll && "text-primary group-hover:text-primary-foreground")}>
                {isAll ? `All ${meta.label}` : cat}
              </span>
              <ArrowLeft className="w-4 h-4 rotate-180 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}