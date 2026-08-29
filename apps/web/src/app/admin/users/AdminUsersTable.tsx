"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ADMIN_PERMISSIONS,
  adminDeleteUser,
  banUser,
  getUserActivityStats,
  grantPromoToUser,
  listAdminUsers,
  sendMessage,
  updateAdminPermissions,
  updateUserRole,
  type Profile,
  type UserActivityStats,
} from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

/** Legacy parity: reef-trade-flow's admin UserManagementTab per-user stats panel. */
function UserStatsPanel({ userId }: { userId: string }) {
  const [stats, setStats] = useState<UserActivityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getUserActivityStats(apiClient, userId)
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) return <p className="text-xs text-gray-400 py-2">Loading stats…</p>;
  if (!stats) return null;

  const cards = [
    { label: "Purchases", value: stats.totalPurchases, sub: `$${stats.totalSpent.toFixed(2)} spent` },
    { label: "Sales", value: stats.totalSales, sub: `$${stats.totalRevenue.toFixed(2)} earned` },
    { label: "Listings", value: `${stats.activeListings} active`, sub: `${stats.totalListings} total` },
    { label: "Last Active", value: stats.lastActive ? new Date(stats.lastActive).toLocaleDateString() : "No activity", sub: "" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map((c) => (
        <div key={c.label} className="bg-gray-50 rounded-lg p-2.5">
          <p className="text-[10px] text-gray-500">{c.label}</p>
          <p className="text-sm font-bold">{c.value}</p>
          {c.sub && <p className="text-[10px] text-gray-500">{c.sub}</p>}
        </div>
      ))}
    </div>
  );
}

function UserRow({ user, currentUserId, onChanged }: { user: Profile; currentUserId: string; onChanged: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [messageText, setMessageText] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSelf = user.id === currentUserId;
  const isBanned = !!user.banned_at;

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`rounded-xl border bg-white overflow-hidden ${isBanned ? "border-red-300" : "border-gray-200"}`}>
      <div className="flex items-center gap-3 p-3">
        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm overflow-hidden shrink-0">
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            "👤"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/admin/users/${user.id}`} className="font-semibold text-sm hover:underline truncate block">
            {user.display_name ?? "Unnamed"}
          </Link>
          <p className="text-xs text-gray-500 truncate">
            {user.email} ·{" "}
            <Link href={`/sellers/${user.id}`} className="hover:underline">
              storefront
            </Link>
          </p>
        </div>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${
            isBanned ? "bg-red-100 text-red-800" : user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-700"
          }`}
        >
          {isBanned ? "blocked" : user.role}
        </span>
        <button onClick={() => setExpanded((e) => !e)} className="text-gray-400 text-xs font-semibold shrink-0">
          {expanded ? "Hide" : "Manage"}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-200 bg-gray-50/50 p-4 space-y-4">
          <div>
            <p className="text-xs font-semibold mb-1.5">Activity Stats</p>
            <UserStatsPanel userId={user.id} />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          {!isBanned && !isSelf && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold">Role</p>
              <div className="flex gap-2">
                <button
                  disabled={busy}
                  onClick={() => run(() => updateUserRole(apiClient, user.id, "admin"))}
                  className={`text-xs h-8 rounded-lg flex-1 border ${user.role === "admin" ? "bg-gray-900 text-white" : "border-gray-300"}`}
                >
                  Admin
                </button>
                <button
                  disabled={busy}
                  onClick={() => run(() => updateUserRole(apiClient, user.id, "user"))}
                  className={`text-xs h-8 rounded-lg flex-1 border ${user.role === "user" ? "bg-gray-900 text-white" : "border-gray-300"}`}
                >
                  User
                </button>
              </div>
            </div>
          )}

          {!isBanned && user.role === "admin" && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold">Admin Permissions</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ADMIN_PERMISSIONS).map(([key, meta]) => {
                  const granted = user.admin_permissions.includes(key);
                  const next = granted
                    ? user.admin_permissions.filter((p) => p !== key)
                    : [...user.admin_permissions, key];
                  return (
                    <button
                      key={key}
                      disabled={busy}
                      title={meta.description}
                      onClick={() => run(() => updateAdminPermissions(apiClient, user.id, next))}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full disabled:opacity-40 ${
                        granted ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {granted ? "✓ " : ""}
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!isBanned && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold">Apply Promo Code</p>
              <div className="flex gap-2">
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="e.g. REEF2024"
                  className="rounded-lg h-8 text-xs font-mono flex-1 border border-gray-300 px-2"
                />
                <button
                  disabled={busy || !promoCode.trim()}
                  onClick={() => run(() => grantPromoToUser(apiClient, user.id, promoCode.trim())).then(() => setPromoCode(""))}
                  className="h-8 rounded-lg text-xs px-3 bg-gray-900 text-white disabled:opacity-40"
                >
                  Apply
                </button>
              </div>
            </div>
          )}

          {!isSelf && (
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <p className="text-xs font-semibold text-red-700">Moderation</p>
              <div className="flex gap-2">
                <button
                  disabled={busy}
                  onClick={() => run(() => banUser(apiClient, user.id, !isBanned))}
                  className={`text-xs h-8 rounded-lg flex-1 border ${
                    isBanned ? "border-emerald-500 text-emerald-700" : "border-red-500 text-red-700"
                  }`}
                >
                  {isBanned ? "Unblock" : "Block User"}
                </button>
                {!confirmDelete ? (
                  <button
                    disabled={busy}
                    onClick={() => setConfirmDelete(true)}
                    className="text-xs h-8 rounded-lg px-3 border border-red-500 text-red-700"
                  >
                    Delete
                  </button>
                ) : (
                  <div className="flex gap-1 flex-1">
                    <button
                      disabled={busy}
                      onClick={() => run(() => adminDeleteUser(apiClient, user.id)).then(() => setConfirmDelete(false))}
                      className="text-xs h-8 rounded-lg flex-1 bg-red-600 text-white"
                    >
                      Confirm Delete
                    </button>
                    <button onClick={() => setConfirmDelete(false)} className="text-xs h-8 rounded-lg px-3 text-gray-500">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isSelf && (
            <div className="space-y-1.5">
              <button onClick={() => setShowMessage((s) => !s)} className="text-xs text-blue-600 font-semibold">
                {showMessage ? "Cancel" : "Send In-App Message"}
              </button>
              {showMessage && (
                <div className="space-y-2">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message…"
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 text-sm p-2"
                  />
                  <button
                    disabled={busy || !messageText.trim()}
                    onClick={() =>
                      run(() => sendMessage(apiClient, { recipient_id: user.id, content: messageText.trim() })).then(() => {
                        setMessageText("");
                        setShowMessage(false);
                      })
                    }
                    className="h-8 text-xs rounded-lg w-full bg-gray-900 text-white disabled:opacity-40"
                  >
                    Send Message
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminUsersTable({ currentUserId }: { currentUserId: string }) {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const { users, total } = await listAdminUsers(apiClient, { q: search || undefined, limit: 100 });
      setUsers(users);
      setTotal(total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(q), 300);
    return () => clearTimeout(timer);
  }, [q, load]);

  const adminCount = users.filter((u) => u.role === "admin").length;
  const blockedCount = users.filter((u) => u.banned_at).length;

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: "Total", value: total },
          { label: "Users", value: users.length - adminCount - blockedCount },
          { label: "Admins", value: adminCount },
          { label: "Blocked", value: blockedCount },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <p className="text-xl font-extrabold">{s.value}</p>
            <p className="text-[10px] text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by email or name…"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-4"
      />

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : users.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">No users found.</p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">{total} user(s)</p>
          {users.map((user) => (
            <UserRow key={user.id} user={user} currentUserId={currentUserId} onChanged={() => load(q)} />
          ))}
        </div>
      )}
    </div>
  );
}
