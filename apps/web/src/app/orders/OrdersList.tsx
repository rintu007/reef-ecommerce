"use client";

import { useState } from "react";
import Link from "next/link";
import type { Order } from "@reef-market/shared";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";

export function OrdersList({ purchases, sales }: { purchases: Order[]; sales: Order[] }) {
  const [tab, setTab] = useState<"purchases" | "sales">("purchases");
  const orders = tab === "purchases" ? purchases : sales;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("purchases")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            tab === "purchases" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          Purchases ({purchases.length})
        </button>
        <button
          onClick={() => setTab("sales")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            tab === "sales" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          Sales ({sales.length})
        </button>
      </div>

      {orders.length === 0 ? (
        <p className="text-gray-500 text-center py-16">
          No {tab === "purchases" ? "purchases" : "sales"} yet.
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center gap-4 rounded-xl border border-gray-200 p-3 bg-white hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                {order.listing_photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={order.listing_photo} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{order.listing_title}</p>
                <p className="text-sm text-gray-500">
                  Qty {order.quantity} · ${order.total_charged?.toFixed(2) ?? order.price.toFixed(2)}
                </p>
              </div>
              <OrderStatusBadge status={order.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
