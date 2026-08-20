import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { AdminSubscriptionsTable } from "./AdminSubscriptionsTable";

export default async function AdminSubscriptionsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "admin") redirect("/browse");

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Subscriptions</h1>
      <p className="text-sm text-gray-500 mb-6">
        Which users hold which plan, and its status. Users who&apos;ve never subscribed (implicitly free) have no row here.
      </p>
      <AdminSubscriptionsTable />
    </div>
  );
}
