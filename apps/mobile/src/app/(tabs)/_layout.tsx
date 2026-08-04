import { Redirect, Tabs } from "expo-router";
import { MessageCircle, PlusCircle, Search, ShoppingBag, User } from "lucide-react-native";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { themeColors } from "@/lib/theme-colors";

export default function TabsLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={themeColors.primary} />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.mutedForeground,
        tabBarStyle: { backgroundColor: themeColors.white, borderTopColor: themeColors.border },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="browse" options={{ title: "Browse", tabBarIcon: ({ color }) => <Search size={24} color={color} /> }} />
      <Tabs.Screen name="sell" options={{ title: "Sell", tabBarIcon: ({ color }) => <PlusCircle size={24} color={color} /> }} />
      <Tabs.Screen name="messages" options={{ title: "Messages", tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} /> }} />
      <Tabs.Screen name="orders" options={{ title: "Orders", tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <User size={24} color={color} /> }} />
    </Tabs>
  );
}
