"use client";

import { useEffect, useMemo, useState } from "react";
import { API_CATALOG, CATEGORY_ORDER, type ApiEndpoint, type AuthLevel } from "@/lib/api-catalog";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-800",
  POST: "bg-blue-100 text-blue-800",
  PATCH: "bg-amber-100 text-amber-800",
  DELETE: "bg-red-100 text-red-800",
};

const AUTH_COLORS: Record<AuthLevel, string> = {
  public: "bg-gray-100 text-gray-600",
  user: "bg-indigo-100 text-indigo-700",
  admin: "bg-purple-100 text-purple-700",
  internal: "bg-gray-200 text-gray-500",
};

const AUTH_LABELS: Record<AuthLevel, string> = {
  public: "Public",
  user: "Signed-in user",
  admin: "Admin only",
  internal: "Internal (not callable)",
};

function fillPath(path: string, values: Record<string, string>): string {
  return path.replace(/:([a-zA-Z]+)/g, (_, name) => encodeURIComponent(values[name] ?? `:${name}`));
}

function buildQueryString(params: Record<string, { value: string; enabled: boolean }>): string {
  const usp = new URLSearchParams();
  for (const [key, { value, enabled }] of Object.entries(params)) {
    if (enabled && value !== "") usp.set(key, value);
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

interface SessionInfo {
  loading: boolean;
  email: string | null;
  role: string | null;
}

function useSessionBanner(): SessionInfo {
  const [info, setInfo] = useState<SessionInfo>({ loading: true, email: null, role: null });
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          if (!cancelled) setInfo({ loading: false, email: null, role: null });
          return;
        }
        const res = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
        const body = await res.json().catch(() => null);
        if (!cancelled) setInfo({ loading: false, email: data.session.user.email ?? null, role: body?.profile?.role ?? null });
      } catch {
        if (!cancelled) setInfo({ loading: false, email: null, role: null });
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);
  return info;
}

export function ApiDocsExplorer() {
  const [selectedId, setSelectedId] = useState<string>(API_CATALOG[0].id);
  const session = useSessionBanner();

  const grouped = useMemo(() => {
    const byCategory = new Map<string, ApiEndpoint[]>();
    for (const ep of API_CATALOG) {
      if (!byCategory.has(ep.category)) byCategory.set(ep.category, []);
      byCategory.get(ep.category)!.push(ep);
    }
    return CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((c) => ({ category: c, endpoints: byCategory.get(c)! }));
  }, []);

  const selected = API_CATALOG.find((e) => e.id === selectedId) ?? API_CATALOG[0];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Reef Market API Docs &amp; Tester</h1>
        <p className="text-sm text-gray-500 mt-1">
          Browse every backend endpoint, see an example payload, edit it, and send a real request against this
          app&apos;s own API — same origin, so it uses whatever account you&apos;re currently signed in as in this
          browser tab.
        </p>
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
          {session.loading ? (
            <span className="text-gray-400">Checking sign-in status…</span>
          ) : session.email ? (
            <span>
              Signed in as <strong>{session.email}</strong> ({session.role ?? "unknown role"}). Requests below will
              run as this user — admin-only endpoints need an admin account.
            </span>
          ) : (
            <span>
              Not signed in. Public endpoints will work; anything marked <em>Signed-in user</em> or <em>Admin only</em>{" "}
              will 401. <a href="/sign-in" className="text-blue-600 hover:underline font-semibold">Sign in</a> in
              another tab, then reload this page.
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        <nav className="space-y-4 md:max-h-[75vh] md:overflow-y-auto md:sticky md:top-4">
          {grouped.map(({ category, endpoints }) => (
            <div key={category}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{category}</p>
              <ul className="space-y-0.5">
                {endpoints.map((ep) => (
                  <li key={ep.id}>
                    <button
                      onClick={() => setSelectedId(ep.id)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-sm flex items-center gap-2 ${
                        ep.id === selectedId ? "bg-blue-50 text-blue-900" : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${METHOD_COLORS[ep.method]}`}>{ep.method}</span>
                      <span className="truncate">{ep.summary}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <EndpointPanel key={selected.id} endpoint={selected} />
      </div>
    </div>
  );
}

function EndpointPanel({ endpoint }: { endpoint: ApiEndpoint }) {
  const [pathValues, setPathValues] = useState<Record<string, string>>(
    () => Object.fromEntries((endpoint.pathParams ?? []).map((p) => [p.name, p.example ?? ""]))
  );
  const [queryValues, setQueryValues] = useState<Record<string, { value: string; enabled: boolean }>>(
    () => Object.fromEntries((endpoint.queryParams ?? []).map((p) => [p.name, { value: p.example ?? "", enabled: !!p.required }]))
  );
  const [bodyText, setBodyText] = useState(
    endpoint.requestBodyExample !== undefined ? JSON.stringify(endpoint.requestBodyExample, null, 2) : ""
  );
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ status: number; ok: boolean; body: string; ms: number } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const resolvedPath = fillPath(endpoint.path, pathValues) + buildQueryString(queryValues);
  const isInternal = endpoint.auth === "internal";

  async function send() {
    setSending(true);
    setSendError(null);
    setResult(null);
    const started = performance.now();
    try {
      let bodyJson: unknown = undefined;
      if (bodyText.trim()) {
        try {
          bodyJson = JSON.parse(bodyText);
        } catch {
          setSendError("Request body is not valid JSON.");
          setSending(false);
          return;
        }
      }

      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const headers: Record<string, string> = { Accept: "application/json" };
      if (bodyJson !== undefined) headers["Content-Type"] = "application/json";
      if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`;

      const res = await fetch(resolvedPath, {
        method: endpoint.method,
        headers,
        body: bodyJson !== undefined ? JSON.stringify(bodyJson) : undefined,
      });
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        // not JSON — show raw text
      }
      setResult({ status: res.status, ok: res.ok, body: pretty, ms: Math.round(performance.now() - started) });
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSending(false);
    }
  }

  const curl = useMemo(() => {
    const parts = [`curl -X ${endpoint.method}`, `'${resolvedPath}'`, `-H 'Authorization: Bearer <your-access-token>'`];
    if (bodyText.trim()) {
      parts.push(`-H 'Content-Type: application/json'`);
      parts.push(`-d '${bodyText.replace(/'/g, "'\\''")}'`);
    }
    return parts.join(" \\\n  ");
  }, [endpoint.method, resolvedPath, bodyText]);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold px-2 py-1 rounded ${METHOD_COLORS[endpoint.method]}`}>{endpoint.method}</span>
          <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{endpoint.path}</code>
          <span className={`text-xs font-semibold px-2 py-1 rounded ${AUTH_COLORS[endpoint.auth]}`}>{AUTH_LABELS[endpoint.auth]}</span>
        </div>
        <h2 className="text-lg font-bold mt-2">{endpoint.summary}</h2>
        {endpoint.description && <p className="text-sm text-gray-600 mt-1">{endpoint.description}</p>}
        {endpoint.notes && <p className="text-xs text-gray-500 mt-1 italic">{endpoint.notes}</p>}
      </div>

      {isInternal ? (
        <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
          This endpoint isn&apos;t meant to be called from a browser session (cron secret / webhook signature
          required) — documented here for completeness, not testable from this page.
        </p>
      ) : (
        <>
          {endpoint.pathParams && endpoint.pathParams.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Path params</p>
              <div className="space-y-2">
                {endpoint.pathParams.map((p) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <label className="text-sm font-mono text-gray-600 w-28 shrink-0">{p.name}</label>
                    <input
                      value={pathValues[p.name] ?? ""}
                      onChange={(e) => setPathValues((prev) => ({ ...prev, [p.name]: e.target.value }))}
                      className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {endpoint.queryParams && endpoint.queryParams.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Query params</p>
              <div className="space-y-1.5">
                {endpoint.queryParams.map((p) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={queryValues[p.name]?.enabled ?? false}
                      onChange={(e) =>
                        setQueryValues((prev) => ({ ...prev, [p.name]: { value: prev[p.name]?.value ?? "", enabled: e.target.checked } }))
                      }
                    />
                    <label className="text-sm font-mono text-gray-600 w-28 shrink-0">
                      {p.name}
                      {p.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      value={queryValues[p.name]?.value ?? ""}
                      onChange={(e) =>
                        setQueryValues((prev) => ({ ...prev, [p.name]: { value: e.target.value, enabled: prev[p.name]?.enabled ?? false } }))
                      }
                      placeholder={p.description}
                      className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Resolved URL: <span className="font-mono normal-case text-gray-600">{resolvedPath}</span>
            </p>
          </div>

          {endpoint.requestBodyExample !== undefined && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Request body (editable JSON)</p>
              <textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                rows={Math.min(18, Math.max(6, bodyText.split("\n").length))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-mono bg-gray-50"
                spellCheck={false}
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={send}
              disabled={sending}
              className="rounded-lg bg-blue-600 text-white text-sm font-semibold px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send Request"}
            </button>
            {sendError && <span className="text-sm text-red-600">{sendError}</span>}
          </div>

          {result && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Response — <span className={result.ok ? "text-emerald-600" : "text-red-600"}>{result.status}</span>{" "}
                <span className="text-gray-400 normal-case">({result.ms}ms)</span>
              </p>
              <pre className="w-full rounded-lg border border-gray-200 bg-gray-900 text-gray-100 px-3 py-2 text-xs overflow-x-auto max-h-96">
                {result.body || "(empty response body)"}
              </pre>
            </div>
          )}

          {endpoint.responseExample !== undefined && (
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-500 font-semibold">Example response shape</summary>
              <pre className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs overflow-x-auto mt-2">
                {JSON.stringify(endpoint.responseExample, null, 2)}
              </pre>
            </details>
          )}

          <details className="text-sm">
            <summary className="cursor-pointer text-gray-500 font-semibold">cURL equivalent</summary>
            <pre className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs overflow-x-auto mt-2 whitespace-pre-wrap">
              {curl}
            </pre>
          </details>
        </>
      )}
    </div>
  );
}
