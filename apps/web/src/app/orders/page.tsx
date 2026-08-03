import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { listOrdersForUser } from "@/lib/server/orders";
import { OrdersList } from "./OrdersList";

export default async function OrdersPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");

  const [purchases, sales] = await Promise.all([
    listOrdersForUser(user.id, "buyer"),
    listOrdersForUser(user.id, "seller"),
  ]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      <OrdersList purchases={purchases} sales={sales} />
    </div>
  );
}
