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
  type MarketType,
} from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

const CONTENT_TYPES: HelpContentType[] = ["article", "video", "tip", "faq"];
const MARKETS: { value: MarketType; label: string }[] = [
  { value: "both", label: "Both markets" },
  { value: "saltwater", label: "Saltwater only" },
  { value: "freshwater", label: "Freshwater only" },
];

interface FormState {
  title: string;
  category: HelpCategory;
  categories: HelpCategory[];
  contentType: HelpContentType;
  market: MarketType;
  body: string;
  youtubeUrl: string;
  published: boolean;
}

function emptyForm(): FormState {
  return {
    title: "",
    category: HELP_CATEGORIES[0].value,
    categories: [],
    contentType: "article",
    market: "both",
    body: "",
    youtubeUrl: "",
    published: true,
  };
}

function CategoryChips({
  value,
  onChange,
  exclude,
}: {
  value: HelpCategory[];
  onChange: (next: HelpCategory[]) => void;
  exclude: HelpCategory;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {HELP_CATEGORIES.filter((c) => c.value !== exclude).map((c) => {
        const active = value.includes(c.value);
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange(active ? value.filter((v) => v !== c.value) : [...value, c.value])}
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
          >
            {c.icon} {c.label}
          </button>
        );
      })}
    </div>
  );
}

function ContentForm({
  initial,
  onCancel,
  onSubmit,
  submitting,
  submitLabel,
}: {
  initial: FormState;
  onCancel?: () => void;
  onSubmit: (form: FormState) => void;
  submitting: boolean;
  submitLabel: string;
}) {
  const [form, setForm] = useState(initial);

  return (
    <div className="space-y-3">
      <input
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Title"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <div className="flex gap-3">
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value as HelpCategory })}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {HELP_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={form.contentType}
          onChange={(e) => setForm({ ...form, contentType: e.target.value as HelpContentType })}
          className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {CONTENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-1.5">Also show under (optional)</p>
        <CategoryChips
          value={form.categories}
          exclude={form.category}
          onChange={(categories) => setForm({ ...form, categories })}
        />
      </div>

      <select
        value={form.market}
        onChange={(e) => setForm({ ...form, market: e.target.value as MarketType })}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      >
        {MARKETS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>

      {form.contentType === "video" ? (
        <input
          value={form.youtubeUrl}
          onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
          placeholder="YouTube URL"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      ) : (
        <textarea
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          placeholder="Body text"
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      )}

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
        Published
      </label>

      <div className="flex gap-3 text-sm font-semibold">
        <button
          type="button"
          onClick={() => onSubmit(form)}
          disabled={submitting || !form.title}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={submitting} className="text-gray-500 hover:underline disabled:opacity-50">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export function AdminHelpContentTable() {
  const [items, setItems] = useState<HelpContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  async function handleCreate(form: FormState) {
    setError(null);
    setCreating(true);
    try {
      await createHelpContent(apiClient, {
        title: form.title,
        category: form.category,
        categories: form.categories,
        content_type: form.contentType,
        market: form.market,
        body: form.contentType === "video" ? null : form.body || null,
        youtube_url: form.contentType === "video" ? form.youtubeUrl || null : null,
        published: form.published,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveEdit(id: string, form: FormState) {
    setBusyId(id);
    try {
      await updateHelpContent(apiClient, id, {
        title: form.title,
        category: form.category,
        categories: form.categories,
        content_type: form.contentType,
        market: form.market,
        body: form.contentType === "video" ? null : form.body || null,
        youtube_url: form.contentType === "video" ? form.youtubeUrl || null : null,
        published: form.published,
      });
      setEditingId(null);
      await load();
    } finally {
      setBusyId(null);
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
      <div className="rounded-xl border border-gray-200 bg-white p-4 mb-6">
        <h2 className="font-semibold text-sm mb-3">New Learn Item</h2>
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        <ContentForm initial={emptyForm()} onSubmit={handleCreate} submitting={creating} submitLabel="Create" />
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">No Learn content yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-200 p-3 bg-white">
              {editingId === item.id ? (
                <ContentForm
                  initial={{
                    title: item.title,
                    category: item.category,
                    categories: item.categories as HelpCategory[],
                    contentType: item.content_type,
                    market: item.market,
                    body: item.body ?? "",
                    youtubeUrl: item.youtube_url ?? "",
                    published: item.published,
                  }}
                  onCancel={() => setEditingId(null)}
                  onSubmit={(form) => handleSaveEdit(item.id, form)}
                  submitting={busyId === item.id}
                  submitLabel="Save"
                />
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {item.title}{" "}
                      <span className={`text-xs font-normal ${item.published ? "text-emerald-600" : "text-gray-400"}`}>
                        {item.published ? "published" : "draft"}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {HELP_CATEGORIES.find((c) => c.value === item.category)?.label}
                      {item.categories.length > 0 && ` +${item.categories.length} more`} · {item.content_type} · {item.market}
                    </p>
                    {item.body && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.body}</p>}
                  </div>
                  <div className="flex gap-3 shrink-0 text-sm font-semibold">
                    <button onClick={() => setEditingId(item.id)} disabled={busyId === item.id} className="text-gray-600 hover:underline disabled:opacity-50">
                      Edit
                    </button>
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
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
