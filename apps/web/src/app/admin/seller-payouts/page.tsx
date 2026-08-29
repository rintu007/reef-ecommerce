import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { SellerPayoutsTable } from "./SellerPayoutsTable";

export default async function AdminSellerPayoutsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "admin") redirect("/browse");

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Seller Payouts</h1>
      <p className="text-sm text-gray-500 mb-6">
        Stripe Connect status for every seller who has started onboarding. A seller who hasn&apos;t started at all won&apos;t appear here.
      </p>
      <SellerPayoutsTable />
    </div>
  );
}
