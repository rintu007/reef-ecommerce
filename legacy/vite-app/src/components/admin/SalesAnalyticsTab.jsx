import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, TrendingUp, DollarSign, ShoppingBag, CheckCircle } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function SalesAnalyticsTab() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => base44.functions.invoke("getAdminAnalytics", {}),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const data = analytics?.data;
  if (!data) return null;

  const statusData = [
    { name: "Completed", value: data.orders.completed, fill: "#10b981" },
    { name: "Pending", value: data.orders.pending, fill: "#f59e0b" },
  ];

  const listingStatusData = [
    { name: "Active", value: data.listings.active, fill: "#3b82f6" },
    { name: "Sold", value: data.listings.sold, fill: "#10b981" },
    { name: "Removed", value: data.listings.removed, fill: "#ef4444" },
  ];

  return (
    <div className="space-y-6 mt-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </div>
          <p className="text-2xl font-bold">${data.orders.revenue.total.toFixed(2)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="w-4 h-4 text-accent" />
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </div>
          <p className="text-2xl font-bold">{data.orders.total}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <p className="text-2xl font-bold">{data.orders.completed}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-muted-foreground">Avg Order</p>
          </div>
          <p className="text-2xl font-bold">${data.orders.revenue.avg.toFixed(2)}</p>
        </div>
      </div>

      {/* Order Status Distribution */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-4">Order Status</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Listing Status */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-4">Listings</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={listingStatusData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
              {listingStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-4">Revenue by Order Status</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Completed Orders</span>
            <span className="font-semibold">${data.orders.revenue.byStatus.completed.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Pending Orders</span>
            <span className="font-semibold">${data.orders.revenue.byStatus.pending.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Cancelled Orders</span>
            <span className="font-semibold">${data.orders.revenue.byStatus.cancelled.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Orders (30d)</p>
          <p className="text-xl font-bold">{data.recentActivity.ordersLast30Days}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Listings (30d)</p>
          <p className="text-xl font-bold">{data.recentActivity.listingsLast30Days}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">New Users (30d)</p>
          <p className="text-xl font-bold">{data.recentActivity.usersLast30Days}</p>
        </div>
      </div>
    </div>
  );
}