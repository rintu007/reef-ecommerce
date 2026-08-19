"use client";

import { useCallback, useEffect, useState } from "react";
import { listAdminVisitorLogs, type VisitorLog } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

const PAGE_SIZE = 100;

export function VisitorLogsTable() {
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  const [sessionId, setSessionId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [guestsOnly, setGuestsOnly] = useState(false);

  const load = useCallback(
    async (nextOffset: number, replace: boolean) => {
      setLoading(true);
      try {
        const { logs: page, total } = await listAdminVisitorLogs(apiClient, {
          session_id: sessionId.trim() || undefined,
          user_email: userEmail.trim() || undefined,
          guests_only: guestsOnly || undefined,
          limit: PAGE_SIZE,
          offset: nextOffset,
        });
        setLogs((prev) => (replace ? page : [...prev, ...page]));
        setTotal(total);
        setOffset(nextOffset);
      } finally {
        setLoading(false);
      }
    },
    [sessionId, userEmail, guestsOnly]
  );

  useEffect(() => {
    const timer = setTimeout(() => load(0, true), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, userEmail, guestsOnly]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          placeholder="Session ID"
          className="flex-1 min-w-[160px] rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
        />
        <input
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          placeholder="User email contains…"
          className="flex-1 min-w-[160px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm text-gray-700 px-1">
          <input type="checkbox" checked={guestsOnly} onChange={(e) => setGuestsOnly(e.target.checked)} />
          Guests only
        </label>
      </div>

      <p className="text-xs text-gray-400 mb-2">{total} matching event{total === 1 ? "" : "s"}</p>

      {loading && logs.length === 0 ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">No visitor events match this filter.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase">
                <th className="px-3 py-2 font-semibold">Path</th>
                <th className="px-3 py-2 font-semibold">Visitor</th>
                <th className="px-3 py-2 font-semibold">Session</th>
                <th className="px-3 py-2 font-semibold whitespace-nowrap">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{log.path}</td>
                  <td className="px-3 py-2 text-xs">
                    {log.is_guest ? <span className="text-gray-400">Guest</span> : log.user_email ?? <span className="text-gray-400">Member</span>}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-gray-400" title={log.session_id}>
                    {log.session_id.slice(0, 10)}…
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {logs.length < total && (
        <button
          onClick={() => load(offset + PAGE_SIZE, false)}
          disabled={loading}
          className="mt-4 w-full py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
