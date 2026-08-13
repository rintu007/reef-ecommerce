import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { BookOpen } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { themeColors } from "@/lib/theme-colors";
import { AppleIcon, FacebookIcon, GoogleIcon, MicrosoftIcon } from "@/components/SocialIcons";

type Mode = "sign-in" | "sign-up";
type SocialProvider = "google" | "azure" | "facebook" | "apple";

const SOCIAL_PROVIDERS: { provider: SocialProvider; label: string; Icon: React.ComponentType<{ color?: string }> }[] = [
  { provider: "google", label: "Continue with Google", Icon: GoogleIcon },
  { provider: "azure", label: "Continue with Microsoft", Icon: MicrosoftIcon },
  { provider: "facebook", label: "Continue with Facebook", Icon: FacebookIcon },
  { provider: "apple", label: "Continue with Apple", Icon: AppleIcon },
];

export default function SignInScreen() {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);

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

  async function handleSocial(provider: SocialProvider) {
    setError(null);
    setSocialLoading(provider);
    try {
      const redirectTo = Linking.createURL("auth-callback");
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (oauthError) throw oauthError;
      if (!data.url) throw new Error("No sign-in URL returned");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== "success" || !result.url) return;

      const url = new URL(result.url);
      const code = url.searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
      } else {
        const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
        const access_token = hashParams.get("access_token");
        const refresh_token = hashParams.get("refresh_token");
        if (access_token && refresh_token) {
          const { error: setSessionError } = await supabase.auth.setSession({ access_token, refresh_token });
          if (setSessionError) throw setSessionError;
        }
      }
      // AuthProvider's onAuthStateChange picks up the new session from here.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSocialLoading(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 32, gap: 16 }}>
        <Text className="text-3xl mb-1">🪸</Text>
        <Text className="text-2xl font-bold text-foreground mb-2">
          {mode === "sign-in" ? "Sign In" : "Create Account"}
        </Text>

        <View className="gap-2">
          {SOCIAL_PROVIDERS.map(({ provider, label, Icon }) => (
            <Pressable
              key={provider}
              testID={`social-${provider}`}
              onPress={() => handleSocial(provider)}
              disabled={socialLoading !== null}
              className="flex-row items-center justify-center gap-3 border border-border rounded-xl py-3 disabled:opacity-50"
            >
              {provider === "apple" ? <Icon color={themeColors.foreground} /> : <Icon />}
              <Text className="text-sm font-medium text-foreground">
                {socialLoading === provider ? "Redirecting…" : label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="flex-row items-center gap-3">
          <View className="flex-1 h-px bg-border" />
          <Text className="text-xs text-muted-foreground font-medium">OR</Text>
          <View className="flex-1 h-px bg-border" />
        </View>

        <View>
          <Text className="text-sm font-medium text-muted-foreground mb-1">Email</Text>
          <TextInput
            testID="sign-in-email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={themeColors.mutedForeground}
            className="border border-border bg-card rounded-xl px-3 py-2.5 text-sm text-foreground"
          />
        </View>

        <View>
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-sm font-medium text-muted-foreground">Password</Text>
            {mode === "sign-in" && (
              <Pressable onPress={() => router.push("/forgot-password")}>
                <Text className="text-xs text-primary">Forgot password?</Text>
              </Pressable>
            )}
          </View>
          <TextInput
            testID="sign-in-password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={themeColors.mutedForeground}
            className="border border-border bg-card rounded-xl px-3 py-2.5 text-sm text-foreground"
          />
        </View>

        {error && <Text className="text-sm text-destructive">{error}</Text>}
        {info && <Text className="text-sm text-emerald-600">{info}</Text>}

        <Pressable
          onPress={handleSubmit}
          disabled={loading || !email || !password}
          className="bg-primary rounded-xl py-3 items-center disabled:opacity-50"
        >
          {loading ? (
            <ActivityIndicator color={themeColors.white} />
          ) : (
            <Text className="text-white font-semibold text-sm">{mode === "sign-in" ? "Sign In" : "Create Account"}</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => {
            setMode(mode === "sign-in" ? "sign-up" : "sign-in");
            setError(null);
            setInfo(null);
          }}
        >
          <Text className="text-sm text-primary text-center">
            {mode === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.push("/learn")} className="flex-row items-center justify-center gap-1.5 mt-2">
          <BookOpen size={14} color={themeColors.mutedForeground} />
          <Text className="text-sm text-muted-foreground text-center">Browse care guides</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
