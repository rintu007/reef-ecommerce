"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createAnnouncement,
  deleteAnnouncement,
  listAdminAnnouncements,
  updateAnnouncement,
  type Announcement,
} from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

export function AdminAnnouncementsTable() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [maxViews, setMaxViews] = useState("1");
  const [showToGuests, setShowToGuests] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { announcements } = await listAdminAnnouncements(apiClient, { limit: 100 });
      setAnnouncements(announcements);
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
      await createAnnouncement(apiClient, {
        subject,
        message,
        max_views: Number(maxViews) || 1,
        show_to_guests: showToGuests,
        is_active: true,
      });
      setSubject("");
      setMessage("");
      setMaxViews("1");
      setShowToGuests(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create announcement");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(a: Announcement) {
    setBusyId(a.id);
    try {
      await updateAnnouncement(apiClient, a.id, { is_active: !a.is_active });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this announcement?")) return;
    setBusyId(id);
    try {
      await deleteAnnouncement(apiClient, id);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="rounded-xl border border-gray-200 bg-white p-4 mb-6 space-y-3">
        <h2 className="font-semibold text-sm">New Announcement</h2>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message"
          required
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            Max views per user
            <input
              type="number"
              min={1}
              value={maxViews}
              onChange={(e) => setMaxViews(e.target.value)}
              className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={showToGuests} onChange={(e) => setShowToGuests(e.target.checked)} />
            Show to guests
          </label>
        </div>
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
      ) : announcements.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">No announcements yet.</p>
      ) : (
        <div className="space-y-2">
          {announcements.map((a) => (
            <div key={a.id} className="rounded-xl border border-gray-200 p-3 bg-white flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {a.subject}{" "}
                  <span className={`text-xs font-normal ${a.is_active ? "text-emerald-600" : "text-gray-400"}`}>
                    {a.is_active ? "active" : "inactive"}
                  </span>
                </p>
                <p className="text-sm text-gray-600 mt-1">{a.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  max {a.max_views} view{a.max_views === 1 ? "" : "s"} · {a.show_to_guests ? "guests + members" : "members only"}
                </p>
              </div>
              <div className="flex gap-3 shrink-0 text-sm font-semibold">
                <button onClick={() => toggleActive(a)} disabled={busyId === a.id} className="text-blue-600 hover:underline disabled:opacity-50">
                  {a.is_active ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => handleDelete(a.id)} disabled={busyId === a.id} className="text-red-600 hover:underline disabled:opacity-50">
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
