"use client";

import { useCallback, useEffect, useState } from "react";
import { listBlockedUsers, unblockUser, type BlockedUser } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

export function BlockedUsersSection() {
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { blockedUsers } = await listBlockedUsers(apiClient);
    setBlocked(blockedUsers);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function unblock(blockedId: string) {
    setBusyId(blockedId);
    try {
      await unblockUser(apiClient, blockedId);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (loading || blocked.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-white">
      <p className="font-semibold text-sm">Blocked Sellers</p>
      <div className="mt-2 space-y-2">
        {blocked.map((b) => (
          <div key={b.id} className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{b.reason || "No reason given"}</span>
            <button
              onClick={() => unblock(b.blocked_id)}
              disabled={busyId === b.blocked_id}
              className="text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50"
            >
              Unblock
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
