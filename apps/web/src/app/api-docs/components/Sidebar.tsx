"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { API_CATALOG, CATEGORY_ORDER, type ApiEndpoint } from "@/lib/api-catalog";
import { MethodBadge } from "./badges";

export function Sidebar({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const term = query.trim().toLowerCase();
    const matches = (ep: ApiEndpoint) =>
      !term ||
      ep.summary.toLowerCase().includes(term) ||
      ep.path.toLowerCase().includes(term) ||
      ep.method.toLowerCase().includes(term);

    const byCategory = new Map<string, ApiEndpoint[]>();
    for (const ep of API_CATALOG) {
      if (!matches(ep)) continue;
      if (!byCategory.has(ep.category)) byCategory.set(ep.category, []);
      byCategory.get(ep.category)!.push(ep);
    }
    return CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((c) => ({ category: c, endpoints: byCategory.get(c)! }));
  }, [query]);

  const totalShown = grouped.reduce((n, g) => n + g.endpoints.length, 0);

  return (
    <nav className="flex flex-col h-full">
      <div className="p-3 border-b border-slate-200">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search endpoints…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5 px-0.5">
          {totalShown} of {API_CATALOG.length} endpoints
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
        {grouped.length === 0 && <p className="text-sm text-slate-400 px-2 py-4 text-center">No endpoints match &quot;{query}&quot;.</p>}
        {grouped.map(({ category, endpoints }) => (
          <div key={category}>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">{category}</p>
            <ul className="space-y-0.5">
              {endpoints.map((ep) => {
                const active = ep.id === selectedId;
                return (
                  <li key={ep.id}>
                    <button
                      onClick={() => onSelect(ep.id)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-sm flex items-start gap-2 border-l-2 transition-colors ${
                        active
                          ? "bg-blue-50 border-blue-500 text-blue-950"
                          : "border-transparent hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className="shrink-0 mt-0.5">
                        <MethodBadge method={ep.method} />
                      </span>
                      <span className="truncate leading-snug">{ep.summary}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
