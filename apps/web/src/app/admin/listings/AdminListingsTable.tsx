"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { listListings, updateListing, deleteListing, type Listing, type ListingStatus } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

const STATUS_TABS: { value: ListingStatus | "all"; label: string }[] = [
  { value: "pending_approval", label: "Pending Approval" },
  { value: "active", label: "Active" },
  { value: "sold", label: "Sold" },
  { value: "removed", label: "Removed" },
  { value: "all", label: "All" },
];

export function AdminListingsTable() {
  const [status, setStatus] = useState<ListingStatus | "all">("pending_approval");
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { listings, total } = await listListings(apiClient, {
        status: status === "all" ? undefined : status,
        sort: "newest",
        limit: 100,
      });
      setListings(listings);
      setTotal(total);
      setSelected(new Set());
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function approve(id: string) {
    setBusyId(id);
    try {
      await updateListing(apiClient, id, { status: "active" });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    try {
      await updateListing(apiClient, id, { status: "removed" });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function toggleFeatured(listing: Listing) {
    setBusyId(listing.id);
    try {
      await updateListing(apiClient, listing.id, { featured: !listing.featured });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function hardDelete(id: string) {
    if (!confirm("Permanently delete this listing? This can't be undone.")) return;
    setBusyId(id);
    try {
      await deleteListing(apiClient, id);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === listings.length ? new Set() : new Set(listings.map((l) => l.id))));
  }

  async function bulkSetStatus(next: "active" | "removed") {
    if (selected.size === 0) return;
    if (next === "removed" && !confirm(`Remove ${selected.size} listing(s)?`)) return;
    setBulkBusy(true);
    try {
      await Promise.all([...selected].map((id) => updateListing(apiClient, id, { status: next })));
      await load();
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              status === tab.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : listings.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">No listings in this view.</p>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 text-xs text-gray-500">
              <input type="checkbox" checked={selected.size === listings.length} onChange={toggleSelectAll} />
              {total} listing(s) {selected.size > 0 && `· ${selected.size} selected`}
            </label>
          </div>

          <div className="space-y-2">
            {listings.map((listing) => (
              <div key={listing.id} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 bg-white">
                <input
                  type="checkbox"
                  checked={selected.has(listing.id)}
                  onChange={() => toggleSelected(listing.id)}
                  className="shrink-0"
                />
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  {listing.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/listings/${listing.id}`} className="font-semibold text-sm hover:underline truncate block">
                    {listing.title}
                  </Link>
                  <p className="text-xs text-gray-500">
                    ${listing.price.toFixed(2)} · {listing.status.replace("_", " ")}
                    {listing.featured ? " · featured" : ""}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0 text-sm font-semibold">
                  {listing.status !== "active" && (
                    <button
                      onClick={() => approve(listing.id)}
                      disabled={busyId === listing.id}
                      className="text-emerald-600 hover:underline disabled:opacity-50"
                    >
                      Approve
                    </button>
                  )}
                  {listing.status !== "removed" && (
                    <button
                      onClick={() => remove(listing.id)}
                      disabled={busyId === listing.id}
                      className="text-yellow-700 hover:underline disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                  <button
                    onClick={() => toggleFeatured(listing)}
                    disabled={busyId === listing.id}
                    className="text-blue-600 hover:underline disabled:opacity-50"
                  >
                    {listing.featured ? "Unfeature" : "Feature"}
                  </button>
                  <button
                    onClick={() => hardDelete(listing.id)}
                    disabled={busyId === listing.id}
                    className="text-red-600 hover:underline disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selected.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-full shadow-lg px-5 py-3 flex items-center gap-4 text-sm font-semibold z-50">
          <span>{selected.size} selected</span>
          <button onClick={() => bulkSetStatus("active")} disabled={bulkBusy} className="text-emerald-400 hover:underline disabled:opacity-50">
            {bulkBusy ? "Working…" : "Approve"}
          </button>
          <button onClick={() => bulkSetStatus("removed")} disabled={bulkBusy} className="text-amber-400 hover:underline disabled:opacity-50">
            Remove
          </button>
          <button onClick={() => setSelected(new Set())} disabled={bulkBusy} className="text-gray-400 hover:underline disabled:opacity-50">
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
