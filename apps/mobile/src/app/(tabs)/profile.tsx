import { LogOut } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { themeColors } from "@/lib/theme-colors";

export default function ProfileScreen() {
  const { session } = useAuth();

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background px-6 pt-6">
      <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: "#0b81b71a" }}>
        <Text className="text-2xl font-bold text-primary">{(session?.user.email ?? "?")[0]?.toUpperCase()}</Text>
      </View>
      <Text className="text-sm text-muted-foreground mb-1">Signed in as</Text>
      <Text className="text-base font-semibold text-foreground mb-6">{session?.user.email}</Text>
      <Text className="text-muted-foreground mb-6">Full profile editing — coming in M5</Text>

      <Pressable onPress={() => supabase.auth.signOut()} className="flex-row items-center justify-center gap-2 bg-muted rounded-xl py-3">
        <LogOut size={16} color={themeColors.foreground} />
        <Text className="font-semibold text-sm text-foreground">Sign Out</Text>
      </Pressable>
    </SafeAreaView>
  );
}
