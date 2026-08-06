"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const ORDER_COLORS = ["#059669", "#d97706"];
const LISTING_COLORS = ["#2563eb", "#059669", "#dc2626"];

export function OrderStatusPie({ completed, pending }: { completed: number; pending: number }) {
  const data = [
    { name: "Completed", value: completed },
    { name: "Pending", value: pending },
  ];
  if (completed + pending === 0) return <p className="text-sm text-gray-400 text-center py-8">No orders yet.</p>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={ORDER_COLORS[i]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ListingStatusPie({ active, sold, removed }: { active: number; sold: number; removed: number }) {
  const data = [
    { name: "Active", value: active },
    { name: "Sold", value: sold },
    { name: "Removed", value: removed },
  ];
  if (active + sold + removed === 0) return <p className="text-sm text-gray-400 text-center py-8">No listings yet.</p>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={LISTING_COLORS[i]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
