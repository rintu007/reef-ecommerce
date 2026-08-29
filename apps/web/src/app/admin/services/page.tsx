import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { AdminServicesTable } from "./AdminServicesTable";

export default async function AdminServicesPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "admin") redirect("/browse");

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Services</h1>
      <AdminServicesTable />
    </div>
  );
}
