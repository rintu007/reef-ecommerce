import { notFound, redirect } from "next/navigation";
import { ListingForm } from "@/components/ListingForm";
import { SellerAgreementGate } from "@/components/SellerAgreementGate";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { getListingById } from "@/lib/server/listings";

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");

  const listing = await getListingById(id, user);
  if (!listing) notFound();
  if (listing.seller_id !== user.id && user.role !== "admin") notFound();

  return (
    <SellerAgreementGate>
      <ListingForm mode="edit" listingId={listing.id} initial={listing} />
    </SellerAgreementGate>
  );
}
