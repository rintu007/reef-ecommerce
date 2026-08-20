"use client";

import { useCallback, useEffect, useState } from "react";
import { adminUnblockUser, listAllBlockedUsers, type AdminBlockedUser } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

const PAGE_SIZE = 100;

export function AdminBlockedUsersTable() {
  const [rows, setRows] = useState<AdminBlockedUser[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (nextOffset: number, replace: boolean) => {
    setLoading(true);
    try {
      const { blockedUsers, total } = await listAllBlockedUsers(apiClient, { limit: PAGE_SIZE, offset: nextOffset });
      setRows((prev) => (replace ? blockedUsers : [...prev, ...blockedUsers]));
      setTotal(total);
      setOffset(nextOffset);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(0, true), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUnblock(id: string) {
    if (!confirm("Remove this block? The blocker will be able to be contacted by the blocked user again.")) return;
    setBusyId(id);
    try {
      await adminUnblockUser(apiClient, id);
      await load(0, true);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <p className="text-xs text-gray-400 mb-2">{total} block{total === 1 ? "" : "s"}</p>

      {loading && rows.length === 0 ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">No one has blocked anyone yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 p-3 bg-white">
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {row.blocker?.display_name ?? row.blocker?.email ?? row.blocker_id} blocked{" "}
                  {row.blocked?.display_name ?? row.blocked?.email ?? row.blocked_id}
                </p>
                {row.reason && <p className="text-sm text-gray-600 mt-1">{row.reason}</p>}
                <p className="text-xs text-gray-400 mt-1">{new Date(row.created_at).toLocaleString()}</p>
              </div>
              <button
                onClick={() => handleUnblock(row.id)}
                disabled={busyId === row.id}
                className="shrink-0 text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
      )}

      {rows.length < total && (
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
