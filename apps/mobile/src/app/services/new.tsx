import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ServiceForm } from "@/components/ServiceForm";
import { themeColors } from "@/lib/theme-colors";
import { safeGoBack } from "@/lib/navigation";

export default function NewServiceScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
        <Pressable onPress={() => safeGoBack(router)} className="w-9 h-9 items-center justify-center -ml-2">
          <ArrowLeft size={20} color={themeColors.foreground} />
        </Pressable>
        <Text className="text-base font-semibold text-foreground">Post a Service</Text>
      </View>

      <ServiceForm mode="create" />
    </SafeAreaView>
  );
}
