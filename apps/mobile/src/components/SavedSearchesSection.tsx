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
import { Pressable, ScrollView, Text, View } from "react-native";
import { FormField, FormModal, formInputClassName } from "@/components/ui/FormModal";
import { TextInput } from "@/components/ui/TextInput";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";

const LISTING_TYPES = Object.keys(LISTING_TYPE_LABELS) as ListingType[];

function NewSavedSearchModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [listingType, setListingType] = useState<ListingType | "">("");
  const [keyword, setKeyword] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [shippingAvailable, setShippingAvailable] = useState(false);
  const [localPickup, setLocalPickup] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await createSavedSearch(apiClient, {
        name: name.trim() || null,
        listing_type: listingType || null,
        keyword: keyword.trim() || null,
        max_price: maxPrice ? Number(maxPrice) : null,
        shipping_available: shippingAvailable,
        local_pickup: localPickup,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save this search");
      setSaving(false);
    }
  }

  return (
    <FormModal visible title="New saved search" onClose={onClose} onSave={handleSave} saving={saving} error={error}>
      <Text className="text-sm text-muted-foreground -mt-1">We&apos;ll notify you when a new listing matches.</Text>

      <FormField label="Name" hint="Optional — just for you">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Zoas under $50"
          placeholderTextColor={themeColors.mutedForeground}
          className={formInputClassName}
        />
      </FormField>

      <FormField label="Type">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Pressable onPress={() => setListingType("")} className={`px-3.5 py-2 rounded-full ${listingType === "" ? "bg-primary" : "bg-muted"}`}>
            <Text className={`text-sm font-semibold ${listingType === "" ? "text-primary-foreground" : "text-muted-foreground"}`}>Any type</Text>
          </Pressable>
          {LISTING_TYPES.map((t) => (
            <Pressable key={t} onPress={() => setListingType(t)} className={`px-3.5 py-2 rounded-full ${listingType === t ? "bg-primary" : "bg-muted"}`}>
              <Text className={`text-sm font-semibold ${listingType === t ? "text-primary-foreground" : "text-muted-foreground"}`}>{LISTING_TYPE_LABELS[t]}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </FormField>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField label="Keyword">
            <TextInput
              value={keyword}
              onChangeText={setKeyword}
              placeholder="e.g. zoanthid"
              placeholderTextColor={themeColors.mutedForeground}
              className={formInputClassName}
            />
          </FormField>
        </View>
        <View className="flex-1">
          <FormField label="Max price ($)">
            <TextInput
              value={maxPrice}
              onChangeText={setMaxPrice}
              placeholder="50"
              keyboardType="numeric"
              placeholderTextColor={themeColors.mutedForeground}
              className={formInputClassName}
            />
          </FormField>
        </View>
      </View>

      <View className="rounded-xl border border-border bg-card px-4">
        <View className="flex-row items-center justify-between py-3 border-b border-border">
          <Text className="text-sm text-foreground">Must ship</Text>
          <ToggleSwitch value={shippingAvailable} onValueChange={setShippingAvailable} />
        </View>
        <View className="flex-row items-center justify-between py-3">
          <Text className="text-sm text-foreground">Must offer local pickup</Text>
          <ToggleSwitch value={localPickup} onValueChange={setLocalPickup} />
        </View>
      </View>
    </FormModal>
  );
}

export function SavedSearchesSection() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const { savedSearches } = await listSavedSearches(apiClient);
    setSearches(savedSearches);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

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
        <Pressable onPress={() => setCreating(true)} hitSlop={8} className="rounded-full bg-primary/10 px-3 py-1.5">
          <Text className="text-xs font-semibold text-primary">+ New</Text>
        </Pressable>
      </View>

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

      {creating && (
        <NewSavedSearchModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            load();
          }}
        />
      )}
    </View>
  );
}
