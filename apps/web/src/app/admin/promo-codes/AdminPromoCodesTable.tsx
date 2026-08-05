"use client";

import { useCallback, useEffect, useState } from "react";
import { createPromoCode, deletePromoCode, listAdminPromoCodes, updatePromoCode, type PromoCode, type PromoType } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

const PROMO_TYPES: { value: PromoType; label: string }[] = [
  { value: "bonus_listings", label: "Bonus Listings" },
  { value: "free_membership_6mo", label: "Free Pro Membership — 6 Months" },
  { value: "free_membership_1yr", label: "Free Business Membership — 1 Year" },
];

export function AdminPromoCodesTable() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [type, setType] = useState<PromoType>("bonus_listings");
  const [bonusListings, setBonusListings] = useState("1");
  const [maxUses, setMaxUses] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { promoCodes } = await listAdminPromoCodes(apiClient, { limit: 100 });
      setCodes(promoCodes);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setCreating(true);
    try {
      await createPromoCode(apiClient, {
        code,
        type,
        bonus_listings: type === "bonus_listings" ? Number(bonusListings) || 1 : null,
        max_uses: Number(maxUses) || 1,
        expires_at: expiresAt || null,
        notes: notes || null,
        is_active: true,
      });
      setCode("");
      setBonusListings("1");
      setMaxUses("1");
      setExpiresAt("");
      setNotes("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create promo code");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(promo: PromoCode) {
    setBusyId(promo.id);
    try {
      await updatePromoCode(apiClient, promo.id, { is_active: !promo.is_active });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this promo code?")) return;
    setBusyId(id);
    try {
      await deletePromoCode(apiClient, id);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="rounded-xl border border-gray-200 bg-white p-4 mb-6 space-y-3">
        <h2 className="font-semibold text-sm">New Promo Code</h2>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CODE"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono uppercase"
        />
        <select value={type} onChange={(e) => setType(e.target.value as PromoType)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
          {PROMO_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-3 gap-2">
          {type === "bonus_listings" && (
            <label className="text-xs text-gray-600">
              Bonus listings
              <input
                type="number"
                min={1}
                value={bonusListings}
                onChange={(e) => setBonusListings(e.target.value)}
                className="w-full mt-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              />
            </label>
          )}
          <label className="text-xs text-gray-600">
            Max uses
            <input
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className="w-full mt-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-gray-600">
            Expires
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full mt-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
            />
          </label>
        </div>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (internal)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={creating}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {creating ? "Creating…" : "Create"}
        </button>
      </form>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : codes.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">No promo codes yet.</p>
      ) : (
        <div className="space-y-2">
          {codes.map((p) => (
            <div key={p.id} className="rounded-xl border border-gray-200 p-3 bg-white flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold font-mono">
                  {p.code}{" "}
                  <span className={`text-xs font-sans font-normal ${p.is_active ? "text-emerald-600" : "text-gray-400"}`}>
                    {p.is_active ? "active" : "inactive"}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {PROMO_TYPES.find((t) => t.value === p.type)?.label}
                  {p.type === "bonus_listings" && ` · ${p.bonus_listings} slots`}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {p.uses}/{p.max_uses} used{p.expires_at ? ` · expires ${p.expires_at}` : ""}
                </p>
                {p.notes && <p className="text-xs text-gray-400 mt-1">{p.notes}</p>}
              </div>
              <div className="flex gap-3 shrink-0 text-sm font-semibold">
                <button onClick={() => toggleActive(p)} disabled={busyId === p.id} className="text-blue-600 hover:underline disabled:opacity-50">
                  {p.is_active ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => handleDelete(p.id)} disabled={busyId === p.id} className="text-red-600 hover:underline disabled:opacity-50">
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
