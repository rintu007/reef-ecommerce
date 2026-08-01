import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X, MapPin, Loader2, Navigation } from "lucide-react";
import { useLocation } from "react-router-dom";
import ListingCard from "@/components/listings/ListingCard";
import { ALL_CATEGORIES, LISTING_TYPE_LABELS, SALTWATER_TYPES, FRESHWATER_TYPES } from "@/lib/categories";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/ui/PullToRefreshIndicator";
import MobileSelect from "@/components/ui/MobileSelect";

// Haversine distance in miles
function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocodeZip(zip) {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=US&format=json&limit=1`);
  const data = await res.json();
  if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  return null;
}

const ALL_TYPES = [...SALTWATER_TYPES, ...FRESHWATER_TYPES];

export default function SearchPage() {
  const location = useLocation();
  const { isGuest } = useAuth();

  const params = new URLSearchParams(location.search);
  const [searchQuery, setSearchQuery] = useState(params.get("q") || "");
  const [inputValue, setInputValue] = useState(params.get("q") || "");
  const [market, setMarket] = useState(params.get("market") || "all"); // all, saltwater, freshwater
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [shippingFilter, setShippingFilter] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef(null);

  // Location filter
  const [zipInput, setZipInput] = useState("");
  const [zipRadius, setZipRadius] = useState(50);
  const [zipCoords, setZipCoords] = useState(null);
  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [locationLabel, setLocationLabel] = useState(null);
  const coordsCache = useRef({});

  const { data: listings = [], isLoading, refetch } = useQuery({
    queryKey: ["listings", "search", isGuest],
    queryFn: async () => {
      if (isGuest) {
        const res = await base44.functions.invoke("getPublicListings", { limit: 300 });
        return res.data?.listings || [];
      }
      return base44.entities.Listing.filter({ status: "active" }, "-created_date", 300);
    },
  });

  const { pullDistance, isRefreshing, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(refetch);

  // Auto-focus the search input when the page mounts
  useEffect(() => {
    const timer = setTimeout(() => searchInputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
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

  const handleZipSearch = async () => {
    if (!zipInput.trim()) return;
    setZipLoading(true);
    setZipError(null);
    const coords = await geocodeZip(zipInput.trim());
    if (coords) {
      setZipCoords(coords);
      setLocationLabel(`ZIP ${zipInput.trim()}`);
      setShippingFilter("local_pickup");
    } else {
      setZipError("ZIP code not found.");
    }
    setZipLoading(false);
  };

  const handleGPS = () => {
    setGpsLoading(true);
    setZipError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setZipCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLabel("My Location");
        setShippingFilter("local_pickup");
        setGpsLoading(false);
      },
      () => {
        setZipError("Could not access location.");
        setGpsLoading(false);
      }
    );
  };

  const clearLocation = () => {
    setZipCoords(null);
    setLocationLabel(null);
    setZipInput("");
    setZipError(null);
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    setSearchQuery(inputValue);
  };

  const marketTypes = useMemo(() => {
    if (market === "saltwater") return SALTWATER_TYPES;
    if (market === "freshwater") return FRESHWATER_TYPES;
    return ALL_TYPES;
  }, [market]);

  const availableTypes = Object.entries(LISTING_TYPE_LABELS).filter(([k]) => marketTypes.includes(k));
  const availableCategories = typeFilter !== "all" ? ALL_CATEGORIES[typeFilter] || [] : [];

  const filtered = useMemo(() => {
    let result = [...listings];

    // Market filter
    result = result.filter(l => marketTypes.includes(l.listing_type));

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l =>
        l.title?.toLowerCase().includes(q) ||
        l.category?.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q) ||
        l.species_name?.toLowerCase().includes(q) ||
        l.location?.toLowerCase().includes(q)
      );
    }

    // Type
    if (typeFilter !== "all") result = result.filter(l => l.listing_type === typeFilter);
    // Category
    if (categoryFilter !== "all") result = result.filter(l => l.category === categoryFilter);
    // Shipping
    if (shippingFilter === "local_pickup") result = result.filter(l => l.local_pickup);
    else if (shippingFilter === "shipping") result = result.filter(l => l.shipping_available);
    // Price
    if (minPrice !== "") result = result.filter(l => (l.price || 0) >= Number(minPrice));
    if (maxPrice !== "") result = result.filter(l => (l.price || 0) <= Number(maxPrice));

    // Location radius
    if (zipCoords) {
      result = result.filter(l => {
        if (!l.local_pickup) return false;
        const cached = coordsCache.current[l.id];
        if (cached === undefined) { geocodeListing(l); return true; }
        if (cached === null) return false;
        return distanceMiles(zipCoords.lat, zipCoords.lng, cached.lat, cached.lng) <= zipRadius;
      });
    }

    // Sort
    if (sortBy === "price_low") result.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortBy === "price_high") result.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sortBy === "oldest") result.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    else result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)); // newest

    return result;
  }, [listings, searchQuery, market, marketTypes, typeFilter, categoryFilter, shippingFilter, minPrice, maxPrice, sortBy, zipCoords, zipRadius]);

  const hasActiveFilters = typeFilter !== "all" || categoryFilter !== "all" || shippingFilter !== "all" || zipCoords || minPrice || maxPrice || market !== "all";

  return (
    <div
      className="pb-4"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />

      {/* Search Bar */}
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 space-y-2">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search listings..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={() => setSearchQuery(inputValue)}
              className="pl-9 h-10 rounded-xl text-sm"
            />
            {inputValue && (
              <button type="button" onClick={() => { setInputValue(""); setSearchQuery(""); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <Button type="submit" size="sm" className="rounded-xl h-10 px-3 shrink-0">
            Go
          </Button>
          <Button
            type="button"
            variant={showFilters ? "default" : "outline"}
            size="icon"
            className="shrink-0 rounded-xl h-10 w-10"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </form>

        {/* Market toggle */}
        <div className="flex gap-1.5">
          {[
            { value: "all", label: "🌐 All" },
            { value: "saltwater", label: "🪸 Saltwater" },
            { value: "freshwater", label: "🐟 Freshwater" },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setMarket(value); setTypeFilter("all"); setCategoryFilter("all"); }}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors ${
                market === value
                  ? value === "freshwater" ? "bg-emerald-600 text-white" : "bg-primary text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 pt-1">
            {/* Sort */}
            <MobileSelect
              value={sortBy}
              onValueChange={setSortBy}
              placeholder="Sort"
              triggerClassName="h-9 text-xs"
              options={[
                { value: "newest", label: "Newest First" },
                { value: "oldest", label: "Oldest First" },
                { value: "price_low", label: "Price: Low → High" },
                { value: "price_high", label: "Price: High → Low" },
              ]}
            />

            {/* Type */}
            <MobileSelect
              value={typeFilter}
              onValueChange={(v) => { setTypeFilter(v); setCategoryFilter("all"); }}
              placeholder="Type"
              triggerClassName="h-9 text-xs"
              options={[
                { value: "all", label: "All Types" },
                ...availableTypes.map(([k, v]) => ({ value: k, label: v })),
              ]}
            />

            {/* Category */}
            {availableCategories.length > 0 && (
              <MobileSelect
                value={categoryFilter}
                onValueChange={setCategoryFilter}
                placeholder="Category"
                triggerClassName="h-9 text-xs"
                options={[
                  { value: "all", label: "All Categories" },
                  ...availableCategories.map((c) => ({ value: c, label: c })),
                ]}
              />
            )}

            {/* Shipping */}
            <MobileSelect
              value={shippingFilter}
              onValueChange={setShippingFilter}
              placeholder="Delivery"
              triggerClassName="h-9 text-xs"
              options={[
                { value: "all", label: "Any Delivery" },
                { value: "local_pickup", label: "Local Pickup" },
                { value: "shipping", label: "Ships to Me" },
              ]}
            />

            {/* Price range */}
            <div className="flex items-center gap-1">
              <Input
                placeholder="Min $"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-20 h-9 text-xs rounded-lg"
                type="number"
                min="0"
              />
              <span className="text-xs text-muted-foreground">–</span>
              <Input
                placeholder="Max $"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-20 h-9 text-xs rounded-lg"
                type="number"
                min="0"
              />
            </div>

            {/* Location section */}
            <div className="w-full space-y-2 bg-muted/50 rounded-xl p-3">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                Search by Location
              </p>
              {!zipCoords ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter ZIP code"
                      value={zipInput}
                      onChange={(e) => setZipInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleZipSearch()}
                      className="flex-1 h-9 text-xs rounded-lg"
                      maxLength={10}
                    />
                    <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg shrink-0" onClick={handleZipSearch} disabled={zipLoading}>
                      {zipLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}
                    </Button>
                  </div>
                  <button
                    className="flex items-center gap-1.5 text-xs text-primary font-medium"
                    onClick={handleGPS}
                    disabled={gpsLoading}
                  >
                    {gpsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                    {gpsLoading ? "Locating..." : "Use my location"}
                  </button>
                  {zipError && <p className="text-xs text-destructive">{zipError}</p>}
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-xs text-primary font-medium">{locationLabel} — within</span>
                  <MobileSelect
                    value={String(zipRadius)}
                    onValueChange={(v) => setZipRadius(Number(v))}
                    placeholder="Radius"
                    triggerClassName="h-9 text-xs w-28"
                    options={[5, 10, 25, 50, 100, 150, 200].map(m => ({ value: String(m), label: `${m} miles` }))}
                  />
                  <button onClick={clearLocation} className="w-8 h-8 flex items-center justify-center">
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex gap-2 px-4 pt-3 flex-wrap">
          {market !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setMarket("all")}>
              {market === "saltwater" ? "🪸 Saltwater" : "🐟 Freshwater"} <X className="w-3 h-3" />
            </Badge>
          )}
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
          {zipCoords && (
            <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={clearLocation}>
              <MapPin className="w-3 h-3" /> {locationLabel} / {zipRadius}mi <X className="w-3 h-3" />
            </Badge>
          )}
          {(minPrice || maxPrice) && (
            <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => { setMinPrice(""); setMaxPrice(""); }}>
              ${minPrice || "0"} – ${maxPrice || "∞"} <X className="w-3 h-3" />
            </Badge>
          )}
        </div>
      )}

      {/* Results */}
      <div className="px-4 pt-4">
        <p className="text-xs text-muted-foreground mb-3">
          {isLoading ? "Loading..." : `${filtered.length} listing${filtered.length !== 1 ? "s" : ""}`}
        </p>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="rounded-xl bg-muted animate-pulse aspect-square" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-base font-medium mb-1">No listings found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
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