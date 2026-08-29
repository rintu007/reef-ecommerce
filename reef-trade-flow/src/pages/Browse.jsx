import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MobileSelect from "@/components/ui/MobileSelect";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X, ArrowLeft, MapPin, Loader2, Navigation } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import ListingCard from "@/components/listings/ListingCard";
import {
  ALL_CATEGORIES, LISTING_TYPE_LABELS,
  SALTWATER_TYPES, FRESHWATER_TYPES
} from "@/lib/categories";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/ui/PullToRefreshIndicator";
import { useUserPrefs } from "@/lib/UserPrefsContext";
import { getCountryName } from "@/lib/countries";
import { getT } from "@/lib/i18n";

// Haversine distance in miles
function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function Browse() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isGuest } = useAuth();
  const { country, language } = useUserPrefs();
  const t = getT(language);

  const params = new URLSearchParams(location.search);
  const marketParam = params.get("market") || "saltwater";
  const urlType = params.get("type") || "all";
  const urlCategory = params.get("category") || "all";

  const [market, setMarket] = useState(marketParam);
  const [searchQuery, setSearchQuery] = useState(params.get("q") || "");
  const [typeFilter, setTypeFilter] = useState(urlType);
  const [categoryFilter, setCategoryFilter] = useState(() => {
    if (urlType === "all" || !urlCategory || urlCategory === "all") return "all";
    const cats = ALL_CATEGORIES[urlType] || [];
    return cats.includes(urlCategory) ? urlCategory : "all";
  });

  const marketTypes = market === "saltwater" ? SALTWATER_TYPES : FRESHWATER_TYPES;

  // Sync filters when URL changes (e.g. navigating from CategoryPage while Browse is preserved)
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const newType = p.get("type") || "all";
    const newCategory = p.get("category") || "all";
    const newMarket = p.get("market") || "saltwater";

    setMarket(newMarket);
    setTypeFilter(newType);

    if (newType === "all" || newCategory === "all") {
      setCategoryFilter("all");
    } else {
      const cats = ALL_CATEGORIES[newType] || [];
      setCategoryFilter(cats.includes(newCategory) ? newCategory : "all");
    }
  }, [location.search]);
  const [shippingFilter, setShippingFilter] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Radius filter state
  const [radiusEnabled, setRadiusEnabled] = useState(false);
  const [radiusMiles, setRadiusMiles] = useState(50);
  const [userCoords, setUserCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(null);
  const coordsCache = useRef({});

  const enableRadius = useCallback(async () => {
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setRadiusEnabled(true);
        setShippingFilter("local_pickup");
        setLocating(false);
      },
      () => {
        setLocError("Could not get your location. Please allow location access.");
        setLocating(false);
      }
    );
  }, []);

  const disableRadius = useCallback(() => {
    setRadiusEnabled(false);
    setUserCoords(null);
    setLocError(null);
  }, []);

  const geocodeListing = useCallback(async (listing) => {
    if (!listing.location) return null;
    if (coordsCache.current[listing.id] !== undefined) return coordsCache.current[listing.id];
    coordsCache.current[listing.id] = null;
    const res = await base44.functions.invoke("geocodeLocation", { location: listing.location });
    const coords = res.data?.lat ? { lat: res.data.lat, lng: res.data.lng } : null;
    coordsCache.current[listing.id] = coords;
    return coords;
  }, []);

  const { data: blockedUsers = [] } = useQuery({
    queryKey: ["blocked-users", "browse"],
    queryFn: async () => {
      const me = await base44.auth.me().catch(() => null);
      if (!me) return [];
      return base44.entities.BlockedUser.filter({ blocker_email: me.email });
    },
    enabled: !isGuest,
  });
  const blockedEmails = new Set(blockedUsers.map(b => b.blocked_email));

  const { data: listings = [], isLoading, refetch } = useQuery({
    queryKey: ["listings", "browse", isGuest],
    queryFn: async () => {
      if (isGuest) {
        const res = await base44.functions.invoke("getPublicListings", { limit: 200 });
        return res.data?.listings || [];
      }
      return base44.entities.Listing.filter({ status: "active" }, "-created_date", 200);
    },
  });

  // Pull to refresh
  const { pullDistance, isRefreshing, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(refetch);

  const filtered = useMemo(() => {
    let result = listings.filter(l => {
      if (!marketTypes.includes(l.listing_type)) return false;
      if (blockedEmails.has(l.seller_email)) return false;
      // Country filter: show if no country set, or listing has no country set (legacy), or same country, or ships to buyer's country
      if (country && l.seller_country) {
        const sameCountry = l.seller_country === country;
        const shipsHere = l.shipping_available && (l.ships_to_countries || []).includes(country);
        if (!sameCountry && !shipsHere) return false;
      }
      return true;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l =>
        l.title?.toLowerCase().includes(q) ||
        l.category?.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q) ||
        l.species_name?.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") {
      result = result.filter(l => l.listing_type === typeFilter);
    }
    if (categoryFilter !== "all") {
      result = result.filter(l => l.category === categoryFilter);
    }
    if (params.get("featured") === "true") {
      result = result.filter(l => l.featured);
    }
    if (shippingFilter === "local_pickup") {
      result = result.filter(l => l.local_pickup);
    } else if (shippingFilter === "shipping") {
      result = result.filter(l => l.shipping_available);
    }
    if (minPrice !== "") {
      result = result.filter(l => (l.price || 0) >= Number(minPrice));
    }
    if (maxPrice !== "") {
      result = result.filter(l => (l.price || 0) <= Number(maxPrice));
    }

    if (radiusEnabled && userCoords) {
      result = result.filter(l => {
        if (!l.local_pickup) return false;
        const cached = coordsCache.current[l.id];
        if (cached === undefined) {
          geocodeListing(l);
          return true;
        }
        if (cached === null) return false;
        return distanceMiles(userCoords.lat, userCoords.lng, cached.lat, cached.lng) <= radiusMiles;
      });
    }

    switch (sortBy) {
      case "featured": result = result.filter(l => l.featured); break;
      case "price_low": result.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case "price_high": result.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case "newest": result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)); break;
      case "all":
      default: result.sort((a, b) => (a.title || "").localeCompare(b.title || "")); break;
    }

    return result;
  }, [listings, searchQuery, typeFilter, categoryFilter, shippingFilter, sortBy, radiusEnabled, userCoords, radiusMiles, minPrice, maxPrice, marketTypes]);

  const availableTypes = Object.entries(LISTING_TYPE_LABELS).filter(([k]) => marketTypes.includes(k));
  const availableCategories = typeFilter !== "all" ? ALL_CATEGORIES[typeFilter] || [] : [];

  const marketLabel = market === "saltwater" ? "Saltwater" : "Freshwater";
  const marketGradient = market === "saltwater"
    ? "from-primary/80 to-blue-700/60"
    : "from-emerald-600/80 to-teal-800/60";

  const sortOptions = [
    { value: "all", label: "All" },
    { value: "featured", label: "⭐ Featured" },
    { value: "newest", label: t("newest") },
    { value: "price_low", label: t("price_low") },
    { value: "price_high", label: t("price_high") },
  ];

  return (
    <div
      className="pb-4"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />

      {/* Search + controls header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border px-4 pt-3 pb-2 space-y-2">
        {/* Row 1: search + filter button */}
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="w-11 h-11 flex items-center justify-center shrink-0">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
            placeholder={t("search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="icon"
            className="shrink-0 rounded-xl h-10 w-10"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Row 2: market toggle + sort pills always visible */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setMarket("saltwater"); setTypeFilter("all"); setCategoryFilter("all"); }}
            className={`text-xs font-semibold px-3 min-h-[44px] rounded-full transition-colors ${market === "saltwater" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
          >
            🪸 Salt
          </button>
          <button
            onClick={() => { setMarket("freshwater"); setTypeFilter("all"); setCategoryFilter("all"); }}
            className={`text-xs font-semibold px-3 min-h-[44px] rounded-full transition-colors ${market === "freshwater" ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}
          >
            🐟 Fresh
          </button>
          <div className="flex-1" />
          {sortOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`text-xs font-semibold px-3 min-h-[44px] rounded-full transition-colors ${sortBy === opt.value ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Row 3: expandable filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 pt-1 pb-1">
            {/* Near me */}
            <div className="w-full flex items-center gap-2 flex-wrap">
              {!radiusEnabled ? (
                <Button variant="outline" className="rounded-full text-xs gap-1.5 h-11" onClick={enableRadius} disabled={locating}>
                  {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                  {locating ? t("locating") : t("near_me")}
                </Button>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-xs text-primary font-medium">{t("within")}</span>
                  <MobileSelect
                    value={String(radiusMiles)}
                    onValueChange={(v) => setRadiusMiles(Number(v))}
                    placeholder="Radius"
                    triggerClassName="h-11 text-sm w-28"
                    options={[5, 10, 25, 50, 100, 150, 200].map(m => ({ value: String(m), label: `${m} miles` }))}
                  />
                  <button onClick={disableRadius} className="w-11 h-11 flex items-center justify-center"><X className="w-4 h-4 text-muted-foreground" /></button>
                </div>
              )}
              {locError && <p className="text-xs text-destructive">{locError}</p>}
            </div>

            {/* Type */}
            <MobileSelect
              value={typeFilter}
              onValueChange={(v) => { setTypeFilter(v); setCategoryFilter("all"); }}
              placeholder="Type"
              triggerClassName="h-11 text-sm"
              options={[
                { value: "all", label: t("all_types") },
                ...availableTypes.map(([k, v]) => ({ value: k, label: v })),
              ]}
            />

            {availableCategories.length > 0 && (
              <MobileSelect
                value={categoryFilter}
                onValueChange={setCategoryFilter}
                placeholder="Category"
                triggerClassName="h-11 text-sm"
                options={[
                  { value: "all", label: t("all_categories") },
                  ...availableCategories.map((c) => ({ value: c, label: c })),
                ]}
              />
            )}

            {/* Delivery */}
            <MobileSelect
              value={shippingFilter}
              onValueChange={setShippingFilter}
              placeholder="Delivery"
              triggerClassName="h-11 text-sm"
              options={[
                { value: "all", label: t("any_delivery") },
                { value: "local_pickup", label: t("local_pickup") },
                { value: "shipping", label: t("ships_to_me") },
              ]}
            />

            {/* Price */}
            <div className="flex items-center gap-1">
              <Input placeholder="Min $" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-20 h-11 text-sm rounded-lg" type="number" min="0" />
              <span className="text-xs text-muted-foreground">–</span>
              <Input placeholder="Max $" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-20 h-11 text-sm rounded-lg" type="number" min="0" />
            </div>
          </div>
        )}
      </div>

      {/* Active filter chips */}
      {(typeFilter !== "all" || categoryFilter !== "all" || shippingFilter !== "all" || radiusEnabled || minPrice || maxPrice) && (
        <div className="flex gap-2 px-4 pt-3 flex-wrap">
          {typeFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => { setTypeFilter("all"); setCategoryFilter("all"); }}>
              {LISTING_TYPE_LABELS[typeFilter]} <X className="w-3 h-3" />
            </Badge>
          )}
          {categoryFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setCategoryFilter("all")}>
              {categoryFilter} <X className="w-3 h-3" />
            </Badge>
          )}
          {shippingFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setShippingFilter("all")}>
              {shippingFilter === "local_pickup" ? "Local Pickup" : "Ships to Me"} <X className="w-3 h-3" />
            </Badge>
          )}
          {radiusEnabled && (
            <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={disableRadius}>
              <MapPin className="w-3 h-3" /> Within {radiusMiles} mi <X className="w-3 h-3" />
            </Badge>
          )}
          {(minPrice || maxPrice) && (
            <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => { setMinPrice(""); setMaxPrice(""); }}>
              ${minPrice || "0"} – ${maxPrice || "∞"} <X className="w-3 h-3" />
            </Badge>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="px-4 pt-4">
        <p className="text-xs text-muted-foreground mb-3">{filtered.length} listing{filtered.length !== 1 ? "s" : ""}</p>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="rounded-xl bg-muted animate-pulse aspect-square" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-1">{t("no_listings")}</p>
            <p className="text-sm">{t("try_filters")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}