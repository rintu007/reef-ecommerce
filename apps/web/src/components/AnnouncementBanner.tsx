"use client";

import { useEffect, useState } from "react";
import { getActiveAnnouncement, type Announcement } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

const viewKey = (id: string) => `announcement-views-${id}`;

/**
 * No server-side per-user view-cap tracking table exists (announcements.max_views
 * has nothing to count against) — view counts are tracked client-side instead.
 */
export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    getActiveAnnouncement(apiClient)
      .then(({ announcement }) => {
        if (!announcement) return;
        const views = Number(localStorage.getItem(viewKey(announcement.id)) ?? "0");
        if (views >= announcement.max_views) return;
        localStorage.setItem(viewKey(announcement.id), String(views + 1));
        setAnnouncement(announcement);
      })
      .catch(() => {});
  }, []);

  if (!announcement) return null;

  return (
    <div className="bg-blue-600 text-white px-4 py-3 flex items-start gap-3">
      <div className="flex-1">
        <p className="text-sm font-bold">{announcement.subject}</p>
        <p className="text-xs text-white/80 mt-0.5">{announcement.message}</p>
      </div>
      <button onClick={() => setAnnouncement(null)} className="text-white/80 hover:text-white text-lg leading-none">
        ×
      </button>
    </div>
  );
}
