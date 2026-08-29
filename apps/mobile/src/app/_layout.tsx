import "../global.css";
import { Stack } from "expo-router";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { EULAGate } from "@/components/EULAGate";
import { UserPrefsModal } from "@/components/UserPrefsModal";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { LanguageProvider } from "@/lib/language-context";
import { StripeProvider } from "@/lib/stripe-provider";

export default function RootLayout() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <CartProvider>
          <StripeProvider>
            <>
              <EULAGate />
              <UserPrefsModal />
              <AnnouncementBanner />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
              </Stack>
            </>
          </StripeProvider>
        </CartProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
