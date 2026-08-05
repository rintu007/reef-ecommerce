import "../global.css";
import { Stack } from "expo-router";
import { AuthProvider } from "@/lib/auth-context";
import { StripeProvider } from "@/lib/stripe-provider";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StripeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </StripeProvider>
    </AuthProvider>
  );
}
