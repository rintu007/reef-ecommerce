import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { AdminBlockedUsersTable } from "./AdminBlockedUsersTable";

export default async function AdminBlockedUsersPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "admin") redirect("/browse");

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Blocked Users</h1>
      <p className="text-sm text-gray-500 mb-6">Who has blocked whom — useful when a dispute involves two users who&apos;ve blocked each other.</p>
      <AdminBlockedUsersTable />
    </div>
  );
}
