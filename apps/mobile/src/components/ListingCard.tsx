import { LISTING_TYPE_ICONS, type Listing } from "@reef-market/shared";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Heart, MapPin, Truck } from "lucide-react-native";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";
import { themeColors } from "@/lib/theme-colors";

const PLACEHOLDER_PHOTO = "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=400&q=80";

export function ListingCard({
  listing,
  isSaved,
  showSave,
  onToggleSave,
}: {
  listing: Listing;
  isSaved: boolean;
  showSave: boolean;
  onToggleSave: () => void;
}) {
  const photo = listing.photos[0] || PLACEHOLDER_PHOTO;

  return (
    <View className="flex-1">
      <Link href={`/listing/${listing.id}`} asChild>
        <Pressable className="rounded-xl overflow-hidden bg-card border border-border">
          <View className="aspect-square">
            <Image source={{ uri: photo }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
            {listing.featured && (
              <View className="absolute top-2 left-2 bg-accent rounded-full px-2 py-0.5">
                <Text className="text-accent-foreground text-[10px] font-bold">Featured</Text>
              </View>
            )}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.55)"]}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                paddingHorizontal: 12,
                paddingBottom: 8,
                paddingTop: 24,
              }}
            >
              <Text className="text-white font-extrabold text-lg">${listing.price.toFixed(2)}</Text>
            </LinearGradient>
          </View>
          <View className="p-3">
            <Text className="font-semibold text-sm text-foreground" numberOfLines={1}>
              {listing.title}
            </Text>
            <View className="flex-row items-center gap-1.5 mt-1.5">
              <Text className="text-xs text-muted-foreground">{LISTING_TYPE_ICONS[listing.listing_type]}</Text>
              <Text className="text-xs text-muted-foreground flex-1" numberOfLines={1}>
                {listing.category}
              </Text>
            </View>
            <View className="flex-row items-center gap-3 mt-2">
              {listing.quantity > 0 && (
                <Text className="text-[11px] font-semibold text-foreground">{listing.quantity} available</Text>
              )}
              {listing.local_pickup && (
                <View className="flex-row items-center gap-1">
                  <MapPin size={11} color={themeColors.mutedForeground} />
                  <Text className="text-[11px] text-muted-foreground">Local</Text>
                </View>
              )}
              {listing.shipping_available && (
                <View className="flex-row items-center gap-1">
                  <Truck size={11} color={themeColors.mutedForeground} />
                  <Text className="text-[11px] text-muted-foreground">Ships</Text>
                </View>
              )}
            </View>
          </View>
        </Pressable>
      </Link>
      {showSave && (
        <Pressable
          testID={`save-listing-${listing.id}`}
          onPress={onToggleSave}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 items-center justify-center"
        >
          <Heart size={18} color={isSaved ? "#ef4444" : "#6b7280"} fill={isSaved ? "#ef4444" : "transparent"} />
        </Pressable>
      )}
    </View>
  );
}
