import { Tabs } from "expo-router";
import { BookOpen, Home, MessageCircle, PlusCircle, Search, ShoppingBag, User } from "lucide-react-native";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { themeColors } from "@/lib/theme-colors";
import { CartFab } from "@/components/CartFab";

/**
 * Browse, Home, and Learn work for guests too, matching legacy's guest
 * bottom nav (Home/Search/Learn) — only Sell/Messages/Orders/Profile require
 * a session, gated per-screen via AuthGate instead of redirecting the whole
 * tab group. Learn is hidden from the tab bar once signed in (href: null),
 * matching legacy's BottomNav.jsx where Learn only appears in GUEST_TAB_DEFS
 * — it's still reachable at /learn either way (e.g. from the sign-in screen).
 */
export default function TabsLayout() {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={themeColors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: themeColors.primary,
          tabBarInactiveTintColor: themeColors.mutedForeground,
          tabBarStyle: { backgroundColor: themeColors.white, borderTopColor: themeColors.border },
          tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
        }}
      >
        <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ color }) => <Home size={24} color={color} /> }} />
        <Tabs.Screen name="browse" options={{ title: "Browse", tabBarIcon: ({ color }) => <Search size={24} color={color} /> }} />
        <Tabs.Screen
          name="learn"
          options={{
            title: "Learn",
            tabBarIcon: ({ color }) => <BookOpen size={24} color={color} />,
            href: session ? null : undefined,
          }}
        />
        <Tabs.Screen name="sell" options={{ title: "Sell", tabBarIcon: ({ color }) => <PlusCircle size={24} color={color} /> }} />
        <Tabs.Screen name="messages" options={{ title: "Messages", tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} /> }} />
        <Tabs.Screen name="orders" options={{ title: "Orders", tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} /> }} />
        <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <User size={24} color={color} /> }} />
      </Tabs>
      <CartFab />
    </View>
  );
}
