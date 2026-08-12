import { HELP_CATEGORIES, listListings, type Listing } from "@reef-market/shared";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { BookOpen, ChevronRight, ShoppingBag, Star, Waves } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";

const PLACEHOLDER_PHOTO = "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=400&q=80";

type HomeTab = "browse" | "sell" | "learn";

const TAB_ACCENT: Record<HomeTab, string> = {
  browse: "#0ea5c9",
  sell: "#f97316",
  learn: "#16a34a",
};

const SELL_CATEGORIES: { emoji: string; label: string; desc: string; colors: [string, string] }[] = [
  { emoji: "🪸", label: "Corals", desc: "Frags & colonies", colors: ["#0ea5c9", "#0b3d6b"] },
  { emoji: "🐠", label: "Reef Fish", desc: "Clownfish, tangs...", colors: ["#f97316", "#9f1239"] },
  { emoji: "🐟", label: "FW Fish", desc: "Cichlids, bettas...", colors: ["#16a34a", "#064e3b"] },
  { emoji: "🦎", label: "Amphibians", desc: "Axolotls, frogs...", colors: ["#65a30d", "#14532d"] },
  { emoji: "🔧", label: "Equipment", desc: "Tanks, lights, pumps", colors: ["#475569", "#0f172a"] },
  { emoji: "🌿", label: "Plants & More", desc: "Plants, inverts, food", colors: ["#0d9488", "#134e4a"] },
];

/**
 * Legacy parity: legacy/vite-app/src/components/home/MarketSelector.jsx +
 * pages/Home.jsx — a real Home landing screen distinct from Browse, with a
 * hero, Browse/Sell/Learn tabs, and Saltwater/Freshwater category cards each
 * with a "New" preview row. The three tabs switch content in place (matching
 * legacy) rather than navigating away immediately — tapping "Sell" used to
 * jump straight to a sign-in/agreement wall, which was a parity gap: legacy
 * shows a category teaser first and only requires auth once the user picks a
 * category or taps "Create a Listing". Solid-color gradients replace
 * legacy's hotlinked stock photography for the category cards, for the same
 * reason apps/mobile avoids other external image deps.
 */
function PreviewRow({ market, label }: { market: "saltwater" | "freshwater"; label: string }) {
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
      <PreviewRow market={market} label={label} />
    </View>
  );
}

function BrowseTabContent() {
  return (
    <>
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
    </>
  );
}

function SellTabContent() {
  const router = useRouter();
  return (
    <View className="px-5 gap-5">
      <View className="items-center">
        <Text className="text-xl font-extrabold text-white">Start Selling Today</Text>
        <Text className="text-white/60 text-sm mt-1">List corals, fish, amphibians & gear</Text>
      </View>

      <View className="flex-row flex-wrap gap-3">
        {SELL_CATEGORIES.map((cat) => (
          <Pressable key={cat.label} onPress={() => router.push("/listing/new")} className="rounded-2xl overflow-hidden" style={{ width: "47%" }}>
            <LinearGradient colors={cat.colors} style={{ height: 110, padding: 10, justifyContent: "flex-end" }}>
              <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
              <Text className="text-white text-sm font-bold mt-0.5">{cat.label}</Text>
              <Text className="text-white/70 text-[10px]">{cat.desc}</Text>
            </LinearGradient>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => router.push("/listing/new")}
        className="h-14 rounded-2xl bg-white items-center justify-center flex-row gap-2"
      >
        <ShoppingBag size={18} color="#0f172a" />
        <Text className="text-slate-900 font-extrabold text-base">Create a Listing</Text>
      </Pressable>

      <View className="bg-white/10 rounded-2xl p-4 border border-white/10">
        <View className="flex-row items-center gap-1.5 mb-2">
          <Star size={16} color="#facc15" />
          <Text className="text-white font-bold">Why sell here?</Text>
        </View>
        <View className="gap-1.5">
          {[
            "Built for aquarium hobbyists",
            "Buyer protection on every order",
            "Easy photo uploads & listing tools",
            "Reach thousands of buyers nationwide",
          ].map((line) => (
            <Text key={line} className="text-white/70 text-sm">
              ✅ {line}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function LearnTabContent() {
  const router = useRouter();
  return (
    <View className="px-5 gap-3">
      <View className="items-center mb-2">
        <Text className="text-xl font-extrabold text-white">Learn & Explore</Text>
        <Text className="text-white/60 text-sm mt-1">Guides, tips & care info for hobbyists</Text>
      </View>

      {HELP_CATEGORIES.slice(0, 6).map((cat) => (
        <Pressable
          key={cat.value}
          onPress={() => router.push("/learn")}
          className="rounded-2xl h-16 bg-white/10 border border-white/10 flex-row items-center px-4 gap-3"
        >
          <Text style={{ fontSize: 26 }}>{cat.icon}</Text>
          <Text className="text-white font-bold text-sm flex-1">{cat.label}</Text>
          <ChevronRight size={18} color="rgba(255,255,255,0.5)" />
        </Pressable>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<HomeTab>("browse");

  const tabs: { id: HomeTab; label: string; icon: typeof Waves }[] = [
    { id: "browse", label: "Browse", icon: Waves },
    { id: "sell", label: "Sell", icon: ShoppingBag },
    { id: "learn", label: "Learn", icon: BookOpen },
  ];

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
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <Pressable
                  key={tab.id}
                  testID={`home-tab-${tab.id}`}
                  onPress={() => setActiveTab(tab.id)}
                  className="flex-1 h-16 rounded-2xl items-center justify-center gap-1"
                  style={{
                    backgroundColor: isActive ? TAB_ACCENT[tab.id] : "rgba(255,255,255,0.15)",
                    borderWidth: isActive ? 1 : 0,
                    borderColor: "rgba(255,255,255,0.6)",
                  }}
                >
                  <Icon size={18} color={themeColors.white} />
                  <Text className="text-white font-bold text-xs">{tab.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {activeTab === "browse" && <BrowseTabContent />}
          {activeTab === "sell" && <SellTabContent />}
          {activeTab === "learn" && <LearnTabContent />}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
