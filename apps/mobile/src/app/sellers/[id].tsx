import {
  getPublicProfile,
  getSellerReviews,
  listListings,
  LISTING_TYPE_ICONS,
  LISTING_TYPE_LABELS,
  type Listing,
  type PublicProfile,
  type SellerReviewSummary,
} from "@reef-market/shared";
import { Image } from "expo-image";
import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Check, MessageCircle, Share2, Star } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { themeColors } from "@/lib/theme-colors";

export default function SellerStorefrontScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const { addItem } = useCart();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<SellerReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const availableTypes = useMemo(() => ["all", ...Array.from(new Set(listings.map((l) => l.listing_type)))], [listings]);

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
  const canSelect = !session || session.user.id !== profile.id;

  async function handleShare() {
    const url = `${process.env.EXPO_PUBLIC_API_URL}/sellers/${id}`;
    await Share.share({ message: `Check out ${profile?.display_name ?? "this seller"}'s storefront on Reef Market: ${url}`, url });
  }

  function toggleSelect(listing: Listing) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(listing.id)) next.delete(listing.id);
      else next.add(listing.id);
      return next;
    });
  }

  const selectedListings = listings.filter((l) => selectedIds.has(l.id));
  const cartTotal = selectedListings.reduce((sum, l) => sum + l.price, 0);

  function handleAddToCart() {
    for (const listing of selectedListings) {
      addItem({
        listingId: listing.id,
        quantity: listing.min_qty,
        shippingMethod: listing.shipping_available ? "shipping" : "local_pickup",
        pickupTime: listing.pickup_times[0],
      });
    }
    setSelectedIds(new Set());
    router.push("/cart");
  }

  const filteredListings = activeTab === "all" ? listings : listings.filter((l) => l.listing_type === activeTab);

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
        data={filteredListings}
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

            <Text className="text-base font-bold text-foreground mt-6 mb-2">Active Listings</Text>
            {availableTypes.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {availableTypes.map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setActiveTab(t)}
                    className={`px-3 py-1.5 rounded-full border ${
                      activeTab === t ? "bg-primary border-primary" : "border-border bg-card"
                    }`}
                  >
                    <Text className={`text-xs font-medium ${activeTab === t ? "text-white" : "text-muted-foreground"}`}>
                      {t === "all"
                        ? `All (${listings.length})`
                        : `${LISTING_TYPE_ICONS[t as keyof typeof LISTING_TYPE_ICONS]} ${LISTING_TYPE_LABELS[t as keyof typeof LISTING_TYPE_LABELS]} (${listings.filter((l) => l.listing_type === t).length})`}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            {canSelect && listings.length > 0 && (
              <Text className="text-xs text-muted-foreground mt-2">
                Tap the circle on a listing to select multiple items and check out together.
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={<Text className="text-muted-foreground px-4">No active listings.</Text>}
        renderItem={({ item }) => {
          const selected = selectedIds.has(item.id);
          const soldOut = item.quantity <= 0;
          return (
            <View className={`flex-1 rounded-xl overflow-hidden bg-card border ${selected ? "border-primary" : "border-border"} ${soldOut ? "opacity-60" : ""}`}>
              {canSelect && !soldOut && (
                <Pressable
                  onPress={() => toggleSelect(item)}
                  className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-full border-2 items-center justify-center ${
                    selected ? "bg-primary border-primary" : "bg-white/90 border-border"
                  }`}
                >
                  {selected && <Check size={14} color={themeColors.white} />}
                </Pressable>
              )}
              <Link href={`/listing/${item.id}`} asChild>
                <Pressable>
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
            </View>
          );
        }}
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

      {selectedIds.size > 0 && (
        <View className="absolute bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="text-sm font-bold text-foreground">
              {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected
            </Text>
            <Text className="text-xs text-muted-foreground">Total: ${cartTotal.toFixed(2)}</Text>
          </View>
          <Pressable onPress={handleAddToCart} className="bg-primary rounded-xl px-5 py-2.5">
            <Text className="text-sm font-semibold text-white">Add to Cart</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
