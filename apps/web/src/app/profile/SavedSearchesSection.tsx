"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createSavedSearch,
  deleteSavedSearch,
  listSavedSearches,
  updateSavedSearch,
  LISTING_TYPE_LABELS,
  type ListingType,
  type SavedSearch,
} from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

const LISTING_TYPES = Object.keys(LISTING_TYPE_LABELS) as ListingType[];

export function SavedSearchesSection() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [listingType, setListingType] = useState<ListingType | "">("");
  const [category, setCategory] = useState("");
  const [keyword, setKeyword] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [shippingAvailable, setShippingAvailable] = useState(false);
  const [localPickup, setLocalPickup] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { savedSearches } = await listSavedSearches(apiClient);
      setSearches(savedSearches);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      await createSavedSearch(apiClient, {
        name: name || null,
        listing_type: listingType || null,
        category: category || null,
        keyword: keyword || null,
        max_price: maxPrice ? Number(maxPrice) : null,
        shipping_available: shippingAvailable,
        local_pickup: localPickup,
      });
      setName("");
      setListingType("");
      setCategory("");
      setKeyword("");
      setMaxPrice("");
      setShippingAvailable(false);
      setLocalPickup(false);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save search");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(search: SavedSearch) {
    setBusyId(search.id);
    try {
      await updateSavedSearch(apiClient, search.id, { is_active: !search.is_active });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    try {
      await deleteSavedSearch(apiClient, id);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return null;

  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-white">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Saved Searches</p>
        <button onClick={() => setShowForm((v) => !v)} className="text-xs font-semibold text-blue-600 hover:underline">
          {showForm ? "Cancel" : "+ New"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mt-3 space-y-2 border-t border-gray-100 pt-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. Zoas under $50)"
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={listingType}
              onChange={(e) => setListingType(e.target.value as ListingType | "")}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            >
              <option value="">Any type</option>
              {LISTING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {LISTING_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Keyword"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            />
            <input
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              type="number"
              min="0"
              placeholder="Max price"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex gap-4 text-xs text-gray-600">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={shippingAvailable} onChange={(e) => setShippingAvailable(e.target.checked)} />
              Shipping available
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={localPickup} onChange={(e) => setLocalPickup(e.target.checked)} />
              Local pickup
            </label>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={creating}
            className="w-full rounded-lg bg-gray-900 text-white text-xs font-semibold py-2 hover:bg-gray-800 disabled:opacity-50"
          >
            {creating ? "Saving…" : "Save Search"}
          </button>
        </form>
      )}

      {searches.length === 0 ? (
        <p className="text-sm text-gray-500 mt-2">No saved searches yet.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {searches.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{s.name || s.keyword || "Untitled search"}</p>
                <p className="text-xs text-gray-500">
                  {[s.listing_type ? LISTING_TYPE_LABELS[s.listing_type] : null, s.category, s.keyword, s.max_price ? `≤ $${s.max_price}` : null]
                    .filter(Boolean)
                    .join(" · ") || "All listings"}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold shrink-0">
                <button onClick={() => toggleActive(s)} disabled={busyId === s.id} className="text-gray-500 hover:underline disabled:opacity-50">
                  {s.is_active ? "Disable alerts" : "Enable alerts"}
                </button>
                <button onClick={() => remove(s.id)} disabled={busyId === s.id} className="text-red-600 hover:underline disabled:opacity-50">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
