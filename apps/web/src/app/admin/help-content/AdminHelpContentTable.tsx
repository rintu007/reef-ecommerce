"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createHelpContent,
  deleteHelpContent,
  listAdminHelpContent,
  updateHelpContent,
  HELP_CATEGORIES,
  type HelpContent,
  type HelpCategory,
  type HelpContentType,
} from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

const CONTENT_TYPES: HelpContentType[] = ["article", "video", "tip", "faq"];

export function AdminHelpContentTable() {
  const [items, setItems] = useState<HelpContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<HelpCategory>(HELP_CATEGORIES[0].value);
  const [contentType, setContentType] = useState<HelpContentType>("article");
  const [body, setBody] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await listAdminHelpContent(apiClient, { limit: 200 });
      setItems(items);
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
      await createHelpContent(apiClient, {
        title,
        category,
        content_type: contentType,
        body: body || null,
        youtube_url: youtubeUrl || null,
        published: true,
      });
      setTitle("");
      setBody("");
      setYoutubeUrl("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  async function togglePublished(item: HelpContent) {
    setBusyId(item.id);
    try {
      await updateHelpContent(apiClient, item.id, { published: !item.published });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this Learn item?")) return;
    setBusyId(id);
    try {
      await deleteHelpContent(apiClient, id);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="rounded-xl border border-gray-200 bg-white p-4 mb-6 space-y-3">
        <h2 className="font-semibold text-sm">New Learn Item</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <div className="flex gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as HelpCategory)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {HELP_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value as HelpContentType)}
            className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {CONTENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        {contentType === "video" ? (
          <input
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="YouTube URL"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        ) : (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Body text"
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        )}
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
      ) : items.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">No Learn content yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-200 p-3 bg-white flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {item.title}{" "}
                  <span className={`text-xs font-normal ${item.published ? "text-emerald-600" : "text-gray-400"}`}>
                    {item.published ? "published" : "draft"}
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {HELP_CATEGORIES.find((c) => c.value === item.category)?.label} · {item.content_type}
                </p>
                {item.body && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.body}</p>}
              </div>
              <div className="flex gap-3 shrink-0 text-sm font-semibold">
                <button
                  onClick={() => togglePublished(item)}
                  disabled={busyId === item.id}
                  className="text-blue-600 hover:underline disabled:opacity-50"
                >
                  {item.published ? "Unpublish" : "Publish"}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={busyId === item.id}
                  className="text-red-600 hover:underline disabled:opacity-50"
                >
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
