import { deleteListing, listListings, updateListing, type Listing, type ListingStatus } from "@reef-market/shared";
import { Image } from "expo-image";
import { Link, Stack, useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminGate } from "@/components/AdminGate";
import { apiClient } from "@/lib/api-client";
import { confirmAsync, notify } from "@/lib/alert";
import { themeColors } from "@/lib/theme-colors";

// Mirrors apps/web/src/app/admin/listings/AdminListingsTable.tsx's STATUS_TABS exactly.
const STATUS_TABS: { value: ListingStatus | "all"; label: string }[] = [
  { value: "pending_approval", label: "Pending Approval" },
  { value: "active", label: "Active" },
  { value: "sold", label: "Sold" },
  { value: "removed", label: "Removed" },
  { value: "all", label: "All" },
];

function StatusTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`px-3 py-1.5 rounded-full ${active ? "bg-primary" : "bg-muted"}`}>
      <Text className={`text-xs font-semibold ${active ? "text-white" : "text-muted-foreground"}`}>{label}</Text>
    </Pressable>
  );
}

function AdminListingsContent() {
  const [status, setStatus] = useState<ListingStatus | "all">("pending_approval");
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { listings, total } = await listListings(apiClient, {
        status: status === "all" ? undefined : status,
        sort: "newest",
        limit: 100,
      });
      setListings(listings);
      setTotal(total);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(load, 0);
      return () => clearTimeout(timer);
    }, [load]),
  );

  async function approve(id: string) {
    setBusyId(id);
    try {
      await updateListing(apiClient, id, { status: "active" });
      await load();
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "Failed to approve listing");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    try {
      await updateListing(apiClient, id, { status: "removed" });
      await load();
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "Failed to remove listing");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleFeatured(listing: Listing) {
    setBusyId(listing.id);
    try {
      await updateListing(apiClient, listing.id, { featured: !listing.featured });
      await load();
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "Failed to update listing");
    } finally {
      setBusyId(null);
    }
  }

  async function hardDelete(id: string) {
    const confirmed = await confirmAsync("Delete this listing?", "This can't be undone.", "Delete");
    if (!confirmed) return;
    setBusyId(id);
    try {
      await deleteListing(apiClient, id);
      await load();
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "Failed to delete listing");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <View className="flex-1">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
      >
        {STATUS_TABS.map((tab) => (
          <StatusTab key={tab.value} label={tab.label} active={status === tab.value} onPress={() => setStatus(tab.value)} />
        ))}
      </ScrollView>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 10 }}
          ListHeaderComponent={
            listings.length > 0 ? <Text className="text-xs text-muted-foreground mb-1">{total} listing(s)</Text> : null
          }
          ListEmptyComponent={
            <View className="items-center py-24 px-6">
              <Text className="text-muted-foreground text-center">No listings in this view.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isBusy = busyId === item.id;
            return (
              <View className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3">
                <View className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                  {item.photos[0] && <Image source={{ uri: item.photos[0] }} style={{ width: 48, height: 48 }} contentFit="cover" />}
                </View>
                <Link href={`/listing/${item.id}`} asChild>
                  <Pressable className="flex-1 min-w-0">
                    <Text className="font-semibold text-sm text-foreground" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">
                      ${item.price.toFixed(2)} · {item.status.replace("_", " ")}
                      {item.featured ? " · featured" : ""}
                    </Text>
                  </Pressable>
                </Link>
                <View className="gap-1.5 items-end shrink-0">
                  {item.status !== "active" && (
                    <Pressable onPress={() => approve(item.id)} disabled={isBusy}>
                      <Text className="text-xs font-semibold text-emerald-600" style={{ opacity: isBusy ? 0.5 : 1 }}>
                        Approve
                      </Text>
                    </Pressable>
                  )}
                  {item.status !== "removed" && (
                    <Pressable onPress={() => remove(item.id)} disabled={isBusy}>
                      <Text className="text-xs font-semibold text-amber-600" style={{ opacity: isBusy ? 0.5 : 1 }}>
                        Remove
                      </Text>
                    </Pressable>
                  )}
                  <Pressable onPress={() => toggleFeatured(item)} disabled={isBusy}>
                    <Text className="text-xs font-semibold text-primary" style={{ opacity: isBusy ? 0.5 : 1 }}>
                      {item.featured ? "Unfeature" : "Feature"}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => hardDelete(item.id)} disabled={isBusy}>
                    <Text className="text-xs font-semibold text-destructive" style={{ opacity: isBusy ? 0.5 : 1 }}>
                      Delete
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

export default function AdminListingsScreen() {
  const router = useRouter();
  return (
    <AdminGate>
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
          <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
            <ArrowLeft size={20} color={themeColors.foreground} />
          </Pressable>
          <Text className="text-base font-semibold text-foreground">Listing Moderation</Text>
        </View>
        <AdminListingsContent />
      </SafeAreaView>
    </AdminGate>
  );
}
