"use client";

import { useCallback, useEffect, useState } from "react";
import {
  broadcastAnnouncement,
  deleteAnnouncement,
  listAdminAnnouncements,
  sendAnnouncementEmail,
  updateAnnouncement,
  type Announcement,
  type AnnouncementUpdateInput,
  type BroadcastResult,
} from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

interface AnnouncementFormState {
  subject: string;
  message: string;
  max_views: string;
  show_to_guests: boolean;
}

function EditForm({
  initial,
  onCancel,
  onSave,
  saving,
}: {
  initial: AnnouncementFormState;
  onCancel: () => void;
  onSave: (form: AnnouncementFormState) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);

  return (
    <div className="space-y-3">
      <input
        value={form.subject}
        onChange={(e) => setForm({ ...form, subject: e.target.value })}
        placeholder="Subject"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <textarea
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        placeholder="Message"
        rows={2}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          Max views per user
          <input
            type="number"
            min={1}
            value={form.max_views}
            onChange={(e) => setForm({ ...form, max_views: e.target.value })}
            className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.show_to_guests}
            onChange={(e) => setForm({ ...form, show_to_guests: e.target.checked })}
          />
          Show to guests
        </label>
      </div>
      <div className="flex gap-3 text-sm font-semibold">
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.subject || !form.message}
          className="text-blue-600 hover:underline disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button onClick={onCancel} disabled={saving} className="text-gray-500 hover:underline disabled:opacity-50">
          Cancel
        </button>
      </div>
    </div>
  );
}

export function AdminAnnouncementsTable() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Legacy parity: reef-trade-flow's admin "Broadcast Announcement" — always
  // creates a new announcement, optionally as an in-app banner, an email
  // blast, or both. Editing an existing announcement is handled inline per
  // row via `EditForm` below, not through this form.
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
    setSubject("");
    setMessage("");
    setMaxViews("1");
    setShowToGuests(false);
    setSendPopup(true);
    setSendEmail(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBroadcastResult(null);
    setSubmitting(true);
    try {
      const result = await broadcastAnnouncement(apiClient, {
        subject,
        message,
        maxViews: Number(maxViews) || 1,
        showToGuests,
        sendPopup,
        sendEmail,
      });
      setBroadcastResult(result);
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send announcement");
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

  async function handleSaveEdit(a: Announcement, edited: AnnouncementFormState) {
    setBusyId(a.id);
    try {
      const input: AnnouncementUpdateInput = {
        subject: edited.subject,
        message: edited.message,
        max_views: Number(edited.max_views) || 1,
        show_to_guests: edited.show_to_guests,
      };
      await updateAnnouncement(apiClient, a.id, input);
      setEditingId(null);
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

  async function handleSendEmail(a: Announcement) {
    if (!window.confirm(`Email "${a.subject}" to every registered user? This can't be undone.`)) return;
    setBusyId(a.id);
    setError(null);
    try {
      const result = await sendAnnouncementEmail(apiClient, a.id);
      window.alert(`Sent to ${result.sent} recipient${result.sent === 1 ? "" : "s"}${result.failed ? ` (${result.failed} failed)` : ""}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-4 mb-6 space-y-3">
        <h2 className="font-semibold text-sm">Broadcast Announcement</h2>
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

        {error && <p className="text-sm text-red-600">{error}</p>}
        {broadcastResult && (
          <p className="text-sm text-emerald-700">
            {broadcastResult.popupCreated && "In-app banner created. "}
            {broadcastResult.emailsSent > 0 && `${broadcastResult.emailsSent} email(s) sent. `}
            {broadcastResult.emailsFailed > 0 && `${broadcastResult.emailsFailed} email(s) failed.`}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || (!sendPopup && !sendEmail)}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Sending…" : "Send"}
        </button>
      </form>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : announcements.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">No announcements yet.</p>
      ) : (
        <div className="space-y-2">
          {announcements.map((a) => (
            <div key={a.id} className="rounded-xl border border-gray-200 p-3 bg-white">
              {editingId === a.id ? (
                <EditForm
                  initial={{
                    subject: a.subject,
                    message: a.message,
                    max_views: String(a.max_views),
                    show_to_guests: a.show_to_guests,
                  }}
                  onCancel={() => setEditingId(null)}
                  onSave={(edited) => handleSaveEdit(a, edited)}
                  saving={busyId === a.id}
                />
              ) : (
                <div className="flex items-start justify-between gap-3">
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
                      {a.emailed_at && <> · emailed {new Date(a.emailed_at).toLocaleDateString()}</>}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0 text-sm font-semibold">
                    <div className="flex gap-3">
                      <button onClick={() => setEditingId(a.id)} disabled={busyId === a.id} className="text-gray-600 hover:underline disabled:opacity-50">
                        Edit
                      </button>
                      <button onClick={() => toggleActive(a)} disabled={busyId === a.id} className="text-blue-600 hover:underline disabled:opacity-50">
                        {a.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button onClick={() => handleDelete(a.id)} disabled={busyId === a.id} className="text-red-600 hover:underline disabled:opacity-50">
                        Delete
                      </button>
                    </div>
                    {a.emailed_at ? (
                      <span className="text-xs font-normal text-gray-400">Already emailed</span>
                    ) : (
                      <button
                        onClick={() => handleSendEmail(a)}
                        disabled={busyId === a.id}
                        className="text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-50"
                      >
                        {busyId === a.id ? "Sending…" : "Send Email to All Users"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
