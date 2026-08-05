import { getPublicProfile, getSellerReviews, listListings, type Listing, type PublicProfile, type SellerReviewSummary } from "@reef-market/shared";
import { Image } from "expo-image";
import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, MessageCircle, Share2, Star } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { themeColors } from "@/lib/theme-colors";

export default function SellerStorefrontScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<SellerReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getPublicProfile(apiClient, id),
      listListings(apiClient, { seller_id: id, status: "active", sort: "newest", limit: 48 }),
      getSellerReviews(apiClient, id),
    ])
      .then(([profileRes, listingsRes, reviewsRes]) => {
        if (cancelled) return;
        setProfile(profileRes.profile);
        setListings(listingsRes.listings);
        setReviews(reviewsRes);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading || !profile) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={themeColors.primary} />
      </SafeAreaView>
    );
  }

  const meta = [profile.location, profile.country].filter(Boolean).join(", ");

  async function handleShare() {
    const url = `${process.env.EXPO_PUBLIC_API_URL}/sellers/${id}`;
    await Share.share({ message: `Check out ${profile?.display_name ?? "this seller"}'s storefront on Reef Market: ${url}`, url });
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
          <ArrowLeft size={20} color={themeColors.foreground} />
        </Pressable>
        <Text className="text-base font-semibold text-foreground flex-1">Store</Text>
        <Pressable onPress={handleShare} className="w-9 h-9 items-center justify-center">
          <Share2 size={18} color={themeColors.foreground} />
        </Pressable>
      </View>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{ gap: 12, paddingVertical: 12 }}
        ListHeaderComponent={
          <View className="px-4 pb-4">
            <View className="flex-row items-center gap-4">
              <View className="w-20 h-20 rounded-full overflow-hidden bg-muted items-center justify-center shrink-0">
                {profile.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={{ width: 80, height: 80 }} contentFit="cover" />
                ) : (
                  <Text className="text-3xl">👤</Text>
                )}
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2 flex-wrap">
                  <Text className="text-xl font-bold text-foreground">{profile.display_name ?? "Reef Market User"}</Text>
                  {profile.verified_seller && (
                    <View className="bg-emerald-100 rounded-full px-2 py-0.5">
                      <Text className="text-[10px] font-semibold text-emerald-800">✓ Verified</Text>
                    </View>
                  )}
                </View>
                <Text className="text-sm text-muted-foreground mt-1">
                  {meta}
                  {meta ? " · " : ""}
                  {profile.completed_sales_count} completed sales
                  {reviews && reviews.count > 0 && (
                    <>
                      {" · "}
                      {reviews.averageRating?.toFixed(1)} ★ ({reviews.count})
                    </>
                  )}
                </Text>
                {session && session.user.id !== profile.id && (
                  <Pressable
                    onPress={() => router.push(`/messages/new?to=${profile.id}`)}
                    className="flex-row items-center gap-1 self-start mt-2 border border-border rounded-xl px-3 py-1.5"
                  >
                    <MessageCircle size={13} color={themeColors.foreground} />
                    <Text className="text-xs font-semibold text-foreground">Message</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {profile.bio && <Text className="text-sm text-muted-foreground mt-4 leading-5">{profile.bio}</Text>}

            <Text className="text-base font-bold text-foreground mt-6">Active Listings</Text>
          </View>
        }
        ListEmptyComponent={<Text className="text-muted-foreground px-4">No active listings.</Text>}
        renderItem={({ item }) => (
          <Link href={`/listing/${item.id}`} asChild>
            <Pressable className="flex-1 rounded-xl overflow-hidden bg-card border border-border">
              <View className="aspect-square bg-muted">
                {item.photos[0] && <Image source={{ uri: item.photos[0] }} style={{ width: "100%", height: "100%" }} contentFit="cover" />}
              </View>
              <View className="p-3">
                <Text className="font-semibold text-sm text-foreground" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-sm font-bold text-foreground">${item.price.toFixed(2)}</Text>
              </View>
            </Pressable>
          </Link>
        )}
        ListFooterComponent={
          reviews && reviews.reviews.length > 0 ? (
            <View className="px-4 pt-6 gap-2">
              <Text className="text-base font-bold text-foreground mb-2">Reviews</Text>
              {reviews.reviews.map((review) => (
                <View key={review.id} className="rounded-xl border border-border bg-card p-3">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className="text-sm font-semibold text-foreground">{review.reviewer?.display_name ?? "Reef Market User"}</Text>
                    <View className="flex-row gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={12} color="#f59e0b" fill={s <= review.rating ? "#f59e0b" : "transparent"} />
                      ))}
                    </View>
                  </View>
                  {review.comment && <Text className="text-sm text-muted-foreground">{review.comment}</Text>}
                </View>
              ))}
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
