"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  createService,
  updateService,
  type MarketType,
  type Service,
  type ServiceType,
} from "@reef-market/shared";
import { SERVICE_TYPE_LABELS } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";
import { uploadPhoto } from "@/lib/uploads";

interface ServiceFormProps {
  mode: "create" | "edit";
  serviceId?: string;
  initial?: Service;
}

export function ServiceForm({ mode, serviceId, initial }: ServiceFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [serviceType, setServiceType] = useState<ServiceType>(initial?.service_type ?? "maintenance");
  const [market, setMarket] = useState<MarketType>(initial?.market ?? "both");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [serviceArea, setServiceArea] = useState(initial?.service_area ?? "");
  const [shipsNationwide, setShipsNationwide] = useState(initial?.ships_nationwide ?? false);
  const [priceRange, setPriceRange] = useState(initial?.price_range ?? "");
  const [contactInfo, setContactInfo] = useState(initial?.contact_info ?? "");
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);
  const [uploadingCount, setUploadingCount] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
        service_type: serviceType,
        market,
        description: description || undefined,
        location: location || undefined,
        service_area: serviceArea || undefined,
        ships_nationwide: shipsNationwide,
        price_range: priceRange || undefined,
        contact_info: contactInfo || undefined,
        photos,
      };

      const service =
        mode === "create"
          ? (await createService(apiClient, payload)).service
          : (await updateService(apiClient, serviceId!, payload)).service;

      router.push(`/services/${service.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{mode === "create" ? "Post a Service" : "Edit Service"}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="title">
            Service title
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Service type</label>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value as ServiceType)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Market</label>
          <div className="flex gap-2">
            {(["saltwater", "freshwater", "both"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMarket(m)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold capitalize ${
                  market === m ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="location">
            Your location
          </label>
          <input
            id="location"
            value={location ?? ""}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, State"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="service_area">
            Service area
          </label>
          <input
            id="service_area"
            value={serviceArea ?? ""}
            onChange={(e) => setServiceArea(e.target.value)}
            placeholder="e.g. Greater Chicago, within 50 miles of Atlanta"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={shipsNationwide} onChange={(e) => setShipsNationwide(e.target.checked)} />
          I offer remote or shipped services (nationwide)
        </label>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="price_range">
              Price range
            </label>
            <input
              id="price_range"
              value={priceRange ?? ""}
              onChange={(e) => setPriceRange(e.target.value)}
              placeholder="$50-$100, Free"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="contact_info">
              Contact info
            </label>
            <input
              id="contact_info"
              value={contactInfo ?? ""}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="Phone, email, etc."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || uploadingCount > 0}
          className="w-full rounded-lg bg-blue-600 text-white text-sm font-semibold py-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {submitting
            ? mode === "create"
              ? "Posting…"
              : "Saving…"
            : uploadingCount > 0
              ? "Uploading photos…"
              : mode === "create"
                ? "Post Service"
                : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
