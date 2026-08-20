import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { AdminReviewsTable } from "./AdminReviewsTable";

export default async function AdminReviewsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "admin") redirect("/browse");

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Reviews</h1>
      <p className="text-sm text-gray-500 mb-6">Reviews only ever showed up as an aggregate average — find and remove a fake or abusive one here.</p>
      <AdminReviewsTable />
    </div>
  );
}
