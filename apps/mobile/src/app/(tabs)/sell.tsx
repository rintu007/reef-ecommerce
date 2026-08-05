import { deleteListing, listListings, type Listing } from "@reef-market/shared";
import { Image } from "expo-image";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { confirmAsync, notify } from "@/lib/alert";
import { useAuth } from "@/lib/auth-context";
import { themeColors } from "@/lib/theme-colors";

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  active: { bg: "#d1fae5", text: "#065f46" },
  sold: { bg: "#dbeafe", text: "#1e40af" },
  pending_approval: { bg: "#fef9c3", text: "#854d0e" },
  removed: { bg: "#e5e7eb", text: "#374151" },
};

export default function SellScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { listings } = await listListings(apiClient, { seller_id: session.user.id, sort: "newest", limit: 200 });
      setListings(listings);
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Refetch on focus (not just mount) — this screen stays mounted underneath
  // the listing/new and listing/[id]/edit stack screens, so a plain mount-only
  // effect would leave the list stale after creating or editing a listing.
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(load, 0);
      return () => clearTimeout(timer);
    }, [load]),
  );

  async function handleDelete(listing: Listing) {
    const confirmed = await confirmAsync("Delete this listing?", "This can't be undone.", "Delete");
    if (!confirmed) return;

    setBusyId(listing.id);
    try {
      await deleteListing(apiClient, listing.id);
      await load();
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "Failed to delete listing");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pt-3 pb-2">
        <Text className="text-xl font-bold text-foreground">My Listings</Text>
        <Pressable
          testID="new-listing-button"
          onPress={() => router.push("/listing/new")}
          className="flex-row items-center gap-1 bg-primary rounded-full px-3 py-2"
        >
          <Plus size={14} color={themeColors.white} />
          <Text className="text-xs font-semibold text-white">New Listing</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={
            <View className="items-center py-24 px-6">
              <Text className="text-muted-foreground text-center">You haven&apos;t created any listings yet.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const statusStyle = STATUS_STYLES[item.status] ?? { bg: "#f3f4f6", text: "#374151" };
            return (
              <View className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3">
                <View className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                  {item.photos[0] && <Image source={{ uri: item.photos[0] }} style={{ width: 56, height: 56 }} contentFit="cover" />}
                </View>
                <Link href={`/listing/${item.id}`} asChild>
                  <Pressable className="flex-1 min-w-0">
                    <Text className="font-semibold text-sm text-foreground" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="text-sm text-muted-foreground">${item.price.toFixed(2)}</Text>
                  </Pressable>
                </Link>
                <View className="rounded-full px-2 py-1" style={{ backgroundColor: statusStyle.bg }}>
                  <Text className="text-[10px] font-semibold capitalize" style={{ color: statusStyle.text }}>
                    {item.status.replace("_", " ")}
                  </Text>
                </View>
                <View className="gap-2 items-end">
                  <Pressable onPress={() => router.push(`/listing/${item.id}/edit`)}>
                    <Text className="text-xs font-semibold text-primary">Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(item)} disabled={busyId === item.id}>
                    <Text className="text-xs font-semibold text-destructive">{busyId === item.id ? "…" : "Delete"}</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
