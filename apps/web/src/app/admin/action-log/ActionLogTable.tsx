"use client";

import { useCallback, useEffect, useState } from "react";
import { listAdminActionLog, type AdminActionLogEntry } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

const TARGET_TYPES = [
  "all",
  "order",
  "listing",
  "service",
  "review",
  "user",
  "report",
  "announcement",
  "promo_code",
  "help_content",
  "membership_plan",
  "blocked_user",
];

function humanize(action: string): string {
  return action.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function detailsSummary(details: Record<string, unknown> | null): string | null {
  if (!details) return null;
  const entries = Object.entries(details).filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (entries.length === 0) return null;
  return entries.map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`).join(" · ");
}

const PAGE_SIZE = 100;

export function ActionLogTable() {
  const [entries, setEntries] = useState<AdminActionLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [targetType, setTargetType] = useState("all");

  const load = useCallback(
    async (nextOffset: number, replace: boolean) => {
      setLoading(true);
      try {
        const { entries: page, total } = await listAdminActionLog(apiClient, {
          target_type: targetType === "all" ? undefined : targetType,
          limit: PAGE_SIZE,
          offset: nextOffset,
        });
        setEntries((prev) => (replace ? page : [...prev, ...page]));
        setTotal(total);
        setOffset(nextOffset);
      } finally {
        setLoading(false);
      }
    },
    [targetType]
  );

  useEffect(() => {
    const timer = setTimeout(() => load(0, true), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType]);

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {TARGET_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTargetType(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${
              targetType === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {t.replace("_", " ")}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 mb-2">{total} action{total === 1 ? "" : "s"}</p>

      {loading && entries.length === 0 ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">No actions logged in this view.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const summary = detailsSummary(entry.details);
            return (
              <div key={entry.id} className="rounded-xl border border-gray-200 p-3 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{humanize(entry.action)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {entry.admin_display_name ?? entry.admin_email ?? entry.admin_id} · {entry.target_type}
                      {entry.target_id && ` #${entry.target_id.slice(0, 8)}`}
                    </p>
                    {summary && <p className="text-xs text-gray-400 mt-1 break-words">{summary}</p>}
                  </div>
                  <p className="text-xs text-gray-400 shrink-0 whitespace-nowrap">{new Date(entry.created_at).toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {entries.length < total && (
        <button
          onClick={() => load(offset + PAGE_SIZE, false)}
          disabled={loading}
          className="mt-4 w-full py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
