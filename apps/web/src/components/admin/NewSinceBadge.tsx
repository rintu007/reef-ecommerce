"use client";

import { useEffect, useState } from "react";
import { listAdminReports, listDoaClaims } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

export const REPORTS_BADGE_KEY = "admin_badge_reports_pending";
export const DOA_CLAIMS_BADGE_KEY = "admin_badge_doa_claims_pending";

type BadgeKind = "reports" | "doa_claims";

async function fetchPendingCount(kind: BadgeKind): Promise<number> {
  if (kind === "reports") {
    const { total } = await listAdminReports(apiClient, { status: "pending", limit: 1 });
    return total;
  }
  const { total } = await listDoaClaims(apiClient, { status: "pending", limit: 1 });
  return total;
}

function storageKeyFor(kind: BadgeKind): string {
  return kind === "reports" ? REPORTS_BADGE_KEY : DOA_CLAIMS_BADGE_KEY;
}

/**
 * Finding out about a new report or DOA claim meant opening the admin panel
 * and checking — no ping when one arrives. This is the "in-app only" version
 * of that: a purely local (localStorage, no schema change) count of how many
 * pending items showed up since the admin last opened that screen. Clearing
 * it is the visited screen's job (see markAdminBadgeSeen), not this badge's.
 */
export function NewSinceBadge({ kind }: { kind: BadgeKind }) {
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    const storageKey = storageKeyFor(kind);
    fetchPendingCount(kind).then((current) => {
      const lastSeenRaw = localStorage.getItem(storageKey);
      if (lastSeenRaw === null) {
        // First time ever seeing this card — don't alarm with a backlog, just baseline it.
        localStorage.setItem(storageKey, String(current));
        return;
      }
      const lastSeen = Number(lastSeenRaw);
      setNewCount(Math.max(0, current - lastSeen));
    });
  }, [kind]);

  if (newCount === 0) return null;
  return (
    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold ml-2">
      +{newCount}
    </span>
  );
}

/** Called by the pending-items screen itself once it knows the current pending total, so opening it clears the badge. */
export function markAdminBadgeSeen(kind: BadgeKind, currentCount: number) {
  localStorage.setItem(storageKeyFor(kind), String(currentCount));
}
