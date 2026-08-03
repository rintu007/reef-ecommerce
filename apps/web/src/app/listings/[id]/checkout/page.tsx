import { notFound, redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { getListingById } from "@/lib/server/listings";
import { CheckoutFlow } from "./CheckoutFlow";

export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  if (!user) redirect(`/sign-in?next=/listings/${id}/checkout`);

  const listing = await getListingById(id, user);
  if (!listing) notFound();
  if (listing.status !== "active") redirect(`/listings/${id}`);
  if (listing.seller_id === user.id) redirect(`/listings/${id}`);

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <CheckoutFlow listing={listing} />
    </div>
  );
}
