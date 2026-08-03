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

export function BrowseFilters({ market }: { market: "saltwater" | "freshwater" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") ?? "");

  const listingType = searchParams.get("listing_type") ?? "";
  const category = searchParams.get("category") ?? "";
  const shipping = searchParams.get("shipping") ?? "";
  const sort = searchParams.get("sort") ?? "newest";

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
          value={shipping}
          onChange={(e) => navigate({ shipping: e.target.value || undefined })}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
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
    </div>
  );
}
