import { StripeProvider as NativeStripeProvider } from "@stripe/stripe-react-native";
import type { ReactElement } from "react";

const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

/**
 * Not configured yet (see .env.local) — renders children unwrapped instead
 * of crashing on an empty publishable key. See stripe-provider.web.tsx: the
 * web bundle never touches @stripe/stripe-react-native at all, since that
 * package pulls in React Native's Fabric renderer internals through its
 * CardField export and fails to bundle for web outright.
 */
export function StripeProvider({ children }: { children: ReactElement }) {
  if (!stripePublishableKey) return children;
  return <NativeStripeProvider publishableKey={stripePublishableKey}>{children}</NativeStripeProvider>;
}
