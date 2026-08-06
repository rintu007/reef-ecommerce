"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import {
  ALL_CATEGORIES,
  LISTING_TYPE_LABELS,
  SALTWATER_TYPES,
  FRESHWATER_TYPES,
  type ListingType,
} from "@reef-market/shared";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "featured", label: "Featured" },
];

const RADIUS_OPTIONS = [5, 10, 25, 50, 100, 150, 200];

export function BrowseFilters({ market }: { market: "saltwater" | "freshwater" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  return (
    <div className="mb-6 space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search listings…"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold">
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={listingType}
          onChange={(e) => navigate({ listing_type: e.target.value || undefined, category: undefined })}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
        >
          <option value="">All types</option>
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
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">All categories</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}

        <input
          type="number"
          min="0"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          onBlur={handleSubmit}
          placeholder="Min $"
          className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
        />
        <input
          type="number"
          min="0"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          onBlur={handleSubmit}
          placeholder="Max $"
          className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
        />

        <select
          value={locationActive ? "local_pickup" : shipping}
          disabled={locationActive}
          onChange={(e) => navigate({ shipping: e.target.value || undefined })}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm disabled:opacity-60"
          title={locationActive ? "Locked to local pickup while a location filter is active" : undefined}
        >
          <option value="">Shipping or pickup</option>
          <option value="shipping">Ships</option>
          <option value="local_pickup">Local pickup</option>
        </select>

        <select
          value={sort}
          onChange={(e) => navigate({ sort: e.target.value })}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm ml-auto"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
        <span className="text-sm font-medium text-gray-700">Search by location</span>
        <input
          type="text"
          inputMode="numeric"
          value={zipInput}
          onChange={(e) => setZipInput(e.target.value)}
          placeholder="ZIP code"
          className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
        />
        <select
          value={radiusMiles}
          onChange={(e) => handleRadiusChange(e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
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
          className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-sm font-semibold disabled:opacity-50"
        >
          Search
        </button>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={geoLoading}
          className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-semibold disabled:opacity-50"
        >
          📍 Use my location
        </button>
        {geoError && <span className="text-xs text-red-600">{geoError}</span>}
      </div>

      {locationActive && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-medium">
            {zip ? `ZIP ${zip}` : "My Location"} — within {radiusMiles}mi
            <button
              type="button"
              onClick={handleClearLocation}
              aria-label="Clear location filter"
              className="text-blue-700 hover:text-blue-900 font-bold leading-none"
            >
              ×
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
