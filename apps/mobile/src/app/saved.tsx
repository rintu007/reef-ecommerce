import { listWatchlist, type Listing } from "@reef-market/shared";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ListingCard } from "@/components/ListingCard";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";
import { useWatchlist } from "@/lib/use-watchlist";
import { safeGoBack } from "@/lib/navigation";

export default function SavedListingsScreen() {
  const router = useRouter();
  const { savedIds, toggle } = useWatchlist();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { listings } = await listWatchlist(apiClient);
      setListings(listings);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(load, 0);
      return () => clearTimeout(timer);
    }, [load]),
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
        <Pressable onPress={() => safeGoBack(router)} className="w-9 h-9 items-center justify-center -ml-2">
          <ArrowLeft size={20} color={themeColors.foreground} />
        </Pressable>
        <Text className="text-base font-semibold text-foreground">Saved Listings</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          data={listings}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ gap: 12, paddingVertical: 12 }}
          ListEmptyComponent={
            <View className="items-center py-24 px-6">
              <Text className="text-muted-foreground text-center">
                Nothing saved yet. Browse listings and tap the heart to save them here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ListingCard listing={item} isSaved={savedIds.has(item.id)} showSave onToggleSave={() => toggle(item.id, savedIds.has(item.id))} />
          )}
        />
      )}
    </SafeAreaView>
  );
}
