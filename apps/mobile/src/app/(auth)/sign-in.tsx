import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

type Mode = "sign-in" | "sign-up";

export default function SignInScreen() {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "sign-in") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        // AuthProvider's onAuthStateChange picks this up; (auth)/_layout redirects once session is set.
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setInfo("Check your email to confirm your account, then sign in.");
          setMode("sign-in");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center px-6 gap-4">
        <Text className="text-2xl font-bold mb-2">{mode === "sign-in" ? "Sign In" : "Create Account"}</Text>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
          />
        </View>

        {error && <Text className="text-sm text-red-600">{error}</Text>}
        {info && <Text className="text-sm text-emerald-600">{info}</Text>}

        <Pressable
          onPress={handleSubmit}
          disabled={loading || !email || !password}
          className="bg-blue-600 rounded-lg py-3 items-center disabled:opacity-50"
        >
          {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-semibold text-sm">{mode === "sign-in" ? "Sign In" : "Create Account"}</Text>}
        </Pressable>

        <Pressable
          onPress={() => {
            setMode(mode === "sign-in" ? "sign-up" : "sign-in");
            setError(null);
            setInfo(null);
          }}
        >
          <Text className="text-sm text-blue-600 text-center">
            {mode === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
