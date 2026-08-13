import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";
import { themeColors } from "@/lib/theme-colors";

/**
 * Opened via the `reefmarket://reset-password` deep link Supabase's recovery
 * email redirects to. Deliberately at the top level, not under (auth) —
 * (auth)/_layout.tsx redirects to /(tabs)/browse the instant a session
 * exists, and setSession() below establishes a (recovery-scoped) session, so
 * this screen would get bounced away before the user could set a password.
 *
 * Handles both link formats Supabase can send: PKCE (?code=...) and the
 * older implicit flow (#access_token=...&refresh_token=...) — same
 * either-or parsing used for OAuth in (auth)/sign-in.tsx.
 */
export default function ResetPasswordScreen() {
  const url = Linking.useURL();
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!url || ready) return;

    async function establishSession(incomingUrl: string) {
      try {
        const parsed = new URL(incomingUrl);
        const code = parsed.searchParams.get("code");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else {
          const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ""));
          const access_token = hashParams.get("access_token");
          const refresh_token = hashParams.get("refresh_token");
          if (!access_token || !refresh_token) throw new Error("Reset link is missing or expired");
          const { error: setSessionError } = await supabase.auth.setSession({ access_token, refresh_token });
          if (setSessionError) throw setSessionError;
        }
        setReady(true);
      } catch (err) {
        setLinkError(err instanceof Error ? err.message : "This reset link is invalid or has expired");
      }
    }
    establishSession(url);
  }, [url, ready]);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center px-6 gap-3">
          <Text className="text-xl font-bold text-foreground text-center">Password updated</Text>
          <Text className="text-sm text-muted-foreground text-center">You can now sign in with your new password.</Text>
          <Pressable onPress={() => router.replace("/(auth)/sign-in")} className="mt-2">
            <Text className="text-sm text-primary text-center">Go to Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (linkError) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center px-6 gap-3">
          <Text className="text-sm text-destructive text-center">{linkError}</Text>
          <Pressable onPress={() => router.replace("/forgot-password")} className="mt-2">
            <Text className="text-sm text-primary text-center">Request a new link</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!ready) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={themeColors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center px-6 gap-4">
        <Text className="text-2xl font-bold text-foreground mb-1">Set a new password</Text>

        <View>
          <Text className="text-sm font-medium text-muted-foreground mb-1">New password</Text>
          <TextInput
            testID="reset-password-input"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={themeColors.mutedForeground}
            className="border border-border bg-card rounded-xl px-3 py-2.5 text-sm text-foreground"
          />
        </View>

        {error && <Text className="text-sm text-destructive">{error}</Text>}

        <Pressable
          onPress={handleSubmit}
          disabled={loading || password.length < 6}
          className="bg-primary rounded-xl py-3 items-center disabled:opacity-50"
        >
          {loading ? <ActivityIndicator color={themeColors.white} /> : <Text className="text-white font-semibold text-sm">Update Password</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
