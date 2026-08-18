import { getPublicProfile, sendMessage, type PublicProfile } from "@reef-market/shared";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Send } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";
import { safeGoBack } from "@/lib/navigation";

export default function NewConversationScreen() {
  const { to, listing } = useLocalSearchParams<{ to: string; listing?: string }>();
  const router = useRouter();

  const [recipient, setRecipient] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPublicProfile(apiClient, to)
      .then(({ profile }) => {
        if (!cancelled) setRecipient(profile);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [to]);

  async function handleSend() {
    const trimmed = content.trim();
    if (!trimmed) return;
    setSending(true);
    setError(null);
    try {
      const { message } = await sendMessage(apiClient, {
        recipient_id: to,
        listing_id: listing || undefined,
        content: trimmed,
      });
      router.replace(`/messages/${message.conversation_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
        <Pressable onPress={() => safeGoBack(router)} className="w-9 h-9 items-center justify-center -ml-2">
          <ArrowLeft size={20} color={themeColors.foreground} />
        </Pressable>
        <Text className="text-base font-semibold text-foreground">New Message</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={themeColors.primary} />
        </View>
      ) : (
        <View className="flex-1 px-4 pt-4">
          <View className="flex-row items-center gap-3 mb-6">
            <View className="w-11 h-11 rounded-full overflow-hidden bg-muted items-center justify-center">
              {recipient?.avatar_url ? (
                <Image source={{ uri: recipient.avatar_url }} style={{ width: 44, height: 44 }} contentFit="cover" />
              ) : (
                <Text className="text-lg">👤</Text>
              )}
            </View>
            <Text className="font-semibold text-base text-foreground">{recipient?.display_name ?? "Reef Market User"}</Text>
          </View>

          <TextInput
            testID="compose-input"
            value={content}
            onChangeText={setContent}
            placeholder="Write your message…"
            placeholderTextColor={themeColors.mutedForeground}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="border border-border bg-card rounded-xl px-3 py-2.5 text-sm text-foreground"
            style={{ minHeight: 100 }}
          />

          {error && <Text className="text-sm text-destructive mt-2">{error}</Text>}

          <Pressable
            testID="send-button"
            onPress={handleSend}
            disabled={sending || !content.trim()}
            className={`mt-4 flex-row items-center justify-center gap-2 rounded-xl py-3 ${content.trim() ? "bg-primary" : "bg-muted"}`}
          >
            {sending ? (
              <ActivityIndicator color={themeColors.white} />
            ) : (
              <>
                <Send size={16} color={content.trim() ? themeColors.white : themeColors.mutedForeground} />
                <Text className={`font-semibold text-sm ${content.trim() ? "text-white" : "text-muted-foreground"}`}>Send</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
