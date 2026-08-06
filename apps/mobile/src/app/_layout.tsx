import "../global.css";
import { Stack } from "expo-router";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { StripeProvider } from "@/lib/stripe-provider";

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <StripeProvider>
          <>
            <AnnouncementBanner />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </>
        </StripeProvider>
      </CartProvider>
    </AuthProvider>
  );
}
