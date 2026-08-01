import { useState } from "react";
import { Flag, UserX, ChevronRight, X, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ReportBlockSheet({ listing, onClose, onBlocked }) {
  const [view, setView] = useState("menu"); // menu | report | block | done_report | done_block
  const [reportReason, setReportReason] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [loading, setLoading] = useState(false);

  const REPORT_REASONS = [
    "Misleading or inaccurate listing",
    "Suspected scam or fraud",
    "Inappropriate or offensive content",
    "Sick or misrepresented animal",
    "Spam or duplicate listing",
    "Other",
  ];

  const handleReport = async () => {
    if (!reportReason) return;
    setLoading(true);
    await base44.entities.Report.create({
      report_type: "listing",
      listing_id: listing.id,
      reported_email: listing.seller_email,
      reporter_email: (await base44.auth.me())?.email || "anonymous",
      reason: reportReason,
      details: `Listing: ${listing.title}`,
    });
    await base44.integrations.Core.SendEmail({
      to: "Andrew@freedomrisingnow.org",
      subject: `[Reef Market] New Listing Report`,
      body: `A listing has been reported.\n\nListing: ${listing.title} (ID: ${listing.id})\nSeller: ${listing.seller_email}\nReason: ${reportReason}\n\nPlease review within 24 hours.`,
    });
    setView("done_report");
    setLoading(false);
  };

  const handleBlock = async () => {
    setLoading(true);
    const me = await base44.auth.me();
    await base44.entities.BlockedUser.create({
      blocker_email: me.email,
      blocked_email: listing.seller_email,
      reason: blockReason || "No reason provided",
    });
    await base44.integrations.Core.SendEmail({
      to: "Andrew@freedomrisingnow.org",
      subject: `[Reef Market] User Blocked — Review Required`,
      body: `A user has been blocked.\n\nBlocked by: ${me.email}\nBlocked user: ${listing.seller_email}\nReason: ${blockReason || "No reason provided"}\n\nThis may indicate abusive behavior. Please review within 24 hours.`,
    });
    setView("done_block");
    setLoading(false);
    onBlocked?.(listing.seller_email);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-end" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 w-full max-w-lg mx-auto rounded-t-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white">
            {view === "menu" && "Report or Block"}
            {view === "report" && "Report Listing"}
            {view === "block" && "Block Seller"}
            {view === "done_report" && "Report Submitted"}
            {view === "done_block" && "User Blocked"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {view === "menu" && (
          <div className="space-y-2">
            <button
              onClick={() => setView("report")}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="flex items-center gap-3">
                <Flag className="w-5 h-5 text-orange-500" />
                <div className="text-left">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">Report Listing</p>
                  <p className="text-xs text-gray-500">Flag objectionable or misleading content</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => setView("block")}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="flex items-center gap-3">
                <UserX className="w-5 h-5 text-red-500" />
                <div className="text-left">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">Block Seller</p>
                  <p className="text-xs text-gray-500">Hide this seller's listings from your feed</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}

        {view === "report" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Why are you reporting this listing?</p>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReportReason(r)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-colors ${reportReason === r ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400 font-medium" : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"}`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              onClick={handleReport}
              disabled={!reportReason || loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-semibold rounded-xl py-3 text-sm"
            >
              {loading ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        )}

        {view === "block" && (
          <div className="space-y-3">
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">Block {listing.seller_name || listing.seller_email}?</p>
              </div>
              <p className="text-xs text-red-600 dark:text-red-400">Their listings will be removed from your feed immediately. Reef Market will be notified for review.</p>
            </div>
            <textarea
              placeholder="Reason for blocking (optional)..."
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <button
              onClick={handleBlock}
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-semibold rounded-xl py-3 text-sm"
            >
              {loading ? "Blocking..." : "Block Seller"}
            </button>
          </div>
        )}

        {view === "done_report" && (
          <div className="text-center py-4 space-y-2">
            <span className="text-4xl">✅</span>
            <p className="font-semibold text-gray-900 dark:text-white">Report Received</p>
            <p className="text-sm text-gray-500">Thank you. Our team will review this within 24 hours and take action if needed.</p>
            <button onClick={onClose} className="mt-4 w-full bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-semibold rounded-xl py-3 text-sm">Done</button>
          </div>
        )}

        {view === "done_block" && (
          <div className="text-center py-4 space-y-2">
            <span className="text-4xl">🚫</span>
            <p className="font-semibold text-gray-900 dark:text-white">Seller Blocked</p>
            <p className="text-sm text-gray-500">This seller's content has been removed from your feed. Reef Market has been notified.</p>
            <button onClick={onClose} className="mt-4 w-full bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-semibold rounded-xl py-3 text-sm">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}