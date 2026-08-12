import { listListings, type Listing } from "@reef-market/shared";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { BookOpen, ChevronRight, ShoppingBag, Waves } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";

const PLACEHOLDER_PHOTO = "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=400&q=80";

/**
 * Legacy parity: legacy/vite-app/src/components/home/MarketSelector.jsx +
 * pages/Home.jsx — a real Home landing screen distinct from Browse, with a
 * hero, Browse/Sell/Learn quick actions, and Saltwater/Freshwater category
 * cards each with a "New" preview row. Simplified vs. legacy: the
 * quick-action cards here just navigate to the real Browse/Sell/Learn
 * screens instead of duplicating a second copy of their content inline
 * (legacy's inline mini-Sell-grid and mini-Learn-topic-list existed because
 * MarketSelector predates this rebuild's full Sell/Learn screens — linking
 * out avoids maintaining two copies of the same content). Solid-color
 * gradients replace legacy's hotlinked stock photography for the category
 * cards, for the same reason apps/mobile avoids other external image deps.
 */
function PreviewRow({ market, label, color }: { market: "saltwater" | "freshwater"; label: string; color: string }) {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    listListings(apiClient, { market, sort: "newest", limit: 6 })
      .then((res) => setListings(res.listings))
      .catch(() => setListings([]));
  }, [market]);

  if (listings.length === 0) return null;

  return (
    <View className="mt-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs font-bold text-white/70 uppercase tracking-widest">{label} · New</Text>
        <Pressable
          onPress={() => router.push({ pathname: "/(tabs)/browse", params: { market } })}
          className="flex-row items-center gap-0.5"
        >
          <Text className="text-xs text-white/90 font-semibold">See all</Text>
          <ChevronRight size={12} color={themeColors.white} />
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {listings.map((listing) => (
          <Pressable
            key={listing.id}
            onPress={() => router.push(`/listing/${listing.id}`)}
            className="w-[130px] rounded-xl overflow-hidden bg-white/10"
          >
            <View className="w-full h-[90px]">
              <Image source={{ uri: listing.photos[0] || PLACEHOLDER_PHOTO }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
            </View>
            <View className="p-2">
              <Text className="text-white text-xs font-semibold" numberOfLines={1}>
                {listing.title}
              </Text>
              <Text className="text-white/80 text-xs font-bold mt-0.5">${listing.price.toFixed(2)}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function CategoryCard({
  emoji,
  label,
  subtitle,
  colors,
  market,
}: {
  emoji: string;
  label: string;
  subtitle: string;
  colors: [string, string];
  market: "saltwater" | "freshwater";
}) {
  const router = useRouter();
  return (
    <View className="bg-white/10 rounded-3xl p-4 border border-white/10">
      <Pressable onPress={() => router.push({ pathname: "/(tabs)/browse", params: { market } })}>
        <LinearGradient colors={colors} style={{ borderRadius: 16, height: 140, alignItems: "center", justifyContent: "center", gap: 4 }}>
          <Text style={{ fontSize: 44 }}>{emoji}</Text>
          <Text className="text-white text-xl font-extrabold">{label}</Text>
          <View className="bg-black/20 rounded-full px-3 py-0.5">
            <Text className="text-white/90 text-xs font-medium">{subtitle}</Text>
          </View>
        </LinearGradient>
      </Pressable>
      <PreviewRow market={market} label={label} color={colors[0]} />
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <LinearGradient colors={[themeColors.primary, "#0a4a6b"]} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="px-5 pt-6 pb-4 items-center">
            <View className="flex-row items-center gap-2 mb-1">
              <Text style={{ fontSize: 22 }}>🪸</Text>
              <Text className="text-3xl font-extrabold text-white tracking-tight">Reef Market</Text>
            </View>
            <Text className="text-white/70 text-sm font-medium">The aquarium hobbyist marketplace</Text>
          </View>

          <View className="flex-row mx-5 gap-2 mb-5">
            <Pressable onPress={() => router.push("/(tabs)/browse")} className="flex-1 h-16 rounded-2xl bg-white/15 items-center justify-center gap-1">
              <Waves size={18} color={themeColors.white} />
              <Text className="text-white font-bold text-xs">Browse</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/(tabs)/sell")} className="flex-1 h-16 rounded-2xl bg-white/15 items-center justify-center gap-1">
              <ShoppingBag size={18} color={themeColors.white} />
              <Text className="text-white font-bold text-xs">Sell</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/learn")} className="flex-1 h-16 rounded-2xl bg-white/15 items-center justify-center gap-1">
              <BookOpen size={18} color={themeColors.white} />
              <Text className="text-white font-bold text-xs">Learn</Text>
            </Pressable>
          </View>

          <View className="items-center mb-4">
            <Text className="text-lg font-extrabold text-white">What are you shopping for?</Text>
            <Text className="text-white/50 text-xs mt-0.5">Tap a market to start browsing</Text>
          </View>

          <View className="px-5 gap-4">
            <CategoryCard
              emoji="🪸"
              label="Saltwater"
              subtitle="Corals · Reef Fish · Equipment"
              colors={["#0ea5c9", "#0b3d6b"]}
              market="saltwater"
            />
            <CategoryCard
              emoji="🐟"
              label="Freshwater"
              subtitle="Fish · Amphibians · Plants · Equipment"
              colors={["#16a34a", "#064e3b"]}
              market="freshwater"
            />
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
