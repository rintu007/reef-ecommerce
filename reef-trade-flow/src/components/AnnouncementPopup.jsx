import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { X, Megaphone } from "lucide-react";

export default function AnnouncementPopup() {
  const [announcement, setAnnouncement] = useState(null);
  const { isGuest } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const all = await base44.entities.Announcement.filter({ is_active: true }, "-created_date", 1);
        const latest = all[0];
        if (!latest) return;
        // Check guest visibility
        if (isGuest && !latest.show_to_guests) return;
        // Check view count
        const maxViews = latest.max_views ?? 1;
        const viewKey = `rm_ann_views_${latest.id}`;
        const currentViews = parseInt(localStorage.getItem(viewKey) || "0", 10);
        if (maxViews > 0 && currentViews >= maxViews) return;
        setAnnouncement(latest);
      } catch { /* silently fail */ }
    };
    load();
  }, [isGuest]);

  const dismiss = () => {
    if (announcement) {
      const viewKey = `rm_ann_views_${announcement.id}`;
      const currentViews = parseInt(localStorage.getItem(viewKey) || "0", 10);
      localStorage.setItem(viewKey, String(currentViews + 1));
    }
    setAnnouncement(null);
  };

  if (!announcement) return null;

  return (
    <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-sm">Reef Market Announcement</span>
          </div>
          <button onClick={dismiss} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          <h2 className="font-bold text-base mb-2">{announcement.subject}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{announcement.message}</p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <Button className="w-full rounded-xl" onClick={dismiss}>
            Got it!
          </Button>
        </div>
      </div>
    </div>
  );
}