import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Shown in place of a tab's content when a guest taps Sell/Messages/Orders/Profile — mirrors legacy's guest-tab sign-in stub. */
export function AuthGate({ title, message }: { title: string; message: string }) {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-8 gap-3">
        <Text className="text-3xl mb-1">🪸</Text>
        <Text className="text-lg font-bold text-foreground text-center">{title}</Text>
        <Text className="text-sm text-muted-foreground text-center">{message}</Text>
        <Pressable onPress={() => router.push("/(auth)/sign-in")} className="bg-primary rounded-xl px-6 py-3 mt-2">
          <Text className="text-white font-semibold text-sm">Sign In</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
