"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { LocateFixed, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import {
  ALL_CATEGORIES,
  LISTING_TYPE_LABELS,
  SALTWATER_TYPES,
  FRESHWATER_TYPES,
  useT,
  type ListingType,
} from "@reef-market/shared";
import { useLanguagePrefs } from "@/lib/language-context";

const RADIUS_OPTIONS = [5, 10, 25, 50, 100, 150, 200];

export function BrowseFilters({ market }: { market: "saltwater" | "freshwater" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { lang } = useLanguagePrefs();
  const t = useT(lang);

  const SORT_OPTIONS = [
    { value: "newest", label: t("newest") },
    { value: "price_low", label: t("price_low") },
    { value: "price_high", label: t("price_high") },
    { value: "featured", label: "Featured" },
  ];

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") ?? "");
  const [zipInput, setZipInput] = useState(searchParams.get("zip") ?? "");
  const [radiusMiles, setRadiusMiles] = useState(searchParams.get("radius_miles") ?? "50");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const listingType = searchParams.get("listing_type") ?? "";
  const category = searchParams.get("category") ?? "";
  const shipping = searchParams.get("shipping") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const zip = searchParams.get("zip") ?? "";
  const lat = searchParams.get("lat") ?? "";
  const lng = searchParams.get("lng") ?? "";
  const locationActive = !!(lat && lng);

  const availableTypes = market === "saltwater" ? SALTWATER_TYPES : FRESHWATER_TYPES;
  const availableCategories = listingType ? ALL_CATEGORIES[listingType as ListingType] : null;

  function navigate(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("market", market);
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate({ q: q.trim() || undefined, min_price: minPrice || undefined, max_price: maxPrice || undefined });
  }

  async function handleZipSearch() {
    const trimmed = zipInput.trim();
    if (!trimmed) return;
    setGeoError(null);
    setGeoLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(trimmed)}&country=US&format=json&limit=1`
      );
      const data = await res.json();
      const first = data?.[0];
      if (!first) {
        setGeoError("ZIP code not found");
        return;
      }
      navigate({
        zip: trimmed,
        lat: first.lat,
        lng: first.lon,
        radius_miles: radiusMiles,
        shipping: "local_pickup",
      });
    } catch {
      setGeoError("Couldn't look up that ZIP code. Please try again.");
    } finally {
      setGeoLoading(false);
    }
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation isn't supported by your browser");
      return;
    }
    setGeoError(null);
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        setZipInput("");
        navigate({
          zip: undefined,
          lat: String(pos.coords.latitude),
          lng: String(pos.coords.longitude),
          radius_miles: radiusMiles,
          shipping: "local_pickup",
        });
      },
      () => {
        setGeoLoading(false);
        setGeoError("Location permission denied");
      },
      { timeout: 10000 }
    );
  }

  function handleRadiusChange(value: string) {
    setRadiusMiles(value);
    if (locationActive) navigate({ radius_miles: value });
  }

  function handleClearLocation() {
    setZipInput("");
    navigate({ zip: undefined, lat: undefined, lng: undefined, radius_miles: undefined });
  }

  const control =
    "h-10 rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-800 hover:border-gray-300 transition-colors";
  const selectControl = `${control} select-chevron pr-9`;

  return (
    <div className="mb-10 rounded-3xl bg-white border border-gray-900/[0.06] p-3 sm:p-4 shadow-[0_20px_50px_-30px_rgba(12,26,33,0.3)]">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search_placeholder")}
            aria-label="Search listings"
            className="w-full h-12 rounded-full bg-gray-50 border border-transparent pl-11 pr-4 text-[15px] focus:bg-white"
          />
        </div>
        <button
          type="submit"
          className="h-12 px-6 rounded-full bg-ink text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2 items-center mt-3">
        <SlidersHorizontal size={16} className="text-gray-400 mx-1 hidden sm:block" aria-hidden />
        <select
          value={listingType}
          onChange={(e) => navigate({ listing_type: e.target.value || undefined, category: undefined })}
          aria-label="Listing type"
          className={selectControl}
        >
          <option value="">{t("all_types")}</option>
          {availableTypes.map((type) => (
            <option key={type} value={type}>
              {LISTING_TYPE_LABELS[type]}
            </option>
          ))}
        </select>

        {availableCategories && (
          <select
            value={category}
            onChange={(e) => navigate({ category: e.target.value || undefined })}
            aria-label="Category"
            className={selectControl}
          >
            <option value="">{t("all_categories")}</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}

        <div className={`${control} flex items-center gap-1 px-1.5`}>
          <input
            type="number"
            min="0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={handleSubmit}
            placeholder="Min $"
            aria-label="Minimum price"
            className="w-20 h-8 rounded-full border-0 px-2.5 text-sm bg-transparent"
          />
          <span className="text-gray-300">–</span>
          <input
            type="number"
            min="0"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={handleSubmit}
            placeholder="Max $"
            aria-label="Maximum price"
            className="w-20 h-8 rounded-full border-0 px-2.5 text-sm bg-transparent"
          />
        </div>

        <select
          value={locationActive ? "local_pickup" : shipping}
          disabled={locationActive}
          onChange={(e) => navigate({ shipping: e.target.value || undefined })}
          aria-label="Delivery"
          className={`${selectControl} disabled:opacity-60`}
          title={locationActive ? "Locked to local pickup while a location filter is active" : undefined}
        >
          <option value="">Shipping or pickup</option>
          <option value="shipping">{t("ships_to_me")}</option>
          <option value="local_pickup">{t("local_pickup")}</option>
        </select>

        <select
          value={sort}
          onChange={(e) => navigate({ sort: e.target.value })}
          aria-label="Sort"
          className={`${selectControl} sm:ml-auto`}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
        <span className="flex items-center gap-1.5 text-sm text-gray-600 mr-1">
          <MapPin size={15} className="text-gray-400" aria-hidden /> Near you
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={zipInput}
          onChange={(e) => setZipInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleZipSearch();
            }
          }}
          placeholder="ZIP code"
          aria-label="ZIP code"
          className={`${control} w-32`}
        />
        <select
          value={radiusMiles}
          onChange={(e) => handleRadiusChange(e.target.value)}
          aria-label="Radius"
          className={selectControl}
        >
          {RADIUS_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r} mi
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleZipSearch}
          disabled={geoLoading}
          className="h-10 px-4 rounded-full bg-gray-100 text-ink text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Go
        </button>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={geoLoading}
          className="h-10 px-4 inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          <LocateFixed size={15} aria-hidden /> {geoLoading ? t("locating") : t("near_me")}
        </button>
        {geoError && <span className="text-xs text-red-600">{geoError}</span>}

        {locationActive && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 pl-3 pr-1.5 h-8 text-xs font-medium sm:ml-auto">
            {zip ? `ZIP ${zip}` : "My location"} · within {radiusMiles} mi
            <button
              type="button"
              onClick={handleClearLocation}
              aria-label="Clear location filter"
              className="w-5 h-5 rounded-full hover:bg-blue-100 flex items-center justify-center"
            >
              <X size={12} />
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
