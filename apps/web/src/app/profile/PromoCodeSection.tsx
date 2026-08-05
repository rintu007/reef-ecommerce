"use client";

import { useState } from "react";
import { redeemPromoCode } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

export function PromoCodeSection() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const { granted } = await redeemPromoCode(apiClient, code);
      setMessage({ type: "ok", text: granted });
      setCode("");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to redeem code" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-white">
      <p className="font-semibold text-sm">Redeem Promo Code</p>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="PROMOCODE"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono uppercase"
        />
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
        >
          {busy ? "…" : "Apply"}
        </button>
      </form>
      {message && <p className={`text-sm mt-2 ${message.type === "ok" ? "text-emerald-600" : "text-red-600"}`}>{message.text}</p>}
    </div>
  );
}
