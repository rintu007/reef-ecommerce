import { Pressable, Text, View } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

export default function ProfileScreen() {
  const { session } = useAuth();

  return (
    <View className="flex-1 bg-white px-6 pt-6">
      <Text className="text-sm text-gray-500 mb-1">Signed in as</Text>
      <Text className="text-base font-semibold mb-6">{session?.user.email}</Text>
      <Text className="text-gray-400 mb-6">Full profile editing — coming in M5</Text>

      <Pressable onPress={() => supabase.auth.signOut()} className="bg-gray-100 rounded-lg py-3 items-center">
        <Text className="font-semibold text-sm text-gray-700">Sign Out</Text>
      </Pressable>
    </View>
  );
}
