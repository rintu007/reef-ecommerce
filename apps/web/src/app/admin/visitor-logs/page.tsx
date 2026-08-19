import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { VisitorLogsTable } from "./VisitorLogsTable";

export default async function AdminVisitorLogsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "admin") redirect("/browse");

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Visitor Logs</h1>
      <p className="text-sm text-gray-500 mb-6">
        Raw page-view events — App Analytics only shows aggregates. Filter by session or user email to inspect exactly what one visitor did.
      </p>
      <VisitorLogsTable />
    </div>
  );
}
