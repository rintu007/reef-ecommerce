import { Eye, Globe, TrendingUp, Calendar, UserCheck, UserX } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";

export default function VisitorStatsSection({ visitors }) {
  if (!visitors) return null;

  const { total, uniqueSessions, guestSessions, authSessions, today, last7Days, last30Days, topPages, visitsByDay } = visitors;

  const PAGE_LABELS = {
    "/": "Home",
    "/browse": "Browse",
    "/messages": "Messages",
    "/orders": "Orders",
    "/learn": "Learn",
    "/profile": "Profile",
    "/services": "Services",
    "/search": "Search",
    "/sell": "Sell",
    "/seller-dashboard": "Seller Dashboard",
  };
  const labelPath = (path) => {
    if (path.startsWith("/listing/")) return "Listing Detail";
    if (path.startsWith("/seller/")) return "Seller Storefront";
    if (path.startsWith("/category/")) return "Category Page";
    return PAGE_LABELS[path] || path;
  };

  return (
    <div className="space-y-3 mt-4">
      <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
        <Globe className="w-4 h-4 text-primary" /> Visitor Traffic
      </h3>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground">Total Page Views</p>
          </div>
          <p className="text-2xl font-bold">{total.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-emerald-500" />
            <p className="text-xs text-muted-foreground">Unique Sessions</p>
          </div>
          <p className="text-2xl font-bold">{uniqueSessions.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-muted-foreground">Today</p>
          </div>
          <p className="text-2xl font-bold">{today.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-accent" />
            <p className="text-xs text-muted-foreground">Last 7 Days</p>
          </div>
          <p className="text-2xl font-bold">{last7Days.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-muted-foreground">Signed-In Sessions</p>
          </div>
          <p className="text-2xl font-bold">{(authSessions ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <UserX className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Guest Sessions</p>
          </div>
          <p className="text-2xl font-bold">{(guestSessions ?? 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Daily chart */}
      {visitsByDay && visitsByDay.length > 1 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3">Views per Day (Last 30 Days)</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={visitsByDay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9 }}
                tickFormatter={(d) => { try { return format(parseISO(d), "M/d"); } catch { return d; } }}
                interval={Math.ceil(visitsByDay.length / 7) - 1}
              />
              <Tooltip
                labelFormatter={(d) => { try { return format(parseISO(d), "MMM d, yyyy"); } catch { return d; } }}
                formatter={(v) => [v, "Views"]}
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top pages */}
      {topPages && topPages.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3">Top Pages</p>
          <div className="space-y-2">
            {topPages.map(({ path, count }) => {
              const pct = Math.round((count / total) * 100);
              return (
                <div key={path}>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-xs text-foreground truncate max-w-[70%]">{labelPath(path)}</span>
                    <span className="text-xs font-semibold text-muted-foreground">{count.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="bg-muted rounded-xl p-4 text-center text-sm text-muted-foreground">
          No visitor data yet — visits will appear here as users browse the app.
        </div>
      )}
    </div>
  );
}