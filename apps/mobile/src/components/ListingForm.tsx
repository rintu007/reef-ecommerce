import {
  ALL_CATEGORIES,
  FRESHWATER_TYPES,
  LISTING_TYPE_LABELS,
  SALTWATER_TYPES,
  createListing,
  fromCents,
  updateListing,
  type Listing,
  type ListingType,
  type MarketType,
} from "@reef-market/shared";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Plus, X } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";
import { uploadPhotoFromUri } from "@/lib/uploads";

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`px-3 py-2 rounded-full ${active ? "bg-primary" : "bg-muted"}`}>
      <Text className={`text-xs font-semibold ${active ? "text-primary-foreground" : "text-muted-foreground"}`}>{label}</Text>
    </Pressable>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <Text className="text-sm font-medium text-muted-foreground mb-1">{children}</Text>;
}

const inputClassName = "border border-border bg-card rounded-xl px-3 py-2.5 text-sm text-foreground";

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

      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-foreground">Local pickup</Text>
        <Switch
          value={localPickup}
          onValueChange={setLocalPickup}
          trackColor={{ true: themeColors.primary, false: undefined }}
        />
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-foreground">Shipping available</Text>
        <Switch
          value={shippingAvailable}
          onValueChange={setShippingAvailable}
          trackColor={{ true: themeColors.primary, false: undefined }}
        />
      </View>

      {localPickup && (
        <View className="gap-3 border border-border rounded-xl p-3">
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

      <View className="flex-row items-start gap-2 border border-border rounded-xl p-3">
        <Switch value={featuredFee} onValueChange={setFeaturedFee} trackColor={{ true: themeColors.primary, false: undefined }} />
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
