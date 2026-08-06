"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Tokenizes an already-JSON.stringify'd string into colored spans. Input is
 * HTML-escaped before any markup is added, so this is safe to render even
 * when the JSON contains server-echoed user content (titles, emails, etc.).
 */
function highlight(json: string): string {
  const escaped = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let className = "text-sky-300"; // number
      if (/^"/.test(match)) {
        className = /:$/.test(match) ? "text-violet-300" : "text-emerald-300"; // key vs. string value
      } else if (/true|false/.test(match)) {
        className = "text-amber-300";
      } else if (/null/.test(match)) {
        className = "text-rose-300";
      }
      return `<span class="${className}">${match}</span>`;
    }
  );
}

export function JsonBlock({ code, maxHeight = "24rem" }: { code: string; maxHeight?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable — silently no-op
    }
  }

  return (
    <div className="relative group rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
      <button
        type="button"
        onClick={copy}
        className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-md bg-slate-800/80 px-2 py-1 text-[11px] font-medium text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-700"
        aria-label="Copy to clipboard"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="overflow-auto p-3 text-[12.5px] leading-relaxed font-mono" style={{ maxHeight }}>
        <code dangerouslySetInnerHTML={{ __html: highlight(code) }} />
      </pre>
    </div>
  );
}
