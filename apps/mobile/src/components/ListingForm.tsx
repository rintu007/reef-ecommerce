import {
  ALL_CATEGORIES,
  COUNTRIES,
  CURRENCIES,
  COUNTRY_DEFAULT_CURRENCY,
  FRESHWATER_TYPES,
  LISTING_TYPE_LABELS,
  SALTWATER_TYPES,
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
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Plus, X } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";
import { uploadPhotoFromUri } from "@/lib/uploads";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`px-3 py-2 rounded-full ${active ? "bg-primary" : "bg-muted"}`}>
      <Text className={`text-xs font-semibold ${active ? "text-primary-foreground" : "text-muted-foreground"}`}>{label}</Text>
    </Pressable>
  );
}

function RemovableChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <View className="flex-row items-center gap-1 bg-muted rounded-full pl-3 pr-1.5 py-1.5">
      <Text className="text-xs font-semibold text-muted-foreground">{label}</Text>
      <Pressable onPress={onRemove} className="w-4 h-4 items-center justify-center">
        <X size={12} color={themeColors.mutedForeground} />
      </Pressable>
    </View>
  );
}

function OptionCard({
  label,
  description,
  active,
  onPress,
}: {
  label: string;
  description?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-xl border p-3 ${active ? "border-primary bg-primary/5" : "border-border bg-card"}`}
    >
      <Text className={`text-sm font-medium ${active ? "text-primary" : "text-foreground"}`}>{label}</Text>
      {description && <Text className="text-xs text-muted-foreground mt-0.5">{description}</Text>}
    </Pressable>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <Text className="text-sm font-medium text-muted-foreground mb-1">{children}</Text>;
}

const inputClassName = "border border-border bg-card rounded-xl px-3 py-2.5 text-sm text-foreground";

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
    <View className="gap-2">
      <View className="flex-row flex-wrap gap-1.5">
        {DAYS.map((day) => (
          <Chip key={day} label={day} active={days.includes(day)} onPress={() => toggleDay(day)} />
        ))}
      </View>
      <View className="flex-row gap-2">
        <TextInput
          value={from}
          onChangeText={setFrom}
          placeholder="From (e.g. 10:00 AM)"
          placeholderTextColor={themeColors.mutedForeground}
          className={`flex-1 ${inputClassName}`}
        />
        <TextInput
          value={to}
          onChangeText={setTo}
          placeholder="To (e.g. 2:00 PM)"
          placeholderTextColor={themeColors.mutedForeground}
          className={`flex-1 ${inputClassName}`}
        />
        <Pressable onPress={addSlot} className="bg-foreground rounded-xl px-3 items-center justify-center">
          <Text className="text-white text-xs font-semibold">Add</Text>
        </Pressable>
      </View>
      {times.map((slot, i) => (
        <View key={i} className="flex-row items-center justify-between rounded-lg bg-muted px-3 py-2">
          <Text className="text-xs text-foreground flex-1 pr-2">{slot}</Text>
          <Pressable onPress={() => onChange(times.filter((_, idx) => idx !== i))}>
            <Text className="text-xs font-semibold text-destructive">Remove</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function ShippingTiersEditor({ tiers, onChange }: { tiers: ShippingTier[]; onChange: (next: ShippingTier[]) => void }) {
  return (
    <View className="gap-2">
      {tiers.map((tier, i) => (
        <View key={i} className="flex-row items-center gap-2">
          <Text className="text-xs text-muted-foreground">Up to</Text>
          <TextInput
            value={tier.up_to_qty ? String(tier.up_to_qty) : ""}
            onChangeText={(v) => {
              const next = [...tiers];
              next[i] = { ...next[i], up_to_qty: Number(v) || 0 };
              onChange(next);
            }}
            keyboardType="number-pad"
            placeholder="qty"
            placeholderTextColor={themeColors.mutedForeground}
            className={`w-16 ${inputClassName}`}
          />
          <Text className="text-xs text-muted-foreground">items →</Text>
          <TextInput
            value={tier.price ? String(tier.price) : ""}
            onChangeText={(v) => {
              const next = [...tiers];
              next[i] = { ...next[i], price: Number(v) || 0 };
              onChange(next);
            }}
            keyboardType="decimal-pad"
            placeholder="price"
            placeholderTextColor={themeColors.mutedForeground}
            className={`flex-1 ${inputClassName}`}
          />
          <Pressable onPress={() => onChange(tiers.filter((_, j) => j !== i))} className="w-6 h-6 items-center justify-center">
            <X size={14} color={themeColors.destructive} />
          </Pressable>
        </View>
      ))}
      <Pressable onPress={() => onChange([...tiers, { up_to_qty: 1, price: 0 }])}>
        <Text className="text-xs font-semibold text-primary">+ Add Tier</Text>
      </Pressable>
    </View>
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

export function ListingForm({
  mode,
  listingId,
  initial,
}: {
  mode: "create" | "edit";
  listingId?: string;
  initial?: Listing;
}) {
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

  async function handlePickPhotos() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;

    setUploadingCount((n) => n + result.assets.length);
    setError(null);
    try {
      const uploaded = await Promise.all(
        result.assets.map((asset) => {
          const ext = asset.fileName?.match(/\.[a-zA-Z0-9]{1,8}$/)?.[0] ?? ".jpg";
          return uploadPhotoFromUri("listing-photos", asset.uri, `photo${ext}`);
        }),
      );
      setPhotos((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setUploadingCount((n) => n - result.assets.length);
    }
  }

  function removePhoto(url: string) {
    setPhotos((prev) => prev.filter((p) => p !== url));
  }

  function addShipsTo(code: string) {
    if (!code || code === form.sellerCountry || form.shipsToCountries.includes(code)) return;
    update("shipsToCountries", [...form.shipsToCountries, code]);
  }

  async function handleSubmit() {
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
        pickup_price:
          shippingAvailable && localPickup && form.diffPickupPrice && form.pickupPrice ? Number(form.pickupPrice) : undefined,
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

      router.replace(`/listing/${listing.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = !submitting && uploadingCount === 0 && title.trim().length > 0 && Number(price) >= 0;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, gap: 16 }}>
      <View className="flex-row gap-2">
        <Chip label="🪸 Saltwater" active={market === "saltwater"} onPress={() => handleMarketChange("saltwater")} />
        <Chip label="🐟 Freshwater" active={market === "freshwater"} onPress={() => handleMarketChange("freshwater")} />
      </View>

      <View>
        <FieldLabel>Type</FieldLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {availableTypes.map((type) => (
            <Chip
              key={type}
              label={LISTING_TYPE_LABELS[type]}
              active={listingType === type}
              onPress={() => {
                setListingType(type);
                setCategory("");
              }}
            />
          ))}
        </ScrollView>
      </View>

      {availableCategories.length > 0 && (
        <View>
          <FieldLabel>Category</FieldLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            <Chip label="None" active={category === ""} onPress={() => setCategory("")} />
            {availableCategories.map((cat) => (
              <Chip key={cat} label={cat} active={category === cat} onPress={() => setCategory(cat)} />
            ))}
          </ScrollView>
        </View>
      )}

      <View>
        <FieldLabel>Photos</FieldLabel>
        <View className="flex-row flex-wrap gap-3">
          {photos.map((url) => (
            <View key={url} className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
              <Image source={{ uri: url }} style={{ width: 80, height: 80 }} contentFit="cover" />
              <Pressable
                onPress={() => removePhoto(url)}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 items-center justify-center"
              >
                <X size={12} color={themeColors.white} />
              </Pressable>
            </View>
          ))}
          {Array.from({ length: uploadingCount }).map((_, i) => (
            <View key={`uploading-${i}`} className="w-20 h-20 rounded-lg bg-muted items-center justify-center">
              <ActivityIndicator size="small" color={themeColors.primary} />
            </View>
          ))}
          <Pressable
            onPress={handlePickPhotos}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-border items-center justify-center"
          >
            <Plus size={22} color={themeColors.mutedForeground} />
          </Pressable>
        </View>
      </View>

      <View>
        <FieldLabel>Photo Type</FieldLabel>
        <View className="gap-2">
          <OptionCard
            label={isEquipment ? "Photo of actual item" : `Photo of actual ${listingType.includes("fw") ? "plant/animal" : "fish/animal"}`}
            active={form.photoType === "actual_photo"}
            onPress={() => update("photoType", "actual_photo")}
          />
          <OptionCard label="Stock photo" active={form.photoType === "stock_photo"} onPress={() => update("photoType", "stock_photo")} />
          {isCoral && (
            <OptionCard
              label="Photo from same colony (frag will be taken)"
              active={form.photoType === "colony_photo"}
              onPress={() => update("photoType", "colony_photo")}
            />
          )}
        </View>
      </View>

      <View>
        <FieldLabel>Title</FieldLabel>
        <TextInput
          testID="title-input"
          value={title}
          onChangeText={setTitle}
          className={inputClassName}
          placeholderTextColor={themeColors.mutedForeground}
        />
      </View>

      <View>
        <FieldLabel>Description</FieldLabel>
        <TextInput
          testID="description-input"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className={inputClassName}
          style={{ minHeight: 90 }}
          placeholderTextColor={themeColors.mutedForeground}
        />
      </View>

      <View className="flex-row gap-4">
        <View className="flex-1">
          <FieldLabel>Price ($)</FieldLabel>
          <TextInput
            testID="price-input"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            className={inputClassName}
            placeholderTextColor={themeColors.mutedForeground}
          />
        </View>
        <View className="flex-1">
          <FieldLabel>Quantity</FieldLabel>
          <TextInput
            testID="quantity-input"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
            className={inputClassName}
            placeholderTextColor={themeColors.mutedForeground}
          />
        </View>
      </View>

      <View>
        <FieldLabel>Location</FieldLabel>
        <TextInput
          testID="location-input"
          value={location}
          onChangeText={setLocation}
          placeholder="City, State"
          className={inputClassName}
          placeholderTextColor={themeColors.mutedForeground}
        />
      </View>

      <View className="flex-row gap-4">
        <View className="flex-1">
          <FieldLabel>Your Country</FieldLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {COUNTRIES.map((c) => (
              <Chip
                key={c.code}
                label={c.name}
                active={form.sellerCountry === c.code}
                onPress={() => {
                  update("sellerCountry", c.code);
                  const suggested = COUNTRY_DEFAULT_CURRENCY[c.code];
                  if (suggested) update("currency", suggested);
                }}
              />
            ))}
          </ScrollView>
        </View>
      </View>

      <View>
        <FieldLabel>Listing Currency</FieldLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {CURRENCIES.map((c) => (
            <Chip
              key={c.code}
              label={`${c.code} (${c.symbol})`}
              active={form.currency === c.code}
              onPress={() => update("currency", c.code)}
            />
          ))}
        </ScrollView>
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-foreground">Local pickup</Text>
        <ToggleSwitch value={localPickup} onValueChange={setLocalPickup} />
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-foreground">Shipping available</Text>
        <ToggleSwitch value={shippingAvailable} onValueChange={setShippingAvailable} />
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-foreground">WYSIWYG</Text>
        <ToggleSwitch value={form.wysiwyg} onValueChange={(v) => update("wysiwyg", v)} />
      </View>

      {shippingAvailable && (
        <View className="gap-3 rounded-xl border border-border p-3">
          <Text className="text-sm font-semibold text-foreground">📦 Shipping Settings</Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-foreground">Use tiered shipping prices?</Text>
            <ToggleSwitch
              value={form.useShippingTiers}
              onValueChange={(v) => {
                update("useShippingTiers", v);
                if (!v) update("shippingTiers", []);
              }}
            />
          </View>

          {!form.useShippingTiers ? (
            <View>
              <FieldLabel>{`Flat Shipping Cost (${form.currency})`}</FieldLabel>
              <TextInput
                value={form.shippingCost}
                onChangeText={(v) => update("shippingCost", v)}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={themeColors.mutedForeground}
                className={inputClassName}
              />
            </View>
          ) : (
            <View>
              <FieldLabel>Shipping Price Tiers</FieldLabel>
              <ShippingTiersEditor tiers={form.shippingTiers} onChange={(t) => update("shippingTiers", t)} />
            </View>
          )}

          <View className="flex-row gap-3">
            <View className="flex-1">
              <FieldLabel>Min. Order Quantity</FieldLabel>
              <TextInput
                value={form.minQty}
                onChangeText={(v) => update("minQty", v)}
                keyboardType="number-pad"
                className={inputClassName}
                placeholderTextColor={themeColors.mutedForeground}
              />
            </View>
            <View className="flex-1">
              <FieldLabel>{`Min. Order Amount (${form.currency})`}</FieldLabel>
              <TextInput
                value={form.minOrderAmount}
                onChangeText={(v) => update("minOrderAmount", v)}
                keyboardType="decimal-pad"
                placeholder="0 = none"
                placeholderTextColor={themeColors.mutedForeground}
                className={inputClassName}
              />
            </View>
          </View>

          <View>
            <FieldLabel>Ships To (other countries)</FieldLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {COUNTRIES.filter((c) => c.code !== form.sellerCountry && !form.shipsToCountries.includes(c.code)).map((c) => (
                <Chip key={c.code} label={`+ ${c.name}`} active={false} onPress={() => addShipsTo(c.code)} />
              ))}
            </ScrollView>
            {form.shipsToCountries.length > 0 && (
              <View className="flex-row flex-wrap gap-2 mt-2">
                {form.shipsToCountries.map((code) => (
                  <RemovableChip
                    key={code}
                    label={getCountryName(code)}
                    onRemove={() => update("shipsToCountries", form.shipsToCountries.filter((c) => c !== code))}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {shippingAvailable && localPickup && (
        <View className="gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-foreground">Different price for local pickup?</Text>
            <ToggleSwitch
              value={form.diffPickupPrice}
              onValueChange={(v) => {
                update("diffPickupPrice", v);
                if (!v) update("pickupPrice", "");
              }}
            />
          </View>
          {form.diffPickupPrice && (
            <View>
              <FieldLabel>Pickup Price ($)</FieldLabel>
              <TextInput
                value={form.pickupPrice}
                onChangeText={(v) => update("pickupPrice", v)}
                keyboardType="decimal-pad"
                className={inputClassName}
                placeholderTextColor={themeColors.mutedForeground}
              />
            </View>
          )}
        </View>
      )}

      {localPickup && (
        <View className="gap-3 rounded-xl border border-border p-3">
          <View>
            <FieldLabel>Pickup address</FieldLabel>
            <TextInput
              value={pickupAddress}
              onChangeText={setPickupAddress}
              placeholder="Full address — only shared with buyers after purchase"
              placeholderTextColor={themeColors.mutedForeground}
              className={inputClassName}
            />
          </View>
          <View>
            <FieldLabel>Available pickup times</FieldLabel>
            <PickupTimesEditor times={pickupTimes} onChange={setPickupTimes} />
          </View>
        </View>
      )}

      {!isEquipment && (
        <View>
          <FieldLabel>DOA / Arrival Policy</FieldLabel>
          <Text className="text-xs text-muted-foreground mb-2">
            What happens if the animal arrives dead or severely stressed?
          </Text>
          <View className="gap-2">
            <OptionCard
              label="Not Applicable"
              description="local pickup only"
              active={form.doaPolicy === "not_applicable"}
              onPress={() => update("doaPolicy", "not_applicable")}
            />
            <OptionCard
              label="Full Refund"
              description="photo proof within 2hrs of delivery required"
              active={form.doaPolicy === "full_refund"}
              onPress={() => update("doaPolicy", "full_refund")}
            />
            <OptionCard
              label="Store Credit"
              description="photo proof within 2hrs of delivery required"
              active={form.doaPolicy === "store_credit"}
              onPress={() => update("doaPolicy", "store_credit")}
            />
            <OptionCard
              label="No Refund"
              description="shipped at buyer's risk"
              active={form.doaPolicy === "no_refund"}
              onPress={() => update("doaPolicy", "no_refund")}
            />
            <OptionCard
              label="Custom policy..."
              active={form.doaPolicy === "custom"}
              onPress={() => update("doaPolicy", "custom")}
            />
          </View>
          {form.doaPolicy === "custom" && (
            <TextInput
              value={form.doaPolicyCustom}
              onChangeText={(v) => update("doaPolicyCustom", v)}
              placeholder="Describe your DOA policy in detail..."
              placeholderTextColor={themeColors.mutedForeground}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className={`${inputClassName} mt-2`}
              style={{ minHeight: 70 }}
            />
          )}
        </View>
      )}

      {isCoral && (
        <View className="gap-3 rounded-xl border border-border p-3">
          <Text className="text-sm font-semibold text-foreground">Coral Details</Text>
          <View>
            <FieldLabel>Frag Size</FieldLabel>
            <TextInput
              value={form.fragSize}
              onChangeText={(v) => update("fragSize", v)}
              placeholder="e.g. 1 inch, 2-3 polyps"
              placeholderTextColor={themeColors.mutedForeground}
              className={inputClassName}
            />
          </View>
          <View>
            <FieldLabel>Light</FieldLabel>
            <View className="flex-row gap-2">
              {(["low", "medium", "high"] as const).map((v) => (
                <Chip key={v} label={v === "low" ? "Low" : v === "medium" ? "Medium" : "High"} active={form.lightRequirement === v} onPress={() => update("lightRequirement", v)} />
              ))}
            </View>
          </View>
          <View>
            <FieldLabel>Flow</FieldLabel>
            <View className="flex-row gap-2">
              {(["low", "medium", "high"] as const).map((v) => (
                <Chip key={v} label={v === "low" ? "Low" : v === "medium" ? "Medium" : "High"} active={form.flowRequirement === v} onPress={() => update("flowRequirement", v)} />
              ))}
            </View>
          </View>
          <View>
            <FieldLabel>Difficulty</FieldLabel>
            <View className="flex-row gap-2">
              {(["beginner", "intermediate", "expert"] as const).map((v) => (
                <Chip
                  key={v}
                  label={v === "beginner" ? "Beginner" : v === "intermediate" ? "Intermediate" : "Expert"}
                  active={form.difficulty === v}
                  onPress={() => update("difficulty", v)}
                />
              ))}
            </View>
          </View>
          <View>
            <FieldLabel>Care Notes &amp; Seller Tips</FieldLabel>
            <TextInput
              value={form.careNotes}
              onChangeText={(v) => update("careNotes", v)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className={inputClassName}
              style={{ minHeight: 90 }}
              placeholderTextColor={themeColors.mutedForeground}
            />
          </View>
        </View>
      )}

      {(isFish || isOtherAnimal) && (
        <View className="gap-3 rounded-xl border border-border p-3">
          <Text className="text-sm font-semibold text-foreground">Animal Details</Text>
          <View>
            <FieldLabel>Species / Common Name</FieldLabel>
            <TextInput
              value={form.speciesName}
              onChangeText={(v) => update("speciesName", v)}
              className={inputClassName}
              placeholderTextColor={themeColors.mutedForeground}
            />
          </View>
          <View>
            <FieldLabel>Min Tank Size</FieldLabel>
            <TextInput
              value={form.tankSizeRecommendation}
              onChangeText={(v) => update("tankSizeRecommendation", v)}
              placeholder="e.g. 30 gallons"
              placeholderTextColor={themeColors.mutedForeground}
              className={inputClassName}
            />
          </View>
          {isFish && (
            <View>
              <FieldLabel>Temperament</FieldLabel>
              <View className="flex-row flex-wrap gap-2">
                {(["peaceful", "semi-aggressive", "aggressive"] as const).map((v) => (
                  <Chip
                    key={v}
                    label={v === "peaceful" ? "Peaceful" : v === "semi-aggressive" ? "Semi-aggressive" : "Aggressive"}
                    active={form.temperament === v}
                    onPress={() => update("temperament", v)}
                  />
                ))}
              </View>
            </View>
          )}
          {isFish && (
            <View>
              <FieldLabel>Difficulty</FieldLabel>
              <View className="flex-row gap-2">
                {(["beginner", "intermediate", "expert"] as const).map((v) => (
                  <Chip
                    key={v}
                    label={v === "beginner" ? "Beginner" : v === "intermediate" ? "Intermediate" : "Expert"}
                    active={form.difficulty === v}
                    onPress={() => update("difficulty", v)}
                  />
                ))}
              </View>
            </View>
          )}
          {isFish && (
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-foreground">Reef Safe</Text>
              <ToggleSwitch value={form.reefSafe} onValueChange={(v) => update("reefSafe", v)} />
            </View>
          )}
          <View>
            <FieldLabel>Care Tips</FieldLabel>
            <TextInput
              value={form.careNotes}
              onChangeText={(v) => update("careNotes", v)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className={inputClassName}
              style={{ minHeight: 90 }}
              placeholderTextColor={themeColors.mutedForeground}
            />
          </View>
        </View>
      )}

      {isEquipment && (
        <View className="gap-3 rounded-xl border border-border p-3">
          <Text className="text-sm font-semibold text-foreground">Equipment Details</Text>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <FieldLabel>Brand</FieldLabel>
              <TextInput
                value={form.brand}
                onChangeText={(v) => update("brand", v)}
                className={inputClassName}
                placeholderTextColor={themeColors.mutedForeground}
              />
            </View>
            <View className="flex-1">
              <FieldLabel>Model</FieldLabel>
              <TextInput
                value={form.model}
                onChangeText={(v) => update("model", v)}
                className={inputClassName}
                placeholderTextColor={themeColors.mutedForeground}
              />
            </View>
          </View>
          <View>
            <FieldLabel>Condition</FieldLabel>
            <View className="flex-row flex-wrap gap-2">
              {(
                [
                  ["new", "New"],
                  ["like_new", "Like New"],
                  ["good", "Good"],
                  ["fair", "Fair"],
                  ["parts_only", "Parts Only"],
                ] as const
              ).map(([v, label]) => (
                <Chip key={v} label={label} active={form.condition === v} onPress={() => update("condition", v)} />
              ))}
            </View>
          </View>
          <View>
            <FieldLabel>Compatible With</FieldLabel>
            <View className="flex-row flex-wrap gap-2">
              <Chip
                label="🌊 Saltwater only"
                active={form.equipmentMarket === "saltwater_only"}
                onPress={() => update("equipmentMarket", "saltwater_only")}
              />
              <Chip
                label="🐟 Freshwater only"
                active={form.equipmentMarket === "freshwater_only"}
                onPress={() => update("equipmentMarket", "freshwater_only")}
              />
              <Chip
                label="🌊🐟 Both saltwater & freshwater"
                active={form.equipmentMarket === "both"}
                onPress={() => update("equipmentMarket", "both")}
              />
            </View>
          </View>
          <View>
            <FieldLabel>Notes (wear, age, included parts)</FieldLabel>
            <TextInput
              value={form.equipmentNotes}
              onChangeText={(v) => update("equipmentNotes", v)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className={inputClassName}
              style={{ minHeight: 70 }}
              placeholderTextColor={themeColors.mutedForeground}
            />
          </View>
        </View>
      )}

      <View className="flex-row items-start gap-2 border border-border rounded-xl p-3">
        <ToggleSwitch value={featuredFee} onValueChange={setFeaturedFee} />
        <View className="flex-1">
          <Text className="text-sm font-medium text-foreground">Feature this listing</Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            Adds a flat ${fromCents(99).toFixed(2)} platform fee, taken from proceeds only if this item sells.
          </Text>
        </View>
      </View>

      {error && <Text className="text-sm text-destructive">{error}</Text>}

      <Pressable
        testID="submit-listing"
        onPress={handleSubmit}
        disabled={!canSubmit}
        className={`rounded-xl py-3 items-center ${canSubmit ? "bg-primary" : "bg-muted"}`}
      >
        {submitting ? (
          <ActivityIndicator color={themeColors.white} />
        ) : (
          <Text className={`font-semibold text-sm ${canSubmit ? "text-white" : "text-muted-foreground"}`}>
            {uploadingCount > 0 ? "Uploading photos…" : mode === "create" ? "Create Listing" : "Save Changes"}
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
