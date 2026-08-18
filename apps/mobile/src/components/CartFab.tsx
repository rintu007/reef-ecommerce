import { useRouter } from "expo-router";
import { ShoppingCart } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useCart } from "@/lib/cart-context";
import { themeColors } from "@/lib/theme-colors";

/**
 * Floating cart indicator shown above the tab bar on every tab, not just
 * Browse/Home headers — user feedback was that the cart was too easy to
 * lose track of ("keep cart also in frequently visible place"). Only
 * renders once there's something in it, so it doesn't clutter an empty cart.
 */
export function CartFab() {
  const router = useRouter();
  const { count } = useCart();

  if (count === 0) return null;

  return (
    <View pointerEvents="box-none" className="absolute left-0 right-0 bottom-0 items-end px-4" style={{ bottom: 78 }}>
      <Pressable
        testID="cart-fab"
        onPress={() => router.push("/cart")}
        className="flex-row items-center gap-2 rounded-full bg-primary pl-3 pr-4 py-2.5 shadow-lg"
        style={{ elevation: 4 }}
      >
        <ShoppingCart size={16} color={themeColors.white} />
        <Text className="text-white text-xs font-bold">
          {count} item{count === 1 ? "" : "s"} in cart
        </Text>
      </Pressable>
    </View>
  );
}
