"use client";

import { useEffect, useState } from "react";
import { BookOpen, CircleUserRound, ExternalLink } from "lucide-react";
import { API_CATALOG } from "@/lib/api-catalog";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Sidebar } from "./components/Sidebar";
import { EndpointDocs } from "./components/EndpointDocs";
import { TryItConsole } from "./components/TryItConsole";

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

function SessionBadge({ session }: { session: SessionInfo }) {
  if (session.loading) {
    return <span className="text-xs text-slate-400">Checking session…</span>;
  }
  if (!session.email) {
    return (
      <a
        href="/sign-in"
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 rounded-full px-3 py-1.5"
      >
        <CircleUserRound className="w-3.5 h-3.5" />
        Not signed in — Sign in
      </a>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 ring-1 ring-emerald-200 rounded-full px-3 py-1.5">
      <CircleUserRound className="w-3.5 h-3.5" />
      {session.email}
      <span className="text-emerald-500 font-normal">· {session.role ?? "user"}</span>
    </span>
  );
}

export function ApiDocsExplorer() {
  const [selectedId, setSelectedId] = useState<string>(API_CATALOG[0].id);
  const session = useSessionBanner();
  const selected = API_CATALOG.find((e) => e.id === selectedId) ?? API_CATALOG[0];

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-none">Reef Market API Reference</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">{API_CATALOG.length} endpoints · live against this deployment</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <SessionBadge session={session} />
            <a
              href="/admin"
              className="hidden sm:flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600"
            >
              Admin <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-[1600px] w-full mx-auto grid grid-cols-1 md:grid-cols-[260px_1fr] lg:grid-cols-[260px_1fr_420px]">
        <aside className="md:border-r border-slate-200 bg-white md:h-[calc(100vh-57px)] md:sticky md:top-[57px]">
          <Sidebar selectedId={selectedId} onSelect={setSelectedId} />
        </aside>

        <main className="px-4 md:px-8 py-6 min-w-0">
          <EndpointDocs key={selected.id} endpoint={selected} />
        </main>

        <aside className="px-4 md:px-6 pb-8 md:pt-6 lg:border-l border-slate-200 lg:h-[calc(100vh-57px)] lg:sticky lg:top-[57px] lg:overflow-y-auto">
          <TryItConsole key={selected.id} endpoint={selected} />
        </aside>
      </div>
    </div>
  );
}
