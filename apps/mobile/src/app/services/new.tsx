import { SERVICE_TYPE_LABELS, createService, type MarketType, type ServiceType } from "@reef-market/shared";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, Plus, X } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";
import { uploadPhotoFromUri } from "@/lib/uploads";

const MARKET_OPTIONS: MarketType[] = ["saltwater", "freshwater", "both"];

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`px-3 py-2 rounded-full ${active ? "bg-primary" : "bg-muted"}`}>
      <Text className={`text-xs font-semibold capitalize ${active ? "text-primary-foreground" : "text-muted-foreground"}`}>{label}</Text>
    </Pressable>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <Text className="text-sm font-medium text-muted-foreground mb-1">{children}</Text>;
}

const inputClassName = "border border-border bg-card rounded-xl px-3 py-2.5 text-sm text-foreground";

export default function NewServiceScreen() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("maintenance");
  const [market, setMarket] = useState<MarketType>("both");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [shipsNationwide, setShipsNationwide] = useState(false);
  const [priceRange, setPriceRange] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handlePickPhotos() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, quality: 0.8 });
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
      await createService(apiClient, {
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
      });
      // No service detail page exists yet (matches apps/web's current scope) — back to the list.
      router.replace("/services");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = !submitting && uploadingCount === 0 && title.trim().length > 0;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
          <ArrowLeft size={20} color={themeColors.foreground} />
        </Pressable>
        <Text className="text-base font-semibold text-foreground">Post a Service</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View>
          <FieldLabel>Service title</FieldLabel>
          <TextInput
            testID="service-title-input"
            value={title}
            onChangeText={setTitle}
            className={inputClassName}
            placeholderTextColor={themeColors.mutedForeground}
          />
        </View>

        <View>
          <FieldLabel>Service type</FieldLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
              <Chip key={value} label={label} active={serviceType === value} onPress={() => setServiceType(value as ServiceType)} />
            ))}
          </ScrollView>
        </View>

        <View>
          <FieldLabel>Market</FieldLabel>
          <View className="flex-row gap-2">
            {MARKET_OPTIONS.map((m) => (
              <Chip key={m} label={m} active={market === m} onPress={() => setMarket(m)} />
            ))}
          </View>
        </View>

        <View>
          <FieldLabel>Photos</FieldLabel>
          <View className="flex-row flex-wrap gap-3">
            {photos.map((url) => (
              <View key={url} className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                <Image source={{ uri: url }} style={{ width: 80, height: 80 }} contentFit="cover" />
                <Pressable onPress={() => removePhoto(url)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 items-center justify-center">
                  <X size={12} color={themeColors.white} />
                </Pressable>
              </View>
            ))}
            {Array.from({ length: uploadingCount }).map((_, i) => (
              <View key={`uploading-${i}`} className="w-20 h-20 rounded-lg bg-muted items-center justify-center">
                <ActivityIndicator size="small" color={themeColors.primary} />
              </View>
            ))}
            <Pressable onPress={handlePickPhotos} className="w-20 h-20 rounded-lg border-2 border-dashed border-border items-center justify-center">
              <Plus size={22} color={themeColors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        <View>
          <FieldLabel>Description</FieldLabel>
          <TextInput
            testID="service-description-input"
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

        <View>
          <FieldLabel>Your location</FieldLabel>
          <TextInput
            testID="service-location-input"
            value={location}
            onChangeText={setLocation}
            placeholder="City, State"
            className={inputClassName}
            placeholderTextColor={themeColors.mutedForeground}
          />
        </View>

        <View>
          <FieldLabel>Service area</FieldLabel>
          <TextInput
            testID="service-area-input"
            value={serviceArea}
            onChangeText={setServiceArea}
            placeholder="e.g. Greater Chicago, within 50 miles of Atlanta"
            className={inputClassName}
            placeholderTextColor={themeColors.mutedForeground}
          />
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-foreground flex-1 pr-3">I offer remote or shipped services (nationwide)</Text>
          <Switch value={shipsNationwide} onValueChange={setShipsNationwide} trackColor={{ true: themeColors.primary, false: undefined }} />
        </View>

        <View className="flex-row gap-4">
          <View className="flex-1">
            <FieldLabel>Price range</FieldLabel>
            <TextInput
              testID="service-price-input"
              value={priceRange}
              onChangeText={setPriceRange}
              placeholder="$50-$100, Free"
              className={inputClassName}
              placeholderTextColor={themeColors.mutedForeground}
            />
          </View>
          <View className="flex-1">
            <FieldLabel>Contact info</FieldLabel>
            <TextInput
              testID="service-contact-input"
              value={contactInfo}
              onChangeText={setContactInfo}
              placeholder="Phone, email, etc."
              className={inputClassName}
              placeholderTextColor={themeColors.mutedForeground}
            />
          </View>
        </View>

        {error && <Text className="text-sm text-destructive">{error}</Text>}

        <Pressable onPress={handleSubmit} disabled={!canSubmit} className={`rounded-xl py-3 items-center ${canSubmit ? "bg-primary" : "bg-muted"}`}>
          {submitting ? (
            <ActivityIndicator color={themeColors.white} />
          ) : (
            <Text className={`font-semibold text-sm ${canSubmit ? "text-white" : "text-muted-foreground"}`}>
              {uploadingCount > 0 ? "Uploading photos…" : "Post Service"}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
