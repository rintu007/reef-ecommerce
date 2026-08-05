"use client";

import { useState } from "react";
import { blockUser, createReport } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

const REPORT_REASONS = [
  "Misleading or inaccurate listing",
  "Suspected scam or fraud",
  "Inappropriate or offensive content",
  "Sick or misrepresented animal",
  "Spam or duplicate listing",
  "Other",
];

type Panel = "menu" | "report" | "block" | "done";

export function ReportBlockButton({
  listingId,
  listingTitle,
  sellerId,
  className,
}: {
  listingId: string;
  listingTitle: string;
  sellerId: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>("menu");
  const [blockReason, setBlockReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function reset() {
    setOpen(false);
    setPanel("menu");
    setBlockReason("");
    setMessage(null);
  }

  async function submitReport(reason: string) {
    setBusy(true);
    try {
      await createReport(apiClient, {
        report_type: "listing",
        listing_id: listingId,
        reported_id: sellerId,
        reason,
        details: `Listing: ${listingTitle}`,
      });
      setMessage("Report submitted. Thanks for letting us know.");
      setPanel("done");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setBusy(false);
    }
  }

  async function submitBlock() {
    setBusy(true);
    try {
      await blockUser(apiClient, { blocked_id: sellerId, reason: blockReason || undefined });
      setMessage("Seller blocked. Their listings are now hidden from Browse.");
      setPanel("done");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to block seller");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Report or block"
        className={
          className ?? "w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-base shadow hover:scale-105 transition-transform"
        }
      >
        🚩
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-gray-200 bg-white shadow-lg p-3 z-10 text-left">
          {panel === "menu" && (
            <div className="space-y-1">
              <button onClick={() => setPanel("report")} className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-gray-50">
                Report Listing
              </button>
              <button onClick={() => setPanel("block")} className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-gray-50">
                Block Seller
              </button>
              <button onClick={reset} className="w-full text-left text-xs px-2 py-1.5 text-gray-400 hover:bg-gray-50 rounded">
                Cancel
              </button>
            </div>
          )}

          {panel === "report" && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 px-2 pb-1">Why are you reporting this listing?</p>
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  disabled={busy}
                  onClick={() => submitReport(reason)}
                  className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  {reason}
                </button>
              ))}
              <button onClick={() => setPanel("menu")} className="w-full text-left text-xs px-2 py-1.5 text-gray-400 hover:bg-gray-50 rounded">
                Back
              </button>
            </div>
          )}

          {panel === "block" && (
            <div className="space-y-2 px-2">
              <p className="text-xs font-semibold text-gray-500">Block this seller? You won&apos;t see their listings in Browse anymore.</p>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Reason (optional)"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={submitBlock}
                  disabled={busy}
                  className="flex-1 rounded-lg bg-red-600 text-white text-xs font-semibold py-1.5 hover:bg-red-700 disabled:opacity-50"
                >
                  {busy ? "Blocking…" : "Block Seller"}
                </button>
                <button onClick={() => setPanel("menu")} className="text-xs text-gray-400 px-2">
                  Back
                </button>
              </div>
            </div>
          )}

          {panel === "done" && (
            <div className="px-2 space-y-2">
              <p className="text-sm text-gray-700">{message}</p>
              <button onClick={reset} className="text-xs font-semibold text-blue-600 hover:underline">
                Close
              </button>
            </div>
          )}

          {message && panel !== "done" && <p className="text-xs text-red-600 px-2 pt-1">{message}</p>}
        </div>
      )}
    </div>
  );
}
