"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ADMIN_PERMISSIONS, listAdminUsers, updateAdminPermissions, updateUserRole, type Profile } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

export function AdminUsersTable({ currentUserId }: { currentUserId: string }) {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  async function toggleAdmin(user: Profile) {
    setBusyId(user.id);
    try {
      await updateUserRole(apiClient, user.id, user.role === "admin" ? "user" : "admin");
      await load(q);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setBusyId(null);
    }
  }

  async function togglePermission(user: Profile, permission: string) {
    setBusyId(user.id);
    try {
      const next = user.admin_permissions.includes(permission)
        ? user.admin_permissions.filter((p) => p !== permission)
        : [...user.admin_permissions, permission];
      await updateAdminPermissions(apiClient, user.id, next);
      await load(q);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update permissions");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
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
            <div key={user.id} className="rounded-xl border border-gray-200 p-3 bg-white">
              <div className="flex items-center gap-3">
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
                    user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {user.role}
                </span>
                <button
                  onClick={() => toggleAdmin(user)}
                  disabled={busyId === user.id || user.id === currentUserId}
                  className="text-sm font-semibold text-blue-600 hover:underline disabled:opacity-40 shrink-0"
                  title={user.id === currentUserId ? "Can't change your own role" : undefined}
                >
                  {user.role === "admin" ? "Revoke admin" : "Make admin"}
                </button>
              </div>

              {user.role === "admin" && (
                <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-100">
                  {Object.entries(ADMIN_PERMISSIONS).map(([key, meta]) => {
                    const granted = user.admin_permissions.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => togglePermission(user, key)}
                        disabled={busyId === user.id}
                        title={meta.description}
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
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
