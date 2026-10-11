import "../global.css";
import { Stack } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { cssInterop } from "nativewind";
import { useEffect } from "react";
import { KeyboardProvider, KeyboardStickyView } from "react-native-keyboard-controller";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { EULAGate } from "@/components/EULAGate";
import { PushNotificationRegistrar } from "@/components/PushNotificationRegistrar";
import { UserPrefsModal } from "@/components/UserPrefsModal";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { LanguageProvider } from "@/lib/language-context";
import { StripeProvider } from "@/lib/stripe-provider";

// NativeWind only auto-patches React Native's own core components —
// third-party ones like KeyboardStickyView need an explicit opt-in, or
// `className` silently does nothing. Registered once here since
// messages/[id].tsx is the only current user, but any future
// KeyboardStickyView usage picks it up automatically too.
cssInterop(KeyboardStickyView, { className: "style" });

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
            {/*
              Plain KeyboardAvoidingView around the whole stack wasn't
              enough on Android — it only pads/shrinks the container, it
              doesn't scroll a focused input that's still off-screen into
              view, which matters for screens like sign-in where several
              inputs are stacked below taller content (SSO buttons). Screens
              with inputs use KeyboardAwareScrollView instead (which needs
              this provider), not a bare ScrollView — see (auth)/sign-in.tsx,
              forgot-password.tsx, reset-password.tsx.
            */}
            <KeyboardProvider>
              <EULAGate />
              <UserPrefsModal />
              <AnnouncementBanner />
              <PushNotificationRegistrar />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
              </Stack>
            </KeyboardProvider>
          </StripeProvider>
        </CartProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
