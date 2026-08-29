import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { AdminMembershipPlansTable } from "./AdminMembershipPlansTable";

export default async function AdminMembershipPlansPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "admin") redirect("/browse");

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Membership Plans</h1>
      <p className="text-sm text-gray-500 mb-6">
        Plans are a fixed set (free / pro / business) — edit pricing, listing limits, and features here rather than a migration.
      </p>
      <AdminMembershipPlansTable />
    </div>
  );
}
