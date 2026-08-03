import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { AdminUsersTable } from "./AdminUsersTable";

export default async function AdminUsersPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "admin") redirect("/browse");

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Users</h1>
      <AdminUsersTable currentUserId={user.id} />
    </div>
  );
}
