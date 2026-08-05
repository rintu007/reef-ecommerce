"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteService } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

export function DeleteServiceButton({ serviceId }: { serviceId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Delete this service? This can't be undone.")) return;
    setDeleting(true);
    try {
      await deleteService(apiClient, serviceId);
      router.push("/services");
      router.refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to delete service");
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
    >
      {deleting ? "Deleting…" : "Delete"}
    </button>
  );
}
