"use client";

import { useCallback, useEffect, useState } from "react";
import {
  broadcastAnnouncement,
  deleteAnnouncement,
  listAdminAnnouncements,
  updateAnnouncement,
  type Announcement,
  type BroadcastResult,
} from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

export function AdminAnnouncementsTable() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  // When set, the form below edits this announcement (PATCH) instead of
  // broadcasting a new one — legacy parity: reef-trade-flow's admin panel
  // could edit an existing announcement's subject/message/max_views/
  // show_to_guests, which this app's admin UI had dropped (create+toggle+
  // delete only).
  const [editingId, setEditingId] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [maxViews, setMaxViews] = useState("1");
  const [showToGuests, setShowToGuests] = useState(false);
  const [sendPopup, setSendPopup] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [broadcastResult, setBroadcastResult] = useState<BroadcastResult | null>(null);

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

  function resetForm() {
    setEditingId(null);
    setSubject("");
    setMessage("");
    setMaxViews("1");
    setShowToGuests(false);
    setSendPopup(true);
    setSendEmail(false);
  }

  function startEdit(a: Announcement) {
    setEditingId(a.id);
    setSubject(a.subject);
    setMessage(a.message);
    setMaxViews(String(a.max_views));
    setShowToGuests(a.show_to_guests);
    setBroadcastResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBroadcastResult(null);
    setSubmitting(true);
    try {
      if (editingId) {
        await updateAnnouncement(apiClient, editingId, {
          subject,
          message,
          max_views: Number(maxViews) || 1,
          show_to_guests: showToGuests,
        });
      } else {
        const result = await broadcastAnnouncement(apiClient, {
          subject,
          message,
          maxViews: Number(maxViews) || 1,
          showToGuests,
          sendPopup,
          sendEmail,
        });
        setBroadcastResult(result);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save announcement");
    } finally {
      setSubmitting(false);
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
      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-4 mb-6 space-y-3">
        <h2 className="font-semibold text-sm">{editingId ? "Edit Announcement" : "Broadcast Announcement"}</h2>
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
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-4 flex-wrap">
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

        {!editingId && (
          <div className="flex items-center gap-4 flex-wrap border-t border-gray-100 pt-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={sendPopup} onChange={(e) => setSendPopup(e.target.checked)} />
              Show as in-app banner
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
              Email all users
            </label>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {broadcastResult && (
          <p className="text-sm text-emerald-700">
            {broadcastResult.popupCreated && "In-app banner created. "}
            {broadcastResult.emailsSent > 0 && `${broadcastResult.emailsSent} email(s) sent. `}
            {broadcastResult.emailsFailed > 0 && `${broadcastResult.emailsFailed} email(s) failed.`}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting || (!editingId && !sendPopup && !sendEmail)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Saving…" : editingId ? "Save Changes" : "Send"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg text-gray-600 text-sm font-semibold">
              Cancel
            </button>
          )}
        </div>
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
                <button onClick={() => startEdit(a)} disabled={busyId === a.id} className="text-gray-700 hover:underline disabled:opacity-50">
                  Edit
                </button>
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
