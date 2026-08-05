import {
  LISTING_TYPE_ICONS,
  getListing,
  getPublicProfile,
  getSellerReviews,
  type Listing,
  type PublicProfile,
  type SellerReviewSummary,
} from "@reef-market/shared";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertTriangle,
  ArrowLeft,
  Gauge,
  Heart,
  MapPin,
  MessageCircle,
  PackageX,
  RefreshCw,
  ScrollText,
  Shield,
  ShoppingBag,
  Star,
  Store,
  Sun,
  Truck,
  Wind,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { notify } from "@/lib/alert";
import { useAuth } from "@/lib/auth-context";
import { themeColors } from "@/lib/theme-colors";
import { useWatchlist } from "@/lib/use-watchlist";

const PLACEHOLDER_PHOTO = "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=800&q=80";

const DOA_POLICY_MAP: Record<
  string,
  { icon: typeof RefreshCw; color: string; bg: string; label: string; text: (listing: Listing) => string } | undefined
> = {
  full_refund: {
    icon: RefreshCw,
    color: "#059669",
    bg: "#ecfdf5",
    label: "Full Refund Policy",
    text: () => "Seller offers a full refund if the animal arrives dead. Photo proof required within 2 hours of delivery, item still in sealed bag.",
  },
  store_credit: {
    icon: ScrollText,
    color: "#2563eb",
    bg: "#eff6ff",
    label: "Store Credit Policy",
    text: () => "Seller offers store credit if the animal arrives dead. Photo proof required within 2 hours of delivery, item still in sealed bag.",
  },
  no_refund: {
    icon: PackageX,
    color: "#c2410c",
    bg: "#fff7ed",
    label: "No Refunds — Buyer's Risk",
    text: () => "This item is shipped at the buyer's risk. No refunds or credits are offered for DOA.",
  },
  custom: {
    icon: AlertTriangle,
    color: "#b45309",
    bg: "#fffbeb",
    label: "Seller's Arrival Policy",
    text: (listing) => listing.doa_policy_custom ?? "",
  },
};

function getShippingLabel(listing: Listing) {
  const tiers = [...listing.shipping_tiers].sort((a, b) => a.up_to_qty - b.up_to_qty);
  if (tiers.length > 0) {
    const minPrice = Math.min(...tiers.map((t) => t.price));
    return minPrice === 0 ? "free" : `from $${minPrice.toFixed(2)}`;
  }
  if (listing.shipping_cost > 0) return `$${listing.shipping_cost.toFixed(2)}`;
  return "included";
}

function DetailStat({ icon: Icon, iconColor, label, value }: { icon: typeof Sun; iconColor: string; label: string; value: string }) {
  return (
    <View className="flex-1 bg-muted rounded-xl p-3 items-center">
      <Icon size={18} color={iconColor} />
      <Text className="text-[10px] text-muted-foreground mt-1">{label}</Text>
      <Text className="text-xs font-semibold text-foreground capitalize mt-0.5">{value}</Text>
    </View>
  );
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { session } = useAuth();
  const { savedIds, toggle } = useWatchlist();

  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<PublicProfile | null>(null);
  const [reviews, setReviews] = useState<SellerReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { listing } = await getListing(apiClient, id);
        if (cancelled) return;
        setListing(listing);
        const [sellerRes, reviewsRes] = await Promise.all([
          getPublicProfile(apiClient, listing.seller_id),
          getSellerReviews(apiClient, listing.seller_id),
        ]);
        if (cancelled) return;
        setSeller(sellerRes.profile);
        setReviews(reviewsRes);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading || !listing) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={themeColors.primary} />
      </SafeAreaView>
    );
  }

  const photos = listing.photos.length ? listing.photos : [PLACEHOLDER_PHOTO];
  const isSaved = savedIds.has(listing.id);

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={{ width, height: width }} className="bg-muted">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          >
            {photos.map((photo, i) => (
              <Image key={i} source={{ uri: photo }} style={{ width, height: width }} contentFit="cover" />
            ))}
          </ScrollView>

          <SafeAreaView edges={["top"]} style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
            <View className="flex-row justify-between px-4 pt-2">
              <Pressable onPress={() => router.back()} className="w-9 h-9 rounded-full bg-black/40 items-center justify-center">
                <ArrowLeft size={18} color={themeColors.white} />
              </Pressable>
              {session && (
                <Pressable
                  testID="save-listing-detail"
                  onPress={() => toggle(listing.id, isSaved)}
                  className="w-9 h-9 rounded-full bg-black/40 items-center justify-center"
                >
                  <Heart size={18} color={isSaved ? "#ef4444" : themeColors.white} fill={isSaved ? "#ef4444" : "transparent"} />
                </Pressable>
              )}
            </View>
          </SafeAreaView>

          {photos.length > 1 && (
            <View style={{ position: "absolute", bottom: 12, left: 0, right: 0 }} className="flex-row justify-center gap-1.5">
              {photos.map((_, i) => (
                <View key={i} className={`w-2 h-2 rounded-full ${i === photoIndex ? "bg-white" : "bg-white/40"}`} />
              ))}
            </View>
          )}
        </View>

        <View className="px-4 pt-4 gap-4">
          <View>
            <View className="flex-row items-start justify-between gap-2">
              <Text className="text-xl font-bold text-foreground flex-1">{listing.title}</Text>
              <View className="items-end">
                <Text className="text-xl font-bold text-primary">${listing.price.toFixed(2)}</Text>
                {listing.pickup_price != null && listing.shipping_available && listing.local_pickup && (
                  <Text className="text-xs text-emerald-600 font-medium mt-0.5">
                    Pickup: ${listing.pickup_price.toFixed(2)}
                  </Text>
                )}
              </View>
            </View>
            <View className="flex-row flex-wrap items-center gap-2 mt-2">
              <View className="bg-secondary rounded-full px-2.5 py-1">
                <Text className="text-xs text-secondary-foreground">
                  {LISTING_TYPE_ICONS[listing.listing_type]} {listing.category}
                </Text>
              </View>
              {listing.wysiwyg && (
                <View className="bg-primary/10 rounded-full px-2.5 py-1" style={{ backgroundColor: "#0b81b71a" }}>
                  <Text className="text-xs text-primary font-semibold">WYSIWYG</Text>
                </View>
              )}
              {listing.difficulty && (
                <View className="border border-border rounded-full px-2.5 py-1">
                  <Text className="text-xs text-foreground capitalize">{listing.difficulty}</Text>
                </View>
              )}
            </View>
          </View>

          <View className="flex-row flex-wrap items-center gap-3">
            {listing.local_pickup && (
              <View className="flex-row items-center gap-1.5">
                <MapPin size={14} color={themeColors.mutedForeground} />
                <Text className="text-sm text-muted-foreground">
                  {listing.pickup_price != null && listing.shipping_available
                    ? `Pickup $${listing.pickup_price.toFixed(2)}`
                    : "Local pickup"}
                </Text>
              </View>
            )}
            {listing.shipping_available && (
              <View className="flex-row items-center gap-1.5">
                <Truck size={14} color={themeColors.mutedForeground} />
                <Text className="text-sm text-muted-foreground">
                  Shipping <Text className="font-semibold text-foreground">{getShippingLabel(listing)}</Text>
                </Text>
              </View>
            )}
            {listing.quantity > 0 && (
              <View className="border border-border rounded-full px-2.5 py-1">
                <Text className="text-xs text-foreground">{listing.quantity} in stock</Text>
              </View>
            )}
          </View>

          <View className="h-px bg-border" />

          {listing.listing_type === "coral" && (listing.light_requirement || listing.flow_requirement || listing.difficulty) && (
            <View className="flex-row gap-3">
              {listing.light_requirement && <DetailStat icon={Sun} iconColor="#f59e0b" label="Light" value={listing.light_requirement} />}
              {listing.flow_requirement && <DetailStat icon={Wind} iconColor="#3b82f6" label="Flow" value={listing.flow_requirement} />}
              {listing.difficulty && <DetailStat icon={Gauge} iconColor="#10b981" label="Difficulty" value={listing.difficulty} />}
            </View>
          )}

          {listing.listing_type === "fish" && (
            <View className="gap-2">
              {listing.temperament && (
                <View className="bg-muted rounded-xl p-3 flex-row justify-between">
                  <Text className="text-xs text-muted-foreground">Temperament</Text>
                  <Text className="text-sm font-semibold text-foreground capitalize">{listing.temperament}</Text>
                </View>
              )}
              {listing.tank_size_recommendation && (
                <View className="bg-muted rounded-xl p-3 flex-row justify-between">
                  <Text className="text-xs text-muted-foreground">Min Tank Size</Text>
                  <Text className="text-sm font-semibold text-foreground">{listing.tank_size_recommendation}</Text>
                </View>
              )}
              {listing.reef_safe !== null && (
                <View className="bg-muted rounded-xl p-3 flex-row items-center gap-2">
                  <Shield size={16} color={listing.reef_safe ? "#10b981" : themeColors.destructive} />
                  <Text className="text-sm font-semibold text-foreground">{listing.reef_safe ? "Reef Safe" : "Not Reef Safe"}</Text>
                </View>
              )}
            </View>
          )}

          {listing.listing_type === "equipment" && (listing.brand || listing.model || listing.condition) && (
            <View className="gap-2">
              {listing.brand && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted-foreground">Brand</Text>
                  <Text className="text-sm font-medium text-foreground">{listing.brand}</Text>
                </View>
              )}
              {listing.model && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted-foreground">Model</Text>
                  <Text className="text-sm font-medium text-foreground">{listing.model}</Text>
                </View>
              )}
              {listing.condition && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted-foreground">Condition</Text>
                  <Text className="text-sm font-medium text-foreground capitalize">{listing.condition.replace("_", " ")}</Text>
                </View>
              )}
            </View>
          )}

          {listing.description && (
            <View>
              <Text className="font-semibold text-sm text-foreground mb-1">Description</Text>
              <Text className="text-sm text-muted-foreground leading-5">{listing.description}</Text>
            </View>
          )}

          {listing.care_notes && (
            <View>
              <Text className="font-semibold text-sm text-foreground mb-1">Care Notes</Text>
              <Text className="text-sm text-muted-foreground leading-5">{listing.care_notes}</Text>
            </View>
          )}

          {listing.shipping_available &&
            listing.doa_policy &&
            listing.doa_policy !== "not_applicable" &&
            (() => {
              const policy = DOA_POLICY_MAP[listing.doa_policy];
              if (!policy) return null;
              const Icon = policy.icon;
              return (
                <View className="rounded-xl border border-border p-3" style={{ backgroundColor: policy.bg }}>
                  <View className="flex-row items-center gap-2 mb-1">
                    <Icon size={16} color={policy.color} />
                    <Text className="text-sm font-semibold" style={{ color: policy.color }}>
                      {policy.label}
                    </Text>
                  </View>
                  <Text className="text-xs text-muted-foreground leading-5">{policy.text(listing)}</Text>
                </View>
              );
            })()}

          <View className="h-px bg-border" />

          <View className="bg-muted rounded-2xl p-4 gap-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1">
                <View className="w-11 h-11 rounded-full items-center justify-center overflow-hidden" style={{ backgroundColor: "#0b81b71a" }}>
                  {seller?.avatar_url ? (
                    <Image source={{ uri: seller.avatar_url }} style={{ width: 44, height: 44 }} contentFit="cover" />
                  ) : (
                    <Text className="text-lg font-bold text-primary">{(seller?.display_name ?? "S")[0].toUpperCase()}</Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-sm text-foreground" numberOfLines={1}>
                    {seller?.display_name ?? "Reef Market User"}
                    {seller?.verified_seller ? " ✓" : ""}
                  </Text>
                  <Text className="text-[10px] text-muted-foreground">Member seller</Text>
                </View>
              </View>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => notify("Coming soon", "Seller storefronts land in a later milestone.")}
                  className="flex-row items-center gap-1 border border-border rounded-xl h-8 px-2.5"
                >
                  <Store size={13} color={themeColors.foreground} />
                  <Text className="text-xs font-semibold text-foreground">Store</Text>
                </Pressable>
                {session && session.user.id !== listing.seller_id && (
                  <Pressable
                    onPress={() => router.push(`/messages/new?to=${listing.seller_id}&listing=${listing.id}`)}
                    className="flex-row items-center gap-1 border border-border rounded-xl h-8 px-2.5"
                  >
                    <MessageCircle size={13} color={themeColors.foreground} />
                    <Text className="text-xs font-semibold text-foreground">Message</Text>
                  </Pressable>
                )}
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 bg-card rounded-xl p-3 items-center">
                <Text className="text-xl font-extrabold text-foreground">{seller?.completed_sales_count ?? 0}</Text>
                <Text className="text-[10px] text-muted-foreground mt-0.5">Completed Sales</Text>
              </View>
              <View className="flex-1 bg-card rounded-xl p-3 items-center">
                {reviews?.averageRating ? (
                  <>
                    <View className="flex-row items-center gap-1">
                      <Text className="text-xl font-extrabold text-foreground">{reviews.averageRating.toFixed(1)}</Text>
                      <Star size={14} color="#f59e0b" fill="#f59e0b" />
                    </View>
                    <Text className="text-[10px] text-muted-foreground mt-0.5">
                      {reviews.count} review{reviews.count !== 1 ? "s" : ""}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="text-xl font-extrabold text-muted-foreground">—</Text>
                    <Text className="text-[10px] text-muted-foreground mt-0.5">No reviews yet</Text>
                  </>
                )}
              </View>
            </View>

            {reviews && reviews.reviews.length > 0 && (
              <View className="gap-2">
                {reviews.reviews.slice(0, 3).map((r) => (
                  <View key={r.id} className="bg-card rounded-xl p-3">
                    <View className="flex-row items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={11} color="#f59e0b" fill={s <= r.rating ? "#f59e0b" : "transparent"} />
                      ))}
                      <Text className="text-[10px] text-muted-foreground ml-1">{r.reviewer?.display_name ?? "Buyer"}</Text>
                    </View>
                    {r.comment && <Text className="text-xs text-muted-foreground leading-4">{r.comment}</Text>}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={["bottom"]} className="absolute bottom-0 left-0 right-0 bg-card border-t border-border px-4 pt-3">
        <View className="flex-row gap-3 pb-3">
          <Pressable
            onPress={() => notify("Coming soon", "Seller storefronts land in a later milestone.")}
            className="h-12 px-4 rounded-xl border border-border items-center justify-center flex-row gap-1.5"
          >
            <Store size={16} color={themeColors.foreground} />
            <Text className="text-sm font-bold text-foreground">Store</Text>
          </Pressable>
          <Pressable
            onPress={() => notify("Coming soon", "Checkout lands in a later milestone.")}
            disabled={listing.status !== "active" || listing.quantity <= 0}
            className={`flex-1 h-12 rounded-xl items-center justify-center flex-row gap-2 ${
              listing.status !== "active" || listing.quantity <= 0 ? "bg-muted" : "bg-primary"
            }`}
          >
            {listing.status !== "active" || listing.quantity <= 0 ? (
              <Text className="text-base font-bold text-muted-foreground">Out of Stock</Text>
            ) : (
              <>
                <ShoppingBag size={18} color={themeColors.white} />
                <Text className="text-base font-bold text-white">Buy Now</Text>
              </>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
