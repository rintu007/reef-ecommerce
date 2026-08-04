import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { useAuth } from "@/lib/auth-context";

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Tabs screenOptions={{ headerShown: true, tabBarActiveTintColor: "#2563eb" }}>
      <Tabs.Screen name="browse" options={{ title: "Browse", tabBarIcon: () => <TabIcon emoji="🐠" /> }} />
      <Tabs.Screen name="sell" options={{ title: "Sell", tabBarIcon: () => <TabIcon emoji="➕" /> }} />
      <Tabs.Screen name="messages" options={{ title: "Messages", tabBarIcon: () => <TabIcon emoji="💬" /> }} />
      <Tabs.Screen name="orders" options={{ title: "Orders", tabBarIcon: () => <TabIcon emoji="📦" /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: () => <TabIcon emoji="👤" /> }} />
    </Tabs>
  );
}
