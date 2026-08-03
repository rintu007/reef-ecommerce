import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { getOrderById } from "@/lib/server/orders";
import { OrderActions } from "./OrderActions";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  if (!user) redirect(`/sign-in?next=/orders/${id}`);

  const order = await getOrderById(id, user);
  if (!order) notFound();

  const role: "buyer" | "seller" | "admin" =
    user.role === "admin" ? "admin" : order.buyer_id === user.id ? "buyer" : "seller";

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Order Details</h1>

      <div className="rounded-xl border border-gray-200 p-4 bg-white space-y-3">
        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
            {order.listing_photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={order.listing_photo} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div>
            {order.listing_id ? (
              <Link href={`/listings/${order.listing_id}`} className="font-semibold text-sm hover:underline">
                {order.listing_title}
              </Link>
            ) : (
              <p className="font-semibold text-sm">{order.listing_title}</p>
            )}
            <p className="text-sm text-gray-500">Qty {order.quantity}</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-y-1 text-sm">
          <dt className="text-gray-500">Status</dt>
          <dd className="font-semibold">{order.status.replace("_", " ")}</dd>
          <dt className="text-gray-500">Total charged</dt>
          <dd>${order.total_charged?.toFixed(2) ?? "—"}</dd>
          <dt className="text-gray-500">Delivery</dt>
          <dd>{order.shipping_method === "shipping" ? "Shipping" : "Local pickup"}</dd>
          {order.tracking_number && (
            <>
              <dt className="text-gray-500">Tracking</dt>
              <dd>
                {order.tracking_number}
                {order.carrier ? ` (${order.carrier})` : ""}
              </dd>
            </>
          )}
          {order.pickup_address && (
            <>
              <dt className="text-gray-500">Pickup address</dt>
              <dd>{order.pickup_address}</dd>
            </>
          )}
          {order.pickup_time && (
            <>
              <dt className="text-gray-500">Pickup time</dt>
              <dd>{order.pickup_time}</dd>
            </>
          )}
        </dl>

        <OrderActions order={order} role={role} />
      </div>
    </div>
  );
}
