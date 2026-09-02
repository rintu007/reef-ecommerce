import { View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";

/** Mirrors ListingCard's layout (aspect-square photo, title line, meta row) so the loading state doesn't jump when real cards swap in. */
export function ListingCardSkeleton() {
  return (
    <View className="flex-1 rounded-xl overflow-hidden bg-card border border-border">
      <Skeleton className="aspect-square rounded-none" />
      <View className="p-3 gap-2">
        <Skeleton style={{ height: 14, width: "80%" }} />
        <Skeleton style={{ height: 10, width: "50%" }} />
        <Skeleton style={{ height: 10, width: "40%" }} />
      </View>
    </View>
  );
}

/** A 2-column grid of skeleton cards, matching BrowseScreen's FlatList columnWrapperStyle/contentContainerStyle gaps. */
export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  const rows = Math.ceil(count / 2);
  return (
    <View style={{ gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
      {Array.from({ length: rows }).map((_, row) => (
        <View key={row} style={{ flexDirection: "row", gap: 12 }}>
          <ListingCardSkeleton />
          {row * 2 + 1 < count ? <ListingCardSkeleton /> : <View className="flex-1" />}
        </View>
      ))}
    </View>
  );
}
