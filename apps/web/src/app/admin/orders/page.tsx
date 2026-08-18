import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { listAllOrders } from "@/lib/server/orders";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";

export default async function AdminOrdersPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "admin") redirect("/browse");

  const orders = await listAllOrders(200);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>

      {orders.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">No orders yet.</p>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 bg-white hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                {order.listing_photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={order.listing_photo} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{order.listing_title}</p>
                <p className="text-xs text-gray-500">
                  ${order.total_charged?.toFixed(2) ?? order.price.toFixed(2)} · Qty {order.quantity}
                </p>
              </div>
              <OrderStatusBadge status={order.status} />
              {order.doa_claim_status === "pending" && (
                <span className="text-xs font-semibold px-2 py-1 rounded-full shrink-0 bg-amber-100 text-amber-800">claim pending</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
