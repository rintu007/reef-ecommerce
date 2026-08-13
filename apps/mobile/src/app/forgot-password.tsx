import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";
import { themeColors } from "@/lib/theme-colors";

/**
 * Fully native — no browser hop. The original version opened
 * `${EXPO_PUBLIC_API_URL}/forgot-password` in a WebBrowser tab, which the
 * user flagged: "it should happen in app". `resetPasswordForEmail` is just
 * an API call, so it never needed a browser at all; only the *reset* step
 * (after tapping the emailed link) needs a redirect target, handled by
 * reset-password.tsx via the app's `reefmarket://` deep link scheme.
 */
export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: Linking.createURL("reset-password"),
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center px-6 gap-3">
          <Text className="text-xl font-bold text-foreground text-center">Check your email</Text>
          <Text className="text-sm text-muted-foreground text-center">
            If an account exists for {email}, we&apos;ve sent a link to reset your password.
          </Text>
          <Pressable onPress={() => router.back()} className="mt-2">
            <Text className="text-sm text-primary text-center">Back to Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center px-6 gap-4">
        <Text className="text-2xl font-bold text-foreground mb-1">Reset your password</Text>
        <Text className="text-sm text-muted-foreground -mt-3 mb-2">Enter your email and we&apos;ll send you a reset link.</Text>

        <View>
          <Text className="text-sm font-medium text-muted-foreground mb-1">Email</Text>
          <TextInput
            testID="forgot-password-email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={themeColors.mutedForeground}
            className="border border-border bg-card rounded-xl px-3 py-2.5 text-sm text-foreground"
          />
        </View>

        {error && <Text className="text-sm text-destructive">{error}</Text>}

        <Pressable
          onPress={handleSubmit}
          disabled={loading || !email}
          className="bg-primary rounded-xl py-3 items-center disabled:opacity-50"
        >
          {loading ? <ActivityIndicator color={themeColors.white} /> : <Text className="text-white font-semibold text-sm">Send reset link</Text>}
        </Pressable>

        <Pressable onPress={() => router.back()}>
          <Text className="text-sm text-primary text-center">Back to Sign In</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
