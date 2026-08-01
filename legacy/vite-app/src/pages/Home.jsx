import { useState, useCallback, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Input } from "@/components/ui/input";
import { Search, Waves, ArrowLeftRight, SlidersHorizontal } from "lucide-react";
import FeaturedCarousel from "@/components/listings/FeaturedCarousel";
import SaltwaterCategoryBrowser from "@/components/listings/SaltwaterCategoryBrowser";
import FreshwaterCategoryBrowser from "@/components/listings/FreshwaterCategoryBrowser";
import ListingCard from "@/components/listings/ListingCard";
import MarketSelector from "@/components/home/MarketSelector";
import { SALTWATER_TYPES, FRESHWATER_TYPES } from "@/lib/categories";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/ui/PullToRefreshIndicator";
import { useUserPrefs } from "@/lib/UserPrefsContext";
import { getT } from "@/lib/i18n";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isGuest } = useAuth();
  const { language } = useUserPrefs();
  const t = getT(language);
  const [searchQuery, setSearchQuery] = useState("");
  const [market, setMarket] = useState(() => sessionStorage.getItem("reef_market") || null);

  // Only reset to market selector when user explicitly navigates to "/" from another page
  const prevPathnameRef = useRef(null);
  useEffect(() => {
    const prev = prevPathnameRef.current;
    prevPathnameRef.current = location.pathname;
    // Reset only if coming from a different route (not a post-login same-page reload)
    if (location.pathname === "/" && prev !== null && prev !== "/") {
      setMarket(null);
      sessionStorage.removeItem("reef_market");
    }
  }, [location.key]);

  const handleSetMarket = (m) => {
    sessionStorage.setItem("reef_market", m);
    setMarket(m);
  };

  const isSaltwater = market === "saltwater";
  const marketTypes = isSaltwater ? SALTWATER_TYPES : FRESHWATER_TYPES;

  const { data: featured = [], refetch: refetchFeatured } = useQuery({
    queryKey: ["listings", "featured", market, isGuest],
    queryFn: async () => {
      if (isGuest) {
        const res = await base44.functions.invoke("getPublicListings", { filter: { featured: true }, limit: 10 });
        return res.data?.listings || [];
      }
      return base44.entities.Listing.filter({ featured: true, status: "active" }, "-created_date", 10);
    },
    enabled: !!market,
  });

  const { data: recent = [], refetch: refetchRecent } = useQuery({
    queryKey: ["listings", "recent", market, isGuest],
    queryFn: async () => {
      if (isGuest) {
        const res = await base44.functions.invoke("getPublicListings", { limit: 20 });
        return res.data?.listings || [];
      }
      return base44.entities.Listing.filter({ status: "active" }, "-created_date", 20);
    },
    enabled: !!market,
  });

  // Filter by market (listing_type membership)
  const filteredFeatured = featured.filter(l => marketTypes.includes(l.listing_type));
  const filteredRecent = recent.filter(l => marketTypes.includes(l.listing_type));

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchFeatured(), refetchRecent()]);
  }, [refetchFeatured, refetchRecent]);
  const { pullDistance, isRefreshing, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(handleRefresh);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}&market=${market}`);
  };

  if (!market) {
    return <MarketSelector onSelect={handleSetMarket} />;
  }

  const gradient = isSaltwater
    ? "bg-gradient-to-br from-primary to-blue-700"
    : "bg-gradient-to-br from-emerald-600 to-teal-800";

  const subtitle = isSaltwater ? t("sw_subtitle") : t("fw_subtitle");
  const searchPlaceholder = isSaltwater ? t("sw_search_placeholder") : t("fw_search_placeholder");

  const sellBannerImage = isSaltwater
    ? "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/20a05d5fe_generated_image.png"
    : "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/f8b1d6437_generated_image.png";

  const sellBannerGradient = isSaltwater
    ? "from-primary/80 to-blue-700/60"
    : "from-emerald-600/80 to-teal-800/60";

  const sellText = isSaltwater ? t("sw_sell_text") : t("fw_sell_text");

  return (
    <div
      className="space-y-6 pb-4"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />

      {/* Header */}
      <div className={`${gradient} px-4 pt-12 pb-8 rounded-b-3xl`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Waves className="w-7 h-7 text-white/90" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {isSaltwater ? "Reef Market" : "Freshwater Market"}
            </h1>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem("reef_market"); setMarket(null); }}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            {t("switch_market")}
          </button>
        </div>
        <p className="text-white/70 text-sm mb-5">{subtitle}</p>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-0 shadow-lg rounded-xl h-11 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => navigate(`/search?market=${market}`)}
            className="bg-white/30 hover:bg-white/40 text-white rounded-xl h-11 w-11 flex items-center justify-center shadow-lg shrink-0 transition-colors"
            title="Advanced filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Featured */}
      {filteredFeatured.length > 0 && <FeaturedCarousel listings={filteredFeatured} />}

      {/* Categories */}
      {isSaltwater ? <SaltwaterCategoryBrowser /> : <FreshwaterCategoryBrowser />}

      {/* Sell Banner */}
      <div className="px-4">
        <Link to="/sell">
          <div className="relative overflow-hidden rounded-2xl shadow-md">
            <img src={sellBannerImage} alt="Sell" className="w-full h-36 object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-r ${sellBannerGradient} flex flex-col justify-center px-5`}>
              <p className="text-white/80 text-xs font-medium uppercase tracking-wider mb-0.5">{t("ready_to_sell")}</p>
              <h3 className="text-white text-xl font-extrabold leading-tight whitespace-pre-line">{sellText}</h3>
              <span className="mt-2 inline-block bg-white text-primary text-xs font-bold px-3 py-1 rounded-full w-fit">{t("start_selling")}</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Listings */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground">{t("new_listings")}</h2>
          <Link to={`/browse?market=${market}`} className="text-primary text-sm font-medium">
            {t("see_all")}
          </Link>
        </div>
        {filteredRecent.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">{t("no_listings_yet")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredRecent.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}