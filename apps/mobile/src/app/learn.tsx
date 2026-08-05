import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ArrowLeft, BookOpen, ChevronRight, HelpCircle, Lightbulb, Play } from "lucide-react-native";
import { HELP_CATEGORIES, listHelpContent, type HelpContent } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";

// Ported from legacy/vite-app/src/pages/Learn.jsx's CATEGORY_VISUALS.
const CATEGORY_VISUALS: Record<string, { bg: string; desc: string }> = {
  coral_care: { bg: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=800&q=80", desc: "Lighting, flow, placement & fragging tips" },
  fish_care: { bg: "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=800&q=80", desc: "Species profiles, compatibility & tank sizing" },
  beginner_setup: { bg: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&q=80", desc: "Start your reef journey right" },
  fragging_tips: { bg: "https://images.unsplash.com/photo-1559825481-12a05cc00344?w=800&q=80", desc: "Propagate & trade corals like a pro" },
  lighting_flow: { bg: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80", desc: "PAR, spectrum, flow rates & placement" },
  water_chemistry: { bg: "https://images.unsplash.com/photo-1565120130276-dfbd9a7a3ad7?w=800&q=80", desc: "Alk, calcium, magnesium & more" },
  pest_prevention: { bg: "https://images.unsplash.com/photo-1620503374956-c942862f0372?w=800&q=80", desc: "Ich, velvet, water quality issues & fixes" },
  shipping_acclimation: { bg: "https://images.unsplash.com/photo-1570824104453-508955ab713e?w=800&q=80", desc: "Safe transport & drip acclimation" },
  maintenance: { bg: "https://images.unsplash.com/photo-1556761223-4c4282c73f77?w=800&q=80", desc: "Filters, lights, skimmers, dosing & more" },
};

const TYPE_ICONS = { video: Play, article: BookOpen, tip: Lightbulb, faq: HelpCircle };

function itemCategories(item: HelpContent): string[] {
  return [item.category, ...item.categories];
}

export default function LearnScreen() {
  const [items, setItems] = useState<HelpContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    listHelpContent(apiClient)
      .then((res) => setItems(res.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (selected) {
    const catInfo = HELP_CATEGORIES.find((c) => c.value === selected);
    const categoryItems = items.filter((item) => itemCategories(item).includes(selected));

    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
          <Pressable testID="learn-category-back" onPress={() => setSelected(null)} className="p-1 -ml-1">
            <ArrowLeft size={20} color={themeColors.foreground} />
          </Pressable>
          <View>
            <Text className="font-bold text-base text-foreground">
              {catInfo?.icon} {catInfo?.label}
            </Text>
            <Text className="text-xs text-muted-foreground">
              {categoryItems.length} guide{categoryItems.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {categoryItems.length === 0 ? (
          <View className="items-center py-20 px-6">
            <BookOpen size={40} color={themeColors.mutedForeground} />
            <Text className="text-sm text-muted-foreground mt-3">No content yet. Check back soon!</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
            {categoryItems.map((item) => {
              const Icon = TYPE_ICONS[item.content_type] ?? BookOpen;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => item.youtube_url && WebBrowser.openBrowserAsync(item.youtube_url)}
                  className="bg-card border border-border rounded-xl overflow-hidden"
                >
                  {item.thumbnail_url && (
                    <Image source={{ uri: item.thumbnail_url }} style={{ width: "100%", height: 160 }} contentFit="cover" />
                  )}
                  <View className="p-4">
                    <View className="flex-row items-center gap-1.5 mb-2">
                      <Icon size={12} color={themeColors.mutedForeground} />
                      <Text className="text-[10px] font-semibold text-muted-foreground uppercase">{item.content_type}</Text>
                    </View>
                    <Text className="font-bold text-base text-foreground">{item.title}</Text>
                    {item.body && (
                      <Text className="text-sm text-muted-foreground mt-2" numberOfLines={3}>
                        {item.body}
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="overflow-hidden">
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1200&q=80" }}
            style={{ position: "absolute", width: "100%", height: "100%", opacity: 0.2 }}
            contentFit="cover"
          />
          <LinearGradient
            colors={["rgba(11,129,183,0.9)", "rgba(11,129,183,0.6)"]}
            style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
          >
            <Pressable testID="learn-hero-back" onPress={() => router.back()} className="mb-3 self-start p-1 -ml-1">
              <ArrowLeft size={20} color={themeColors.white} />
            </Pressable>
            <Text className="text-3xl text-center text-white mb-1">≋</Text>
            <Text className="text-2xl font-extrabold text-white text-center">Learn & Explore</Text>
            <Text className="text-sm text-white/80 text-center mt-1">Guides, tips & care info for hobbyists</Text>
          </LinearGradient>
        </View>

        <View className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex-row gap-3">
          <Text className="text-xl">🚧</Text>
          <View className="flex-1">
            <Text className="text-sm font-bold text-amber-900">We&apos;re building our help library!</Text>
            <Text className="text-xs text-amber-700 mt-0.5">
              More care guides, videos & tips are coming soon. Check back regularly for new content.
            </Text>
          </View>
        </View>

        <View className="px-4 pt-3 gap-3">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <View key={i} className="h-20 rounded-2xl bg-muted" />)
            : HELP_CATEGORIES.map((cat) => {
                const visuals = CATEGORY_VISUALS[cat.value];
                const count = items.filter((item) => itemCategories(item).includes(cat.value)).length;

                return (
                  <Pressable key={cat.value} onPress={() => setSelected(cat.value)} className="rounded-2xl overflow-hidden h-20">
                    {visuals && (
                      <Image
                        source={{ uri: visuals.bg }}
                        style={{ position: "absolute", width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    )}
                    <View className="absolute inset-0 bg-black/50" />
                    <View className="absolute inset-0 flex-row items-center gap-3 px-4">
                      <Text className="text-2xl">{cat.icon}</Text>
                      <View className="flex-1">
                        <Text className="font-bold text-white text-sm">{cat.label}</Text>
                        <Text className="text-white/70 text-xs mt-0.5" numberOfLines={1}>
                          {visuals?.desc ?? ""}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1.5">
                        {count > 0 && <Text className="text-[10px] text-white/60">{count}</Text>}
                        <ChevronRight size={16} color="rgba(255,255,255,0.7)" />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
