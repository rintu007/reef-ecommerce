import { Redirect } from "expo-router";

/**
 * Home is guest-accessible (matches legacy's guest bottom nav, where "/" is
 * the Home/MarketSelector landing screen), so the app opens straight into it
 * regardless of session — signing in is something a guest opts into later
 * via a gated tab (Sell/Messages/Orders/Profile), not a wall on launch.
 */
export default function Index() {
  return <Redirect href="/(tabs)/home" />;
}
