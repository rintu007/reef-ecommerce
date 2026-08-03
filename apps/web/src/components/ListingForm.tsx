"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ALL_CATEGORIES,
  FRESHWATER_TYPES,
  LISTING_TYPE_LABELS,
  SALTWATER_TYPES,
  ApiError,
  createListing,
  updateListing,
  type Listing,
  type ListingType,
  type MarketType,
} from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";
import { uploadPhoto } from "@/lib/uploads";

interface ListingFormProps {
  mode: "create" | "edit";
  listingId?: string;
  initial?: Listing;
}

export function ListingForm({ mode, listingId, initial }: ListingFormProps) {
  const router = useRouter();

  const [market, setMarket] = useState<MarketType>(initial?.market ?? "saltwater");
  const [listingType, setListingType] = useState<ListingType>(initial?.listing_type ?? "coral");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : "1");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [shippingAvailable, setShippingAvailable] = useState(initial?.shipping_available ?? false);
  const [localPickup, setLocalPickup] = useState(initial?.local_pickup ?? true);
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);
  const [uploadingCount, setUploadingCount] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const availableTypes = market === "saltwater" ? SALTWATER_TYPES : FRESHWATER_TYPES;
  const availableCategories = ALL_CATEGORIES[listingType] ?? [];

  function handleMarketChange(next: MarketType) {
    setMarket(next);
    const types = next === "saltwater" ? SALTWATER_TYPES : FRESHWATER_TYPES;
    setListingType(types[0]);
    setCategory("");
  }

  async function handlePhotoSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setUploadingCount((n) => n + files.length);
    setError(null);
    try {
      const uploaded = await Promise.all(files.map((file) => uploadPhoto("listing-photos", file)));
      setPhotos((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setUploadingCount((n) => n - files.length);
    }
  }

  function removePhoto(url: string) {
    setPhotos((prev) => prev.filter((p) => p !== url));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        title,
        description: description || undefined,
        market,
        listing_type: listingType,
        category: category || undefined,
        price: Number(price),
        quantity: Number(quantity) || 1,
        location: location || undefined,
        shipping_available: shippingAvailable,
        local_pickup: localPickup,
        photos,
      };

      const listing =
        mode === "create"
          ? (await createListing(apiClient, payload)).listing
          : (await updateListing(apiClient, listingId!, payload)).listing;

      router.push(`/listings/${listing.id}`);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{mode === "create" ? "Create a Listing" : "Edit Listing"}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleMarketChange("saltwater")}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              market === "saltwater" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            🪸 Saltwater
          </button>
          <button
            type="button"
            onClick={() => handleMarketChange("freshwater")}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              market === "freshwater" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            🐟 Freshwater
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={listingType}
            onChange={(e) => {
              setListingType(e.target.value as ListingType);
              setCategory("");
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {availableTypes.map((type) => (
              <option key={type} value={type}>
                {LISTING_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        {availableCategories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">None</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Photos</label>
          <div className="flex flex-wrap gap-3">
            {photos.map((url) => (
              <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs leading-none flex items-center justify-center"
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
            {Array.from({ length: uploadingCount }).map((_, i) => (
              <div
                key={`uploading-${i}`}
                className="w-20 h-20 rounded-lg bg-gray-100 animate-pulse flex items-center justify-center text-xs text-gray-400"
              >
                …
              </div>
            ))}
            <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-2xl text-gray-400 cursor-pointer hover:border-gray-400">
              +
              <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="price">
              Price ($)
            </label>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="quantity">
              Quantity
            </label>
            <input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="location">
            Location
          </label>
          <input
            id="location"
            value={location ?? ""}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, State"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={localPickup} onChange={(e) => setLocalPickup(e.target.checked)} />
            Local pickup
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={shippingAvailable}
              onChange={(e) => setShippingAvailable(e.target.checked)}
            />
            Shipping available
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || uploadingCount > 0}
          className="w-full rounded-lg bg-blue-600 text-white text-sm font-semibold py-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {submitting
            ? mode === "create"
              ? "Creating…"
              : "Saving…"
            : uploadingCount > 0
              ? "Uploading photos…"
              : mode === "create"
                ? "Create Listing"
                : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
