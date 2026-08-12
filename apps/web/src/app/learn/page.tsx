import { queryHelpContent } from "@/lib/server/help-content";
import { LearnBrowser } from "./LearnBrowser";

/** Legacy parity: legacy/vite-app/src/pages/Learn.jsx — web never had a /learn route at all (unlike mobile). */
export default async function LearnPage() {
  const items = await queryHelpContent({});

  return (
    <div>
      <div className="bg-gradient-to-br from-blue-600 to-blue-900 px-6 py-10 text-center">
        <p className="text-3xl text-white mb-1">≋</p>
        <h1 className="text-3xl font-extrabold text-white">Learn &amp; Explore</h1>
        <p className="text-white/80 text-sm mt-1">Guides, tips &amp; care info for hobbyists</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 mt-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-3">
          <span className="text-xl">🚧</span>
          <div>
            <p className="text-sm font-bold text-amber-900">We&apos;re building our help library!</p>
            <p className="text-xs text-amber-700 mt-0.5">More care guides, videos &amp; tips are coming soon. Check back regularly for new content.</p>
          </div>
        </div>
      </div>

      <LearnBrowser items={items} />
    </div>
  );
}
