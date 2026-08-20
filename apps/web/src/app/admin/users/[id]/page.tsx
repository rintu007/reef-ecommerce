import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { AdminUserDetailView } from "./AdminUserDetailView";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "admin") redirect("/browse");

  const { id } = await params;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">User Detail</h1>
      <p className="text-sm text-gray-500 mb-6">
        A read-only snapshot of this account — everything support needs to diagnose an issue, without acting as the user.
      </p>
      <AdminUserDetailView id={id} />
    </div>
  );
}
