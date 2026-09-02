import {
  LISTING_TYPE_LABELS,
  createSavedSearch,
  deleteSavedSearch,
  listSavedSearches,
  updateSavedSearch,
  type ListingType,
  type SavedSearch,
} from "@reef-market/shared";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

const LISTING_TYPES = Object.keys(LISTING_TYPE_LABELS) as ListingType[];

export function SavedSearchesSection() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [listingType, setListingType] = useState<ListingType | "">("");
  const [keyword, setKeyword] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [shippingAvailable, setShippingAvailable] = useState(false);
  const [localPickup, setLocalPickup] = useState(false);

  const load = useCallback(async () => {
    const { savedSearches } = await listSavedSearches(apiClient);
    setSearches(savedSearches);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function handleCreate() {
    setError(null);
    setCreating(true);
    try {
      await createSavedSearch(apiClient, {
        name: name || null,
        listing_type: listingType || null,
        keyword: keyword || null,
        max_price: maxPrice ? Number(maxPrice) : null,
        shipping_available: shippingAvailable,
        local_pickup: localPickup,
      });
      setName("");
      setListingType("");
      setKeyword("");
      setMaxPrice("");
      setShippingAvailable(false);
      setLocalPickup(false);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save search");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(search: SavedSearch) {
    setBusyId(search.id);
    try {
      await updateSavedSearch(apiClient, search.id, { is_active: !search.is_active });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    try {
      await deleteSavedSearch(apiClient, id);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return null;

  return (
    <View className="rounded-xl border border-border bg-card p-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-semibold text-sm text-foreground">Saved Searches</Text>
        <Pressable onPress={() => setShowForm((v) => !v)}>
          <Text className="text-xs font-semibold text-primary">{showForm ? "Cancel" : "+ New"}</Text>
        </Pressable>
      </View>

      {showForm && (
        <View className="mt-3 gap-2 border-t border-border pt-3">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name (e.g. Zoas under $50)"
            placeholderTextColor={themeColors.mutedForeground}
            className="border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            <Pressable
              onPress={() => setListingType("")}
              className={`px-3 py-1.5 rounded-full ${listingType === "" ? "bg-primary" : "bg-muted"}`}
            >
              <Text className={`text-xs font-semibold ${listingType === "" ? "text-primary-foreground" : "text-muted-foreground"}`}>Any type</Text>
            </Pressable>
            {LISTING_TYPES.map((t) => (
              <Pressable key={t} onPress={() => setListingType(t)} className={`px-3 py-1.5 rounded-full ${listingType === t ? "bg-primary" : "bg-muted"}`}>
                <Text className={`text-xs font-semibold ${listingType === t ? "text-primary-foreground" : "text-muted-foreground"}`}>
                  {LISTING_TYPE_LABELS[t]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <View className="flex-row gap-2">
            <TextInput
              value={keyword}
              onChangeText={setKeyword}
              placeholder="Keyword"
              placeholderTextColor={themeColors.mutedForeground}
              className="flex-1 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground"
            />
            <TextInput
              value={maxPrice}
              onChangeText={setMaxPrice}
              placeholder="Max price"
              keyboardType="numeric"
              placeholderTextColor={themeColors.mutedForeground}
              className="flex-1 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground"
            />
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-muted-foreground">Shipping available</Text>
            <ToggleSwitch value={shippingAvailable} onValueChange={setShippingAvailable} />
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-muted-foreground">Local pickup</Text>
            <ToggleSwitch value={localPickup} onValueChange={setLocalPickup} />
          </View>
          {error && <Text className="text-xs text-destructive">{error}</Text>}
          <Pressable onPress={handleCreate} disabled={creating} className="bg-foreground rounded-lg py-2.5 items-center">
            {creating ? <ActivityIndicator color={themeColors.white} /> : <Text className="text-xs font-semibold text-white">Save Search</Text>}
          </Pressable>
        </View>
      )}

      {searches.length === 0 ? (
        <Text className="text-sm text-muted-foreground mt-2">No saved searches yet.</Text>
      ) : (
        <View className="mt-3 gap-2">
          {searches.map((s) => (
            <View key={s.id} className="flex-row items-center justify-between rounded-lg border border-border px-3 py-2">
              <View className="flex-1 pr-2">
                <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                  {s.name || s.keyword || "Untitled search"}
                </Text>
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                  {[s.listing_type ? LISTING_TYPE_LABELS[s.listing_type] : null, s.keyword, s.max_price ? `≤ $${s.max_price}` : null]
                    .filter(Boolean)
                    .join(" · ") || "All listings"}
                </Text>
              </View>
              <View className="flex-row gap-3">
                <Pressable onPress={() => toggleActive(s)} disabled={busyId === s.id}>
                  <Text className="text-xs font-semibold text-muted-foreground">{s.is_active ? "Disable" : "Enable"}</Text>
                </Pressable>
                <Pressable onPress={() => remove(s.id)} disabled={busyId === s.id}>
                  <Text className="text-xs font-semibold text-destructive">Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
