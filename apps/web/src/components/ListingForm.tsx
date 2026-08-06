"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ALL_CATEGORIES,
  COUNTRIES,
  CURRENCIES,
  COUNTRY_DEFAULT_CURRENCY,
  FRESHWATER_TYPES,
  LISTING_TYPE_LABELS,
  SALTWATER_TYPES,
  ApiError,
  createListing,
  fromCents,
  getCountryName,
  updateListing,
  type DoaPolicyType,
  type EquipmentCondition,
  type EquipmentMarket,
  type Listing,
  type ListingType,
  type MarketType,
  type PhotoType,
  type ShippingTier,
} from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";
import { uploadPhoto } from "@/lib/uploads";

interface ListingFormProps {
  mode: "create" | "edit";
  listingId?: string;
  initial?: Listing;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const EQUIPMENT_TYPES: ListingType[] = ["equipment", "fw_equipment"];
const ANIMAL_TYPES: ListingType[] = ["coral", "fish", "sw_invert", "fw_fish", "fw_amphibian", "fw_turtle", "fw_other"];

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

function ShippingTiersEditor({ tiers, onChange }: { tiers: ShippingTier[]; onChange: (next: ShippingTier[]) => void }) {
  return (
    <div className="space-y-2">
      {tiers.map((tier, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-gray-500 whitespace-nowrap">Up to</span>
          <input
            type="number"
            placeholder="qty"
            value={tier.up_to_qty || ""}
            onChange={(e) => {
              const next = [...tiers];
              next[i] = { ...next[i], up_to_qty: Number(e.target.value) };
              onChange(next);
            }}
            className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm"
          />
          <span className="text-xs text-gray-500">items →</span>
          <input
            type="number"
            placeholder="price"
            value={tier.price || ""}
            onChange={(e) => {
              const next = [...tiers];
              next[i] = { ...next[i], price: Number(e.target.value) };
              onChange(next);
            }}
            className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={() => onChange(tiers.filter((_, j) => j !== i))}
            className="text-red-600 text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...tiers, { up_to_qty: 1, price: 0 }])}
        className="text-xs font-semibold text-blue-600"
      >
        + Add Tier
      </button>
    </div>
  );
}

interface FormState {
  photoType: PhotoType | "";
  shippingCost: string;
  useShippingTiers: boolean;
  shippingTiers: ShippingTier[];
  minQty: string;
  minOrderAmount: string;
  diffPickupPrice: boolean;
  pickupPrice: string;
  sellerCountry: string;
  currency: string;
  shipsToCountries: string[];
  wysiwyg: boolean;
  doaPolicy: DoaPolicyType | "";
  doaPolicyCustom: string;
  fragSize: string;
  lightRequirement: "" | "low" | "medium" | "high";
  flowRequirement: "" | "low" | "medium" | "high";
  difficulty: "" | "beginner" | "intermediate" | "expert";
  careNotes: string;
  speciesName: string;
  tankSizeRecommendation: string;
  temperament: "" | "peaceful" | "semi-aggressive" | "aggressive";
  reefSafe: boolean;
  brand: string;
  model: string;
  condition: EquipmentCondition | "";
  equipmentNotes: string;
  equipmentMarket: EquipmentMarket | "";
}

function initFormState(initial?: Listing): FormState {
  return {
    photoType: initial?.photo_type ?? "",
    shippingCost: initial?.shipping_cost ? String(initial.shipping_cost) : "",
    useShippingTiers: (initial?.shipping_tiers?.length ?? 0) > 0,
    shippingTiers: initial?.shipping_tiers ?? [],
    minQty: initial ? String(initial.min_qty) : "1",
    minOrderAmount: initial?.min_order_amount ? String(initial.min_order_amount) : "",
    diffPickupPrice: !!initial?.pickup_price,
    pickupPrice: initial?.pickup_price ? String(initial.pickup_price) : "",
    sellerCountry: initial?.seller_country ?? "",
    currency: initial?.currency ?? "USD",
    shipsToCountries: initial?.ships_to_countries ?? [],
    wysiwyg: initial?.wysiwyg ?? false,
    doaPolicy: initial?.doa_policy ?? "",
    doaPolicyCustom: initial?.doa_policy_custom ?? "",
    fragSize: initial?.frag_size ?? "",
    lightRequirement: initial?.light_requirement ?? "",
    flowRequirement: initial?.flow_requirement ?? "",
    difficulty: initial?.difficulty ?? "",
    careNotes: initial?.care_notes ?? "",
    speciesName: initial?.species_name ?? "",
    tankSizeRecommendation: initial?.tank_size_recommendation ?? "",
    temperament: initial?.temperament ?? "",
    reefSafe: initial?.reef_safe ?? true,
    brand: initial?.brand ?? "",
    model: initial?.model ?? "",
    condition: initial?.condition ?? "",
    equipmentNotes: initial?.equipment_notes ?? "",
    equipmentMarket: initial?.equipment_market ?? "",
  };
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
  const [form, setForm] = useState<FormState>(() => initFormState(initial));

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const availableTypes = market === "saltwater" ? SALTWATER_TYPES : FRESHWATER_TYPES;
  const availableCategories = ALL_CATEGORIES[listingType] ?? [];
  const isEquipment = EQUIPMENT_TYPES.includes(listingType);
  const isAnimal = ANIMAL_TYPES.includes(listingType);
  const isCoral = listingType === "coral";
  const isFish = listingType === "fish";
  const isOtherAnimal = ["sw_invert", "fw_fish", "fw_amphibian", "fw_turtle", "fw_other"].includes(listingType);

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

  function addShipsTo(code: string) {
    if (!code || code === form.sellerCountry || form.shipsToCountries.includes(code)) return;
    update("shipsToCountries", [...form.shipsToCountries, code]);
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
        price: Number(price) || 0,
        currency: form.currency || "USD",
        quantity: Number(quantity) || 1,
        location: location || undefined,
        seller_country: form.sellerCountry || undefined,
        ships_to_countries: shippingAvailable ? form.shipsToCountries : [],
        wysiwyg: form.wysiwyg,
        photo_type: form.photoType || undefined,
        photos,
        shipping_available: shippingAvailable,
        local_pickup: localPickup,
        shipping_cost: form.useShippingTiers ? 0 : Number(form.shippingCost) || 0,
        shipping_tiers: form.useShippingTiers ? form.shippingTiers : [],
        min_qty: Number(form.minQty) || 1,
        min_order_amount: Number(form.minOrderAmount) || 0,
        pickup_price: shippingAvailable && localPickup && form.diffPickupPrice && form.pickupPrice ? Number(form.pickupPrice) : undefined,
        pickup_address: localPickup ? pickupAddress || undefined : undefined,
        pickup_times: localPickup ? pickupTimes : [],
        doa_policy: !isEquipment && form.doaPolicy ? form.doaPolicy : undefined,
        doa_policy_custom: !isEquipment && form.doaPolicy === "custom" ? form.doaPolicyCustom : undefined,
        frag_size: isCoral ? form.fragSize || undefined : undefined,
        light_requirement: isCoral && form.lightRequirement ? form.lightRequirement : undefined,
        flow_requirement: isCoral && form.flowRequirement ? form.flowRequirement : undefined,
        difficulty: isAnimal && form.difficulty ? form.difficulty : undefined,
        care_notes: isAnimal ? form.careNotes || undefined : undefined,
        species_name: isFish || isOtherAnimal ? form.speciesName || undefined : undefined,
        tank_size_recommendation: isFish || isOtherAnimal ? form.tankSizeRecommendation || undefined : undefined,
        temperament: isFish && form.temperament ? form.temperament : undefined,
        reef_safe: isFish ? form.reefSafe : undefined,
        brand: isEquipment ? form.brand || undefined : undefined,
        model: isEquipment ? form.model || undefined : undefined,
        condition: isEquipment && form.condition ? form.condition : undefined,
        equipment_notes: isEquipment ? form.equipmentNotes || undefined : undefined,
        equipment_market: isEquipment && form.equipmentMarket ? form.equipmentMarket : undefined,
        featured_fee: featuredFee,
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Photo Type</label>
          <select
            value={form.photoType}
            onChange={(e) => update("photoType", e.target.value as PhotoType)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Select photo type</option>
            <option value="actual_photo">
              {isEquipment ? "Photo of actual item" : `Photo of actual ${listingType.includes("fw") ? "plant/animal" : "fish/animal"}`}
            </option>
            <option value="stock_photo">Stock photo</option>
            {isCoral && <option value="colony_photo">Photo from same colony (frag will be taken)</option>}
          </select>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Country</label>
            <select
              value={form.sellerCountry}
              onChange={(e) => {
                update("sellerCountry", e.target.value);
                const suggested = COUNTRY_DEFAULT_CURRENCY[e.target.value];
                if (suggested) update("currency", suggested);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">— Select —</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Listing Currency</label>
            <select
              value={form.currency}
              onChange={(e) => update("currency", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>
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
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.wysiwyg} onChange={(e) => update("wysiwyg", e.target.checked)} />
            WYSIWYG
          </label>
        </div>

        {shippingAvailable && (
          <div className="space-y-3 rounded-lg border border-gray-200 p-3">
            <p className="text-sm font-semibold">📦 Shipping Settings</p>
            <label className="flex items-center justify-between text-sm text-gray-700">
              <span>Use tiered shipping prices?</span>
              <input
                type="checkbox"
                checked={form.useShippingTiers}
                onChange={(e) => {
                  update("useShippingTiers", e.target.checked);
                  if (!e.target.checked) update("shippingTiers", []);
                }}
              />
            </label>

            {!form.useShippingTiers ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Flat Shipping Cost ({form.currency})</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.shippingCost}
                  onChange={(e) => update("shippingCost", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Price Tiers</label>
                <ShippingTiersEditor tiers={form.shippingTiers} onChange={(t) => update("shippingTiers", t)} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min. Order Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={form.minQty}
                  onChange={(e) => update("minQty", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min. Order Amount ({form.currency})</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0 = none"
                  value={form.minOrderAmount}
                  onChange={(e) => update("minOrderAmount", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ships To (other countries)</label>
              <select
                value=""
                onChange={(e) => addShipsTo(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">+ Add a country</option>
                {COUNTRIES.filter((c) => c.code !== form.sellerCountry && !form.shipsToCountries.includes(c.code)).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              {form.shipsToCountries.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.shipsToCountries.map((code) => (
                    <span key={code} className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full">
                      {getCountryName(code)}
                      <button
                        type="button"
                        onClick={() => update("shipsToCountries", form.shipsToCountries.filter((c) => c !== code))}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {shippingAvailable && localPickup && (
          <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <label className="flex items-center justify-between text-sm text-gray-700">
              <span className="font-medium">Different price for local pickup?</span>
              <input
                type="checkbox"
                checked={form.diffPickupPrice}
                onChange={(e) => {
                  update("diffPickupPrice", e.target.checked);
                  if (!e.target.checked) update("pickupPrice", "");
                }}
              />
            </label>
            {form.diffPickupPrice && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Price ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.pickupPrice}
                  onChange={(e) => update("pickupPrice", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>
        )}

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

        {!isEquipment && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DOA / Arrival Policy</label>
            <p className="text-xs text-gray-500 mb-1">What happens if the animal arrives dead or severely stressed?</p>
            <select
              value={form.doaPolicy}
              onChange={(e) => update("doaPolicy", e.target.value as DoaPolicyType)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Select a policy</option>
              <option value="not_applicable">Not Applicable — local pickup only</option>
              <option value="full_refund">Full Refund — photo proof within 2hrs of delivery required</option>
              <option value="store_credit">Store Credit — photo proof within 2hrs of delivery required</option>
              <option value="no_refund">No Refund — shipped at buyer&apos;s risk</option>
              <option value="custom">Custom policy...</option>
            </select>
            {form.doaPolicy === "custom" && (
              <textarea
                rows={3}
                placeholder="Describe your DOA policy in detail..."
                value={form.doaPolicyCustom}
                onChange={(e) => update("doaPolicyCustom", e.target.value)}
                className="w-full mt-2 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            )}
          </div>
        )}

        {isCoral && (
          <div className="space-y-3 rounded-lg border border-gray-200 p-3">
            <p className="text-sm font-semibold">Coral Details</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frag Size</label>
              <input
                placeholder="e.g. 1 inch, 2-3 polyps"
                value={form.fragSize}
                onChange={(e) => update("fragSize", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Light</label>
                <select
                  value={form.lightRequirement}
                  onChange={(e) => update("lightRequirement", e.target.value as FormState["lightRequirement"])}
                  className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
                >
                  <option value="">—</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Flow</label>
                <select
                  value={form.flowRequirement}
                  onChange={(e) => update("flowRequirement", e.target.value as FormState["flowRequirement"])}
                  className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
                >
                  <option value="">—</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  value={form.difficulty}
                  onChange={(e) => update("difficulty", e.target.value as FormState["difficulty"])}
                  className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
                >
                  <option value="">—</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Care Notes &amp; Seller Tips</label>
              <textarea
                rows={4}
                value={form.careNotes}
                onChange={(e) => update("careNotes", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}

        {(isFish || isOtherAnimal) && (
          <div className="space-y-3 rounded-lg border border-gray-200 p-3">
            <p className="text-sm font-semibold">Animal Details</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Species / Common Name</label>
              <input
                value={form.speciesName}
                onChange={(e) => update("speciesName", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Tank Size</label>
              <input
                placeholder="e.g. 30 gallons"
                value={form.tankSizeRecommendation}
                onChange={(e) => update("tankSizeRecommendation", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            {isFish && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Temperament</label>
                  <select
                    value={form.temperament}
                    onChange={(e) => update("temperament", e.target.value as FormState["temperament"])}
                    className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
                  >
                    <option value="">—</option>
                    <option value="peaceful">Peaceful</option>
                    <option value="semi-aggressive">Semi-aggressive</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => update("difficulty", e.target.value as FormState["difficulty"])}
                    className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
                  >
                    <option value="">—</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>
            )}
            {isFish && (
              <label className="flex items-center justify-between text-sm text-gray-700">
                <span>Reef Safe</span>
                <input type="checkbox" checked={form.reefSafe} onChange={(e) => update("reefSafe", e.target.checked)} />
              </label>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Care Tips</label>
              <textarea
                rows={4}
                value={form.careNotes}
                onChange={(e) => update("careNotes", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}

        {isEquipment && (
          <div className="space-y-3 rounded-lg border border-gray-200 p-3">
            <p className="text-sm font-semibold">Equipment Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <input
                  value={form.brand}
                  onChange={(e) => update("brand", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <input
                  value={form.model}
                  onChange={(e) => update("model", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select
                value={form.condition}
                onChange={(e) => update("condition", e.target.value as EquipmentCondition)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select</option>
                <option value="new">New</option>
                <option value="like_new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="parts_only">Parts Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compatible With</label>
              <select
                value={form.equipmentMarket}
                onChange={(e) => update("equipmentMarket", e.target.value as EquipmentMarket)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select compatibility</option>
                <option value="saltwater_only">🌊 Saltwater only</option>
                <option value="freshwater_only">🐟 Freshwater only</option>
                <option value="both">🌊🐟 Both saltwater &amp; freshwater</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (wear, age, included parts)</label>
              <textarea
                rows={3}
                value={form.equipmentNotes}
                onChange={(e) => update("equipmentNotes", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
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
