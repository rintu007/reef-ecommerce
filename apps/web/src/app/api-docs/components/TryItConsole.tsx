"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Loader2, Play, ShieldOff } from "lucide-react";
import type { ApiEndpoint } from "@/lib/api-catalog";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { JsonBlock } from "./JsonBlock";
import { StatusPill } from "./badges";

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

interface RequestResult {
  status: number;
  ok: boolean;
  body: string;
  headers: [string, string][];
  ms: number;
}

export function TryItConsole({ endpoint }: { endpoint: ApiEndpoint }) {
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
  const [result, setResult] = useState<RequestResult | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [responseTab, setResponseTab] = useState<"body" | "headers">("body");
  const [curlCopied, setCurlCopied] = useState(false);

  const resolvedPath = fillPath(endpoint.path, pathValues) + buildQueryString(queryValues);
  const isInternal = endpoint.auth === "internal";

  async function send() {
    setSending(true);
    setSendError(null);
    setResult(null);
    setResponseTab("body");
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
      const headerEntries: [string, string][] = [];
      res.headers.forEach((value, key) => headerEntries.push([key, value]));
      setResult({ status: res.status, ok: res.ok, body: pretty, headers: headerEntries, ms: Math.round(performance.now() - started) });
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

  async function copyCurl() {
    try {
      await navigator.clipboard.writeText(curl);
      setCurlCopied(true);
      setTimeout(() => setCurlCopied(false), 1500);
    } catch {
      // no-op
    }
  }

  if (isInternal) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 flex gap-2">
        <ShieldOff className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
        <p>
          This endpoint isn&apos;t callable from a browser session — it requires a cron secret or a verified Stripe
          webhook signature. Documented for completeness, not testable from this console.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
        <h3 className="text-sm font-bold text-slate-700">Try it</h3>
      </div>

      <div className="p-4 space-y-4">
        {endpoint.pathParams && endpoint.pathParams.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Path params</p>
            {endpoint.pathParams.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <label className="text-xs font-mono text-slate-500 w-24 shrink-0">{p.name}</label>
                <input
                  value={pathValues[p.name] ?? ""}
                  onChange={(e) => setPathValues((prev) => ({ ...prev, [p.name]: e.target.value }))}
                  className="flex-1 min-w-0 rounded-md border border-slate-200 px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            ))}
          </div>
        )}

        {endpoint.queryParams && endpoint.queryParams.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Query params</p>
            {endpoint.queryParams.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={queryValues[p.name]?.enabled ?? false}
                  onChange={(e) =>
                    setQueryValues((prev) => ({ ...prev, [p.name]: { value: prev[p.name]?.value ?? "", enabled: e.target.checked } }))
                  }
                  className="shrink-0"
                />
                <label className="text-xs font-mono text-slate-500 w-24 shrink-0 truncate">
                  {p.name}
                  {p.required && <span className="text-rose-500">*</span>}
                </label>
                <input
                  value={queryValues[p.name]?.value ?? ""}
                  onChange={(e) =>
                    setQueryValues((prev) => ({ ...prev, [p.name]: { value: e.target.value, enabled: prev[p.name]?.enabled ?? false } }))
                  }
                  placeholder={p.description}
                  className="flex-1 min-w-0 rounded-md border border-slate-200 px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            ))}
          </div>
        )}

        <div className="rounded-md bg-slate-50 border border-slate-200 px-2.5 py-1.5">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Resolved URL</p>
          <p className="text-xs font-mono text-slate-700 break-all">{resolvedPath}</p>
        </div>

        {endpoint.requestBodyExample !== undefined && (
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Request body</p>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={Math.min(16, Math.max(6, bodyText.split("\n").length))}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 text-slate-100 px-3 py-2 text-[12.5px] font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              spellCheck={false}
            />
          </div>
        )}

        <button
          onClick={send}
          disabled={sending}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-900 text-white text-sm font-semibold py-2.5 hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          {sending ? "Sending…" : "Send request"}
        </button>
        {sendError && <p className="text-sm text-rose-600">{sendError}</p>}

        {result && (
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2 pt-3">
              <StatusPill status={result.status} />
              <span className="text-xs text-slate-400">{result.ms}ms</span>
              <div className="ml-auto flex rounded-md border border-slate-200 overflow-hidden text-xs">
                <button
                  onClick={() => setResponseTab("body")}
                  className={`px-2.5 py-1 font-semibold ${responseTab === "body" ? "bg-slate-900 text-white" : "bg-white text-slate-500"}`}
                >
                  Body
                </button>
                <button
                  onClick={() => setResponseTab("headers")}
                  className={`px-2.5 py-1 font-semibold ${responseTab === "headers" ? "bg-slate-900 text-white" : "bg-white text-slate-500"}`}
                >
                  Headers ({result.headers.length})
                </button>
              </div>
            </div>
            {responseTab === "body" ? (
              <JsonBlock code={result.body || "(empty response body)"} maxHeight="20rem" />
            ) : (
              <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {result.headers.map(([k, v]) => (
                  <div key={k} className="px-3 py-1.5 text-xs flex gap-2">
                    <span className="font-mono text-slate-500 shrink-0">{k}:</span>
                    <span className="font-mono text-slate-700 break-all">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <details className="text-sm pt-1">
          <summary className="cursor-pointer text-slate-500 font-semibold text-xs uppercase tracking-wide flex items-center gap-1.5">
            cURL equivalent
          </summary>
          <div className="relative mt-2">
            <pre className="w-full rounded-lg border border-slate-800 bg-slate-950 text-slate-100 px-3 py-2 text-[11.5px] font-mono overflow-x-auto whitespace-pre-wrap">
              {curl}
            </pre>
            <button
              onClick={copyCurl}
              className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-slate-800/80 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700"
            >
              {curlCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {curlCopied ? "Copied" : "Copy"}
            </button>
          </div>
        </details>
      </div>
    </div>
  );
}
