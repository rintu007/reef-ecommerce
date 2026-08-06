"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateListing, type Listing, type ListingStatus } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";
import { uploadPhoto } from "@/lib/uploads";
import { DeleteListingButton } from "@/components/DeleteListingButton";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  sold: "bg-blue-100 text-blue-800",
  pending_approval: "bg-yellow-100 text-yellow-800",
  removed: "bg-gray-200 text-gray-700",
};

/**
 * One row in My Listings. Renders a normal view row plus, when "Quick Edit"
 * is toggled, swaps in an inline form (in place — no modal) matching legacy's
 * 5-field quick-edit: title, price, quantity, description, and photos[0] only.
 * Everything else (Full Edit, Delete) is untouched from the previous version.
 */
export function ListingRow({ listing: initialListing }: { listing: Listing }) {
  const router = useRouter();
  const [listing, setListing] = useState(initialListing);
  const [expanded, setExpanded] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick-edit form state
  const [title, setTitle] = useState(listing.title);
  const [price, setPrice] = useState(String(listing.price));
  const [quantity, setQuantity] = useState(String(listing.quantity));
  const [description, setDescription] = useState(listing.description ?? "");
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openQuickEdit() {
    setTitle(listing.title);
    setPrice(String(listing.price));
    setQuantity(String(listing.quantity));
    setDescription(listing.description ?? "");
    setPendingPhoto(null);
    setError(null);
    setExpanded(true);
  }

  function cancelQuickEdit() {
    setExpanded(false);
    setPendingPhoto(null);
    setError(null);
  }

  async function handlePhotoPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadingPhoto(true);
    setError(null);
    try {
      const url = await uploadPhoto("listing-photos", file);
      setPendingPhoto(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSaveQuickEdit() {
    setSaving(true);
    setError(null);
    try {
      const photos = pendingPhoto ? [pendingPhoto, ...listing.photos.slice(1)] : listing.photos;
      const { listing: updated } = await updateListing(apiClient, listing.id, {
        title,
        price: Number(price) || 0,
        quantity: Number(quantity) || 0,
        description: description || undefined,
        photos,
      });
      setListing(updated);
      setExpanded(false);
      setPendingPhoto(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus() {
    const activating = listing.status === "removed";
    if (!activating) {
      const confirmed = confirm("Deactivate this listing? Buyers won't be able to find it in Browse until you reactivate it.");
      if (!confirmed) return;
    }

    const previousStatus = listing.status;
    const nextStatus: ListingStatus = activating ? "active" : "removed";
    setStatusBusy(true);
    setListing((prev) => ({ ...prev, status: nextStatus })); // optimistic
    try {
      const { listing: updated } = await updateListing(apiClient, listing.id, { status: nextStatus });
      setListing(updated);
    } catch (err) {
      setListing((prev) => ({ ...prev, status: previousStatus })); // revert
      alert(err instanceof Error ? err.message : "Failed to update listing");
    } finally {
      setStatusBusy(false);
    }
  }

  const photoUrl = pendingPhoto ?? listing.photos[0];

  return (
    <div
      className={`rounded-xl border p-3 bg-white ${
        expanded ? "border-blue-300" : "border-gray-200"
      } ${listing.status === "removed" ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            "🪸"
          )}
          {expanded && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                aria-label="Replace photo"
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center"
              >
                {uploadingPhoto ? "…" : "📷"}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoPick} className="hidden" />
            </>
          )}
        </div>

        {!expanded ? (
          <>
            <div className="flex-1 min-w-0">
              <Link href={`/listings/${listing.id}`} className="font-semibold text-sm hover:underline truncate block">
                {listing.title}
              </Link>
              <p className="text-sm text-gray-500">
                ${listing.price.toFixed(2)} <span className="text-gray-400">· 👁 {listing.views} views</span>
              </p>
            </div>
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${STATUS_STYLES[listing.status] ?? "bg-gray-100 text-gray-700"}`}
            >
              {listing.status.replace("_", " ")}
            </span>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex gap-3">
                <button type="button" onClick={openQuickEdit} className="text-sm font-semibold text-blue-600 hover:underline">
                  Quick Edit
                </button>
                <Link href={`/listings/${listing.id}/edit`} className="text-sm font-semibold text-blue-600 hover:underline">
                  Edit
                </Link>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  disabled={statusBusy}
                  className="text-sm font-semibold text-amber-700 hover:underline disabled:opacity-50"
                >
                  {statusBusy ? "…" : listing.status === "removed" ? "Reactivate" : "Deactivate"}
                </button>
                <DeleteListingButton listingId={listing.id} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 min-w-0 space-y-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Price"
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              />
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Quantity"
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {expanded && (
        <div className="mt-3 space-y-2">
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelQuickEdit}
              disabled={saving}
              className="px-4 py-1.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveQuickEdit}
              disabled={saving || uploadingPhoto}
              className="px-4 py-1.5 rounded-full text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
