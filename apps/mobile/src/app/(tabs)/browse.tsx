import {
  ALL_CATEGORIES,
  FRESHWATER_TYPES,
  LISTING_TYPE_LABELS,
  SALTWATER_TYPES,
  listListings,
  useT,
  type Listing,
  type ListingType,
} from "@reef-market/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Location from "expo-location";
import { ShoppingCart, SlidersHorizontal, Search, X, MapPin } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useLanguagePrefs } from "@/lib/language-context";
import { themeColors } from "@/lib/theme-colors";
import { useWatchlist } from "@/lib/use-watchlist";
import { ListingCard } from "@/components/ListingCard";
import { ListingGridSkeleton } from "@/components/ListingCardSkeleton";

type Market = "saltwater" | "freshwater";

const RADIUS_OPTIONS = [5, 10, 25, 50, 100, 150, 200];

const SORT_OPTIONS: { value: "newest" | "price_low" | "price_high" | "featured"; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "featured", label: "⭐ Featured" },
  { value: "price_low", label: "Price ↑" },
  { value: "price_high", label: "Price ↓" },
];

function Pill({ label, active, activeClassName, onPress }: { label: string; active: boolean; activeClassName?: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-3 py-2 rounded-full ${active ? activeClassName ?? "bg-primary" : "bg-muted"}`}
    >
      <Text className={`text-xs font-semibold ${active ? "text-primary-foreground" : "text-muted-foreground"}`}>{label}</Text>
    </Pressable>
  );
}

export default function BrowseScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { savedIds, toggle } = useWatchlist();
  const { count: cartCount } = useCart();
  const { lang } = useLanguagePrefs();
  const t = useT(lang);
  const params = useLocalSearchParams<{ market?: string }>();

  const [market, setMarket] = useState<Market>(params.market === "freshwater" ? "freshwater" : "saltwater");
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<ListingType | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [shippingFilter, setShippingFilter] = useState<"local_pickup" | "shipping" | null>(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<"newest" | "price_low" | "price_high" | "featured">("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [zipInput, setZipInput] = useState("");
  const [radiusMiles, setRadiusMiles] = useState("50");
  const [locationFilter, setLocationFilter] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const availableTypes = market === "saltwater" ? SALTWATER_TYPES : FRESHWATER_TYPES;
  const availableCategories = typeFilter ? ALL_CATEGORIES[typeFilter] : null;

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const { listings, total } = await listListings(apiClient, {
          market,
          listing_type: typeFilter ?? undefined,
          category: categoryFilter ?? undefined,
          q: q.trim() || undefined,
          min_price: minPrice ? Number(minPrice) : undefined,
          max_price: maxPrice ? Number(maxPrice) : undefined,
          shipping: shippingFilter ?? undefined,
          sort,
          limit: 40,
          lat: locationFilter?.lat,
          lng: locationFilter?.lng,
          radius_miles: locationFilter ? Number(radiusMiles) : undefined,
        });
        setListings(listings);
        setTotal(total);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [market, typeFilter, categoryFilter, q, minPrice, maxPrice, shippingFilter, sort, locationFilter, radiusMiles],
  );

  useEffect(() => {
    const timer = setTimeout(load, q ? 350 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market, typeFilter, categoryFilter, q, minPrice, maxPrice, shippingFilter, sort, locationFilter, radiusMiles]);

  async function handleZipSearch() {
    const zip = zipInput.trim();
    if (!zip) return;
    setGeoError(null);
    setGeoLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zip)}&country=US&format=json&limit=1`,
      );
      const data = await res.json();
      const first = data?.[0];
      if (!first) {
        setGeoError("ZIP code not found");
        return;
      }
      setLocationFilter({ lat: Number(first.lat), lng: Number(first.lon), label: `ZIP ${zip}` });
      setShippingFilter("local_pickup");
    } catch {
      setGeoError("Couldn't look up that ZIP code. Please try again.");
    } finally {
      setGeoLoading(false);
    }
  }

  async function handleUseMyLocation() {
    setGeoError(null);
    setGeoLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setGeoError("Location permission denied");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setLocationFilter({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "My Location" });
      setShippingFilter("local_pickup");
      setZipInput("");
    } catch {
      setGeoError("Couldn't get your location");
    } finally {
      setGeoLoading(false);
    }
  }

  function clearLocationFilter() {
    setLocationFilter(null);
    setZipInput("");
  }

  const hasActiveFilters = !!(typeFilter || categoryFilter || shippingFilter || minPrice || maxPrice || locationFilter);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <View className="border-b border-border bg-card px-4 pt-3 pb-2 gap-2">
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center bg-muted rounded-xl px-3 h-10">
            <Search size={16} color={themeColors.mutedForeground} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder={t("search_placeholder")}
              placeholderTextColor={themeColors.mutedForeground}
              className="flex-1 ml-2 text-sm text-foreground"
            />
            {q.length > 0 && (
              <Pressable onPress={() => setQ("")}>
                <X size={16} color={themeColors.mutedForeground} />
              </Pressable>
            )}
          </View>
          <Pressable
            testID="filter-toggle"
            onPress={() => setShowFilters((s) => !s)}
            className={`w-10 h-10 rounded-xl items-center justify-center ${showFilters ? "bg-primary" : "bg-muted"}`}
          >
            <SlidersHorizontal size={16} color={showFilters ? themeColors.white : themeColors.mutedForeground} />
          </Pressable>
          <Pressable testID="cart-button" onPress={() => router.push("/cart")} className="w-10 h-10 rounded-xl bg-muted items-center justify-center">
            <ShoppingCart size={16} color={themeColors.mutedForeground} />
            {cartCount > 0 && (
              <View className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-primary items-center justify-center px-1">
                <Text className="text-[9px] font-bold text-primary-foreground">{cartCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <View className="flex-row items-center gap-1.5">
          <Pill label="🪸 Salt" active={market === "saltwater"} onPress={() => { setMarket("saltwater"); setTypeFilter(null); setCategoryFilter(null); }} />
          <Pill label="🐟 Fresh" active={market === "freshwater"} activeClassName="bg-emerald-600" onPress={() => { setMarket("freshwater"); setTypeFilter(null); setCategoryFilter(null); }} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, flexGrow: 1, justifyContent: "flex-end" }}>
            {SORT_OPTIONS.map((opt) => (
              <Pill key={opt.value} label={opt.label} active={sort === opt.value} activeClassName="bg-foreground" onPress={() => setSort(opt.value)} />
            ))}
          </ScrollView>
        </View>

        {showFilters && (
          <View className="gap-2 pt-1">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              <Pill label={t("all_types")} active={!typeFilter} onPress={() => { setTypeFilter(null); setCategoryFilter(null); }} />
              {availableTypes.map((type) => (
                <Pill key={type} label={LISTING_TYPE_LABELS[type]} active={typeFilter === type} onPress={() => { setTypeFilter(type); setCategoryFilter(null); }} />
              ))}
            </ScrollView>

            {availableCategories && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                <Pill label={t("all_categories")} active={!categoryFilter} onPress={() => setCategoryFilter(null)} />
                {availableCategories.map((cat) => (
                  <Pill key={cat} label={cat} active={categoryFilter === cat} onPress={() => setCategoryFilter(cat)} />
                ))}
              </ScrollView>
            )}

            <View className="flex-row items-center gap-2">
              <Pill label={t("any_delivery")} active={!shippingFilter} onPress={() => { if (!locationFilter) setShippingFilter(null); }} />
              <Pill label={t("local_pickup")} active={shippingFilter === "local_pickup"} onPress={() => setShippingFilter("local_pickup")} />
              <Pill label={t("ships_to_me")} active={shippingFilter === "shipping"} onPress={() => { if (!locationFilter) setShippingFilter("shipping"); }} />
            </View>

            <View className="flex-row items-center gap-2">
              <TextInput
                value={minPrice}
                onChangeText={setMinPrice}
                placeholder="Min $"
                placeholderTextColor={themeColors.mutedForeground}
                keyboardType="numeric"
                className="flex-1 h-10 rounded-lg bg-muted px-3 text-sm text-foreground"
              />
              <Text className="text-muted-foreground">–</Text>
              <TextInput
                value={maxPrice}
                onChangeText={setMaxPrice}
                placeholder="Max $"
                placeholderTextColor={themeColors.mutedForeground}
                keyboardType="numeric"
                className="flex-1 h-10 rounded-lg bg-muted px-3 text-sm text-foreground"
              />
            </View>

            <View className="gap-2 pt-1 border-t border-border">
              <Text className="text-xs font-semibold text-muted-foreground">Search by location</Text>
              <View className="flex-row items-center gap-2">
                <TextInput
                  testID="zip-input"
                  value={zipInput}
                  onChangeText={setZipInput}
                  placeholder="ZIP code"
                  placeholderTextColor={themeColors.mutedForeground}
                  keyboardType="numeric"
                  className="flex-1 h-10 rounded-lg bg-muted px-3 text-sm text-foreground"
                />
                <Pressable
                  testID="zip-search-button"
                  onPress={handleZipSearch}
                  disabled={geoLoading}
                  className="h-10 px-3 rounded-lg bg-primary items-center justify-center"
                >
                  <Text className="text-xs font-semibold text-primary-foreground">Search</Text>
                </Pressable>
                <Pressable
                  testID="use-my-location-button"
                  onPress={handleUseMyLocation}
                  disabled={geoLoading}
                  className="h-10 px-3 rounded-lg bg-muted flex-row items-center gap-1 justify-center"
                >
                  <MapPin size={14} color={themeColors.mutedForeground} />
                  <Text className="text-xs font-semibold text-muted-foreground">{geoLoading ? t("locating") : t("near_me")}</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {RADIUS_OPTIONS.map((r) => (
                  <Pill key={r} label={`${r} mi`} active={radiusMiles === String(r)} onPress={() => setRadiusMiles(String(r))} />
                ))}
              </ScrollView>
              {geoError && <Text className="text-xs text-red-600">{geoError}</Text>}
            </View>
          </View>
        )}
      </View>

      {hasActiveFilters && (
        <View className="flex-row flex-wrap gap-2 px-4 pt-3">
          {typeFilter && (
            <Pressable onPress={() => { setTypeFilter(null); setCategoryFilter(null); }} className="flex-row items-center gap-1 bg-secondary rounded-full px-2.5 py-1">
              <Text className="text-xs text-secondary-foreground">{LISTING_TYPE_LABELS[typeFilter]}</Text>
              <X size={11} color={themeColors.mutedForeground} />
            </Pressable>
          )}
          {categoryFilter && (
            <Pressable onPress={() => setCategoryFilter(null)} className="flex-row items-center gap-1 bg-secondary rounded-full px-2.5 py-1">
              <Text className="text-xs text-secondary-foreground">{categoryFilter}</Text>
              <X size={11} color={themeColors.mutedForeground} />
            </Pressable>
          )}
          {shippingFilter && (
            <Pressable onPress={() => setShippingFilter(null)} className="flex-row items-center gap-1 bg-secondary rounded-full px-2.5 py-1">
              <Text className="text-xs text-secondary-foreground">{shippingFilter === "local_pickup" ? "Local Pickup" : "Ships to Me"}</Text>
              <X size={11} color={themeColors.mutedForeground} />
            </Pressable>
          )}
          {(minPrice || maxPrice) && (
            <Pressable onPress={() => { setMinPrice(""); setMaxPrice(""); }} className="flex-row items-center gap-1 bg-secondary rounded-full px-2.5 py-1">
              <Text className="text-xs text-secondary-foreground">${minPrice || "0"} – ${maxPrice || "∞"}</Text>
              <X size={11} color={themeColors.mutedForeground} />
            </Pressable>
          )}
          {locationFilter && (
            <Pressable testID="location-filter-chip" onPress={clearLocationFilter} className="flex-row items-center gap-1 bg-secondary rounded-full px-2.5 py-1">
              <Text className="text-xs text-secondary-foreground">{locationFilter.label} — within {radiusMiles}mi</Text>
              <X size={11} color={themeColors.mutedForeground} />
            </Pressable>
          )}
        </View>
      )}

      {loading ? (
        <ListingGridSkeleton />
      ) : (
        <FlatList
          data={listings}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ gap: 12, paddingVertical: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={themeColors.primary} />}
          ListHeaderComponent={
            <Text className="text-xs text-muted-foreground px-0.5 pb-1">
              {total} listing{total === 1 ? "" : "s"}
            </Text>
          }
          ListEmptyComponent={
            <View className="items-center py-24 px-6">
              <Text className="text-base text-foreground mb-1">{t("no_listings")}</Text>
              <Text className="text-sm text-muted-foreground">{t("try_filters")}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              isSaved={savedIds.has(item.id)}
              showSave={!!session}
              onToggleSave={() => toggle(item.id, savedIds.has(item.id))}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
