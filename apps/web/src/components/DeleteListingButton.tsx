"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteListing } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

export function DeleteListingButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this listing? This can't be undone.")) return;
    setDeleting(true);
    try {
      await deleteListing(apiClient, listingId);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete listing");
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
    >
      {deleting ? "Deleting…" : "Delete"}
    </button>
  );
}
