import { deleteListing, getSellerDashboardMetrics, listListings, updateListing, type Listing, type SellerDashboardMetrics } from "@reef-market/shared";
import { Image } from "expo-image";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { Calculator, Eye, Plus } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { confirmAsync, notify } from "@/lib/alert";
import { useAuth } from "@/lib/auth-context";
import { themeColors } from "@/lib/theme-colors";
import { AuthGate } from "@/components/AuthGate";
import { QuickEditListingSheet } from "@/components/QuickEditListingSheet";

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
  const [metrics, setMetrics] = useState<SellerDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [quickEditListing, setQuickEditListing] = useState<Listing | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [{ listings }, metrics] = await Promise.all([
        listListings(apiClient, { seller_id: session.user.id, sort: "newest", limit: 200 }),
        getSellerDashboardMetrics(apiClient),
      ]);
      setListings(listings);
      setMetrics(metrics);
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

  if (!session) {
    return <AuthGate title="Sign in to sell" message="Create an account to list corals, fish, and equipment for sale." />;
  }

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

  // One-way "Deactivate" in legacy (Listing.update(id, { status: "removed" }),
  // no confirm dialog, optimistic UI, toast on failure) — reactivate doesn't
  // exist there at all. Both directions are added here; only the destructive
  // Deactivate direction gets the confirm dialog, matching Delete's rigor.
  async function handleToggleStatus(listing: Listing) {
    const activating = listing.status === "removed";
    if (!activating) {
      const confirmed = await confirmAsync(
        "Deactivate this listing?",
        "Buyers won't be able to find it in Browse until you reactivate it.",
        "Deactivate",
      );
      if (!confirmed) return;
    }

    const nextStatus = activating ? "active" : "removed";
    setBusyId(listing.id);
    setListings((prev) => prev.map((l) => (l.id === listing.id ? { ...l, status: nextStatus } : l))); // optimistic
    try {
      const { listing: updated } = await updateListing(apiClient, listing.id, { status: nextStatus });
      setListings((prev) => prev.map((l) => (l.id === listing.id ? updated : l)));
    } catch (err) {
      setListings((prev) => prev.map((l) => (l.id === listing.id ? { ...l, status: listing.status } : l))); // revert
      notify("Error", err instanceof Error ? err.message : "Failed to update listing");
    } finally {
      setBusyId(null);
    }
  }

  function handleQuickEditSaved(updated: Listing) {
    setListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pt-3 pb-2">
        <Text className="text-xl font-bold text-foreground">My Listings</Text>
        <View className="flex-row items-center gap-2">
          <Pressable
            testID="fee-calculator-button"
            onPress={() => router.push("/fee-calculator")}
            className="w-9 h-9 items-center justify-center rounded-full bg-muted"
          >
            <Calculator size={16} color={themeColors.foreground} />
          </Pressable>
          <Pressable
            testID="new-listing-button"
            onPress={() => router.push("/listing/new")}
            className="flex-row items-center gap-1 bg-primary rounded-full px-3 py-2"
          >
            <Plus size={14} color={themeColors.white} />
            <Text className="text-xs font-semibold text-white">New Listing</Text>
          </Pressable>
        </View>
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
          ListHeaderComponent={
            metrics ? (
              // Legacy parity: reef-trade-flow's SellerDashboard.jsx "at a glance" metrics grid.
              <View className="flex-row flex-wrap gap-3 mb-2">
                {[
                  { value: String(metrics.activeListings), label: "Active listings", color: themeColors.foreground },
                  { value: `$${metrics.totalRevenue.toFixed(2)}`, label: "Completed sales", color: "#047857" },
                  { value: String(metrics.pendingOrders), label: "Orders need attention", color: "#b45309" },
                  { value: String(metrics.totalViews), label: "Total views", color: "#1d4ed8" },
                ].map((m) => (
                  <View key={m.label} className="bg-card border border-border rounded-xl p-3" style={{ width: "47%" }}>
                    <Text className="text-xl font-bold" style={{ color: m.color }}>
                      {m.value}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">{m.label}</Text>
                  </View>
                ))}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center py-24 px-6">
              <Text className="text-muted-foreground text-center">You haven&apos;t created any listings yet.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const statusStyle = STATUS_STYLES[item.status] ?? { bg: "#f3f4f6", text: "#374151" };
            const isBusy = busyId === item.id;
            return (
              <View className={`flex-row items-center gap-3 rounded-xl border border-border bg-card p-3 ${item.status === "removed" ? "opacity-60" : ""}`}>
                <View className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                  {item.photos[0] && <Image source={{ uri: item.photos[0] }} style={{ width: 56, height: 56 }} contentFit="cover" />}
                </View>
                <Link href={`/listing/${item.id}`} asChild>
                  <Pressable className="flex-1 min-w-0">
                    <Text className="font-semibold text-sm text-foreground" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="text-sm text-muted-foreground">${item.price.toFixed(2)}</Text>
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <Eye size={11} color={themeColors.mutedForeground} />
                      <Text className="text-[11px] text-muted-foreground">{item.views} views</Text>
                    </View>
                  </Pressable>
                </Link>
                <View className="rounded-full px-2 py-1" style={{ backgroundColor: statusStyle.bg }}>
                  <Text className="text-[10px] font-semibold capitalize" style={{ color: statusStyle.text }}>
                    {item.status.replace("_", " ")}
                  </Text>
                </View>
                <View className="gap-2 items-end">
                  <Pressable testID={`quick-edit-${item.id}`} onPress={() => setQuickEditListing(item)}>
                    <Text className="text-xs font-semibold text-primary">Quick Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => router.push(`/listing/${item.id}/edit`)}>
                    <Text className="text-xs font-semibold text-primary">Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => handleToggleStatus(item)} disabled={isBusy}>
                    <Text className="text-xs font-semibold text-amber-600">
                      {isBusy ? "…" : item.status === "removed" ? "Reactivate" : "Deactivate"}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(item)} disabled={isBusy}>
                    <Text className="text-xs font-semibold text-destructive">{isBusy ? "…" : "Delete"}</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}

      <QuickEditListingSheet
        visible={quickEditListing !== null}
        listing={quickEditListing}
        onClose={() => setQuickEditListing(null)}
        onSaved={handleQuickEditSaved}
      />
    </SafeAreaView>
  );
}
