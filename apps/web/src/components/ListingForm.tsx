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
  fromCents,
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

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function PickupTimesEditor({ times, onChange }: { times: string[]; onChange: (next: string[]) => void }) {
  const [days, setDays] = useState<string[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  function toggleDay(day: string) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function addSlot() {
    if (days.length === 0 || !from || !to) return;
    onChange([...times, `${days.join(", ")} ${from} – ${to}`]);
    setDays([]);
    setFrom("");
    setTo("");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {DAYS.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => toggleDay(day)}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${days.includes(day) ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            {day}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="From (e.g. 10:00 AM)"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        />
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="To (e.g. 2:00 PM)"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        />
        <button type="button" onClick={addSlot} className="px-3 rounded-lg bg-gray-900 text-white text-xs font-semibold">
          Add
        </button>
      </div>
      {times.length > 0 && (
        <ul className="space-y-1">
          {times.map((slot, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-700">
              <span>{slot}</span>
              <button type="button" onClick={() => onChange(times.filter((_, idx) => idx !== i))} className="text-red-600 font-semibold">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
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
  const [pickupAddress, setPickupAddress] = useState(initial?.pickup_address ?? "");
  const [pickupTimes, setPickupTimes] = useState<string[]>(initial?.pickup_times ?? []);
  const [featuredFee, setFeaturedFee] = useState(initial?.featured_fee ?? false);
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
        pickup_address: localPickup ? pickupAddress || undefined : undefined,
        pickup_times: localPickup ? pickupTimes : [],
        featured_fee: featuredFee,
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

        {localPickup && (
          <div className="space-y-3 rounded-lg border border-gray-200 p-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="pickup_address">
                Pickup address
              </label>
              <input
                id="pickup_address"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Full address — only shared with buyers after purchase"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Available pickup times</label>
              <PickupTimesEditor times={pickupTimes} onChange={setPickupTimes} />
            </div>
          </div>
        )}

        <label className="flex items-start gap-2 text-sm text-gray-700 rounded-lg border border-gray-200 p-3">
          <input type="checkbox" checked={featuredFee} onChange={(e) => setFeaturedFee(e.target.checked)} className="mt-0.5" />
          <span>
            <span className="font-medium">Feature this listing</span>
            <br />
            <span className="text-xs text-gray-500">
              Adds a flat ${fromCents(99).toFixed(2)} platform fee, taken from proceeds only if this item sells.
            </span>
          </span>
        </label>

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
