"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { listAdminReports, updateReportStatus, type AdminReport, type ReportStatus } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

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
    load();
  }, [load]);

  async function setReportStatus(id: string, newStatus: ReportStatus) {
    setBusyId(id);
    try {
      await updateReportStatus(apiClient, id, newStatus);
      await load();
    } finally {
      setBusyId(null);
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
