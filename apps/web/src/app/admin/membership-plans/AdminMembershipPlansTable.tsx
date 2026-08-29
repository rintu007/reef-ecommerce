"use client";

import { useCallback, useEffect, useState } from "react";
import { listAdminMembershipPlans, updateMembershipPlan, type MembershipPlan } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

interface FormState {
  name: string;
  price_monthly: string;
  max_active_listings: string;
  description: string;
  features: string;
  is_active: boolean;
}

function toForm(plan: MembershipPlan): FormState {
  return {
    name: plan.name,
    price_monthly: String(plan.price_monthly),
    max_active_listings: String(plan.max_active_listings),
    description: plan.description ?? "",
    features: plan.features.join("\n"),
    is_active: plan.is_active,
  };
}

export function AdminMembershipPlansTable() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { plans } = await listAdminMembershipPlans(apiClient);
      setPlans(plans);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  function startEdit(plan: MembershipPlan) {
    setEditingId(plan.id);
    setForm(toForm(plan));
    setError(null);
  }

  async function save() {
    if (!editingId || !form) return;
    setSaving(true);
    setError(null);
    try {
      await updateMembershipPlan(apiClient, editingId, {
        name: form.name,
        price_monthly: Number(form.price_monthly) || 0,
        max_active_listings: Number(form.max_active_listings),
        description: form.description || null,
        features: form.features.split("\n").map((f) => f.trim()).filter(Boolean),
        is_active: form.is_active,
      });
      setEditingId(null);
      setForm(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save plan");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-500 text-sm">Loading…</p>;

  return (
    <div className="space-y-3">
      {plans.map((plan) => (
        <div key={plan.id} className="rounded-xl border border-gray-200 p-4 bg-white">
          {editingId === plan.id && form ? (
            <div className="space-y-3">
              <div className="flex gap-3">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Name"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  value={form.price_monthly}
                  onChange={(e) => setForm({ ...form, price_monthly: e.target.value })}
                  type="number"
                  step="0.01"
                  placeholder="Price/mo"
                  className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Max active listings (-1 = unlimited)</label>
                <input
                  value={form.max_active_listings}
                  onChange={(e) => setForm({ ...form, max_active_listings: e.target.value })}
                  type="number"
                  className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <div>
                <label className="text-xs text-gray-500">Features (one per line)</label>
                <textarea
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  rows={4}
                  className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Active (offered to new subscribers)
              </label>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3 text-sm font-semibold">
                <button onClick={save} disabled={saving} className="text-blue-600 hover:underline disabled:opacity-50">
                  {saving ? "Saving…" : "Save"}
                </button>
                <button onClick={() => setEditingId(null)} disabled={saving} className="text-gray-500 hover:underline disabled:opacity-50">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-sm">
                  {plan.name}{" "}
                  <span className="text-xs font-mono text-gray-400">({plan.slug})</span>{" "}
                  <span className={`text-xs font-normal ${plan.is_active ? "text-emerald-600" : "text-gray-400"}`}>
                    {plan.is_active ? "active" : "inactive"}
                  </span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  ${plan.price_monthly.toFixed(2)}/mo · {plan.max_active_listings === -1 ? "unlimited listings" : `${plan.max_active_listings} listings`}
                </p>
                {plan.description && <p className="text-sm text-gray-500 mt-1">{plan.description}</p>}
                {plan.features.length > 0 && (
                  <ul className="text-xs text-gray-400 mt-1 list-disc list-inside">
                    {plan.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                )}
              </div>
              <button onClick={() => startEdit(plan)} className="text-sm font-semibold text-blue-600 hover:underline shrink-0">
                Edit
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
