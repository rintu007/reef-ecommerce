const LABELS: Record<string, string> = {
  "/": "Home",
  "/browse": "Browse",
  "/messages": "Messages",
  "/orders": "Orders",
  "/learn": "Learn",
  "/profile": "Profile",
  "/services": "Services",
  "/sell": "Sell",
};

/** Mirrors legacy's path->label mapping (exact matches + a few known prefixes). */
function labelFor(path: string): string {
  if (LABELS[path]) return LABELS[path];
  if (path.startsWith("/listings/")) return "Listing Detail";
  if (path.startsWith("/sellers/")) return "Seller Storefront";
  if (path.startsWith("/browse?") || path.startsWith("/browse/")) return "Browse (filtered)";
  return path;
}

export function TopPagesList({ pages }: { pages: { path: string; count: number }[] }) {
  if (pages.length === 0) return <p className="text-sm text-gray-400 text-center py-6">No visitor data yet.</p>;
  const max = Math.max(...pages.map((p) => p.count));

  return (
    <div className="space-y-2">
      {pages.map((p) => (
        <div key={p.path}>
          <div className="flex justify-between text-xs text-gray-600 mb-0.5">
            <span>{labelFor(p.path)}</span>
            <span className="font-semibold">{p.count}</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100">
            <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${(p.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
