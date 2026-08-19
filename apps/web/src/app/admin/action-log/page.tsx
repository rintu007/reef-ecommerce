import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { ActionLogTable } from "./ActionLogTable";

export default async function AdminActionLogPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "admin") redirect("/browse");

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Admin Action Log</h1>
      <p className="text-sm text-gray-500 mb-6">
        Every sensitive admin action, who did it, and when — refunds, role changes, listing moderation, and content/promo/announcement changes.
      </p>
      <ActionLogTable />
    </div>
  );
}
