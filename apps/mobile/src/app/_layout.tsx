import "../global.css";
import { Stack } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useEffect } from "react";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { EULAGate } from "@/components/EULAGate";
import { UserPrefsModal } from "@/components/UserPrefsModal";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { LanguageProvider } from "@/lib/language-context";
import { StripeProvider } from "@/lib/stripe-provider";

export default function RootLayout() {
  // Default for every screen — the app is light-background everywhere
  // except Home's dark gradient hero, which sets its own style on focus
  // (see (tabs)/home.tsx). A declarative <StatusBar> set per-screen isn't
  // reliable here because expo-router's tab screens stay mounted after
  // their first visit, so a light-content screen's <StatusBar> component
  // never unmounts to hand control back — it just sticks on every other
  // tab too, making icons invisible on their light backgrounds. Setting
  // this imperatively once covers every screen that doesn't override it.
  useEffect(() => {
    setStatusBarStyle("dark");
  }, []);

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
