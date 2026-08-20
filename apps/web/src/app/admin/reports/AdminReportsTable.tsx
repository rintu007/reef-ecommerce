"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getAdminConversation, listAdminReports, updateReportStatus, type AdminMessage, type AdminReport, type ReportStatus } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";
import { markAdminBadgeSeen } from "@/components/admin/NewSinceBadge";

const STATUS_TABS: { value: ReportStatus | "all"; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
  { value: "all", label: "All" },
];

export function AdminReportsTable() {
  const [status, setStatus] = useState<ReportStatus | "all">("pending");
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<AdminMessage[]>([]);
  const [conversationLoading, setConversationLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { reports } = await listAdminReports(apiClient, {
        status: status === "all" ? undefined : status,
        limit: 100,
      });
      setReports(reports);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      listAdminReports(apiClient, { status: "pending", limit: 1 }).then(({ total }) => markAdminBadgeSeen("reports", total));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function setReportStatus(id: string, newStatus: ReportStatus) {
    setBusyId(id);
    try {
      await updateReportStatus(apiClient, id, newStatus);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function toggleConversation(report: AdminReport) {
    if (expandedId === report.id) {
      setExpandedId(null);
      return;
    }
    if (!report.reported_id) return;
    setExpandedId(report.id);
    setConversationLoading(true);
    try {
      const { messages } = await getAdminConversation(apiClient, report.reporter_id, report.reported_id);
      setConversation(messages);
    } finally {
      setConversationLoading(false);
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              status === tab.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : reports.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">No reports in this view.</p>
      ) : (
        <div className="space-y-2">
          {reports.map((report) => (
            <div key={report.id} className="rounded-xl border border-gray-200 p-3 bg-white">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 uppercase font-semibold">
                    {report.report_type} report · {report.status}
                  </p>
                  <p className="text-sm font-semibold mt-1">{report.reason}</p>
                  {report.details && <p className="text-sm text-gray-600 mt-1">{report.details}</p>}
                  <p className="text-xs text-gray-500 mt-2">
                    Reported by {report.reporter?.display_name ?? report.reporter?.email ?? "unknown"}
                    {report.reported && (
                      <>
                        {" "}
                        about {report.reported.display_name ?? report.reported.email}
                      </>
                    )}
                    {report.listing && (
                      <>
                        {" "}
                        ·{" "}
                        <Link href={`/listings/${report.listing.id}`} className="hover:underline">
                          {report.listing.title}
                        </Link>
                      </>
                    )}
                  </p>
                  {report.reported_id && (
                    <button onClick={() => toggleConversation(report)} className="text-xs text-blue-600 hover:underline mt-1">
                      {expandedId === report.id ? "Hide conversation" : "View conversation"}
                    </button>
                  )}
                </div>
                <div className="flex gap-2 shrink-0 text-sm font-semibold">
                  {report.status !== "resolved" && (
                    <button
                      onClick={() => setReportStatus(report.id, "resolved")}
                      disabled={busyId === report.id}
                      className="text-emerald-600 hover:underline disabled:opacity-50"
                    >
                      Resolve
                    </button>
                  )}
                  {report.status !== "dismissed" && (
                    <button
                      onClick={() => setReportStatus(report.id, "dismissed")}
                      disabled={busyId === report.id}
                      className="text-gray-500 hover:underline disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>

              {expandedId === report.id && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Conversation between reporter and reported user</p>
                  {conversationLoading ? (
                    <p className="text-xs text-gray-400">Loading…</p>
                  ) : conversation.length === 0 ? (
                    <p className="text-xs text-gray-400">No messages between these two users.</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {conversation.map((m) => (
                        <div key={m.id} className="text-xs">
                          <span className="font-semibold text-gray-700">{m.sender_display_name ?? m.sender_email ?? m.sender_id}</span>
                          <span className="text-gray-400"> · {new Date(m.created_at).toLocaleString()}</span>
                          <p className="text-gray-600 mt-0.5">{m.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
