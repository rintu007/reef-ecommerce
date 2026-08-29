import { deleteAdminReview, listAdminReviews, type AdminReview } from "@reef-market/shared";
import { Link, Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminGate } from "@/components/AdminGate";
import { apiClient } from "@/lib/api-client";
import { confirmAsync, notify } from "@/lib/alert";
import { themeColors } from "@/lib/theme-colors";
import { safeGoBack } from "@/lib/navigation";

const RATING_FILTERS: { value: number | "all"; label: string }[] = [
  { value: "all", label: "All ratings" },
  { value: 2, label: "1-2 stars" },
  { value: 1, label: "1 star only" },
];
const PAGE_SIZE = 50;

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`px-3 py-1.5 rounded-full ${active ? "bg-primary" : "bg-muted"}`}>
      <Text className={`text-xs font-semibold ${active ? "text-primary-foreground" : "text-muted-foreground"}`}>{label}</Text>
    </Pressable>
  );
}

function ReviewsContent() {
  const [maxRating, setMaxRating] = useState<number | "all">("all");
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(
    async (nextOffset: number, replace: boolean) => {
      setLoading(true);
      try {
        const { reviews: page, total } = await listAdminReviews(apiClient, {
          max_rating: maxRating === "all" ? undefined : maxRating,
          limit: PAGE_SIZE,
          offset: nextOffset,
        });
        setReviews((prev) => (replace ? page : [...prev, ...page]));
        setTotal(total);
        setOffset(nextOffset);
      } finally {
        setLoading(false);
      }
    },
    [maxRating]
  );

  useEffect(() => {
    const timer = setTimeout(() => load(0, true), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxRating]);

  async function handleDelete(id: string) {
    const confirmed = await confirmAsync("Delete this review?", "This can't be undone.", "Delete");
    if (!confirmed) return;
    setBusyId(id);
    try {
      await deleteAdminReview(apiClient, id);
      await load(0, true);
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "Failed to delete review");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <View className="flex-row flex-wrap gap-2">
        {RATING_FILTERS.map((f) => (
          <Chip key={String(f.value)} label={f.label} active={maxRating === f.value} onPress={() => setMaxRating(f.value)} />
        ))}
      </View>

      <Text className="text-xs text-muted-foreground">
        {total} review{total === 1 ? "" : "s"}
      </Text>

      {loading && reviews.length === 0 ? (
        <View className="items-center py-8">
          <ActivityIndicator color={themeColors.primary} />
        </View>
      ) : reviews.length === 0 ? (
        <Text className="text-sm text-muted-foreground text-center py-8">No reviews match this filter.</Text>
      ) : (
        <View className="gap-2">
          {reviews.map((review) => {
            const isBusy = busyId === review.id;
            return (
              <View key={review.id} className="rounded-xl border border-border bg-card p-3">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="min-w-0 flex-1">
                    <Text className="text-sm font-semibold text-foreground">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                      <Text className="text-xs font-normal text-muted-foreground"> {review.type.replace("_", " ")}</Text>
                    </Text>
                    {review.comment && <Text className="text-sm text-muted-foreground mt-1">{review.comment}</Text>}
                    <Text className="text-xs text-muted-foreground mt-1" numberOfLines={1}>
                      {review.reviewer?.display_name ?? review.reviewer?.email ?? "unknown"} on{" "}
                      {review.seller?.display_name ?? review.seller?.email ?? "unknown"}
                    </Text>
                    {review.listing && (
                      <Link href={`/listing/${review.listing.id}`} asChild>
                        <Pressable>
                          <Text className="text-xs text-primary mt-0.5">{review.listing.title}</Text>
                        </Pressable>
                      </Link>
                    )}
                    <Text className="text-xs text-muted-foreground mt-1">{new Date(review.created_at).toLocaleString()}</Text>
                  </View>
                  <Pressable onPress={() => handleDelete(review.id)} disabled={isBusy} className="shrink-0">
                    <Text className="text-sm font-semibold text-destructive" style={isBusy ? { opacity: 0.5 } : undefined}>
                      Delete
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {reviews.length < total && (
        <Pressable
          onPress={() => load(offset + PAGE_SIZE, false)}
          disabled={loading}
          className="mt-2 py-2.5 rounded-lg bg-muted items-center"
        >
          <Text className="text-sm font-semibold text-muted-foreground">{loading ? "Loading…" : "Load more"}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

export default function AdminReviewsScreen() {
  const router = useRouter();
  return (
    <AdminGate>
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
          <Pressable onPress={() => safeGoBack(router)} className="w-9 h-9 items-center justify-center -ml-2">
            <ArrowLeft size={20} color={themeColors.foreground} />
          </Pressable>
          <Text className="text-base font-semibold text-foreground">Reviews</Text>
        </View>
        <ReviewsContent />
      </SafeAreaView>
    </AdminGate>
  );
}
