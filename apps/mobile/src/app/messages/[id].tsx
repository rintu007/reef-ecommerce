import { getConversationMessages, sendMessage, type ConversationThread, type Message } from "@reef-market/shared";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Send } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { themeColors } from "@/lib/theme-colors";

export default function ConversationThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();

  const [thread, setThread] = useState<ConversationThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    let cancelled = false;
    getConversationMessages(apiClient, id)
      .then((thread) => {
        if (cancelled) return;
        setThread(thread);
        setMessages(thread.messages);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  async function handleSend() {
    const trimmed = content.trim();
    if (!trimmed || !thread) return;
    setSending(true);
    try {
      const { message } = await sendMessage(apiClient, {
        recipient_id: thread.other_participant.id,
        listing_id: thread.listing_id ?? undefined,
        content: trimmed,
      });
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      setContent("");
    } finally {
      setSending(false);
    }
  }

  if (loading || !thread) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={themeColors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
          <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
            <ArrowLeft size={20} color={themeColors.foreground} />
          </Pressable>
          <View className="w-9 h-9 rounded-full overflow-hidden bg-muted items-center justify-center">
            {thread.other_participant.avatar_url ? (
              <Image source={{ uri: thread.other_participant.avatar_url }} style={{ width: 36, height: 36 }} contentFit="cover" />
            ) : (
              <Text className="text-base">👤</Text>
            )}
          </View>
          <Text className="text-base font-semibold text-foreground">{thread.other_participant.display_name ?? "Reef Market User"}</Text>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isMine = item.sender_id === session?.user.id;
            return (
              <View className={`flex-row ${isMine ? "justify-end" : "justify-start"}`}>
                <View className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMine ? "bg-primary" : "bg-muted"}`}>
                  <Text className={`text-sm ${isMine ? "text-white" : "text-foreground"}`}>{item.content}</Text>
                </View>
              </View>
            );
          }}
        />

        <View className="flex-row items-center gap-2 px-4 py-3 border-t border-border">
          <TextInput
            testID="message-input"
            value={content}
            onChangeText={setContent}
            placeholder="Type a message…"
            placeholderTextColor={themeColors.mutedForeground}
            onSubmitEditing={handleSend}
            className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-foreground"
          />
          <Pressable
            testID="send-button"
            onPress={handleSend}
            disabled={sending || !content.trim()}
            className={`w-10 h-10 rounded-full items-center justify-center ${content.trim() ? "bg-primary" : "bg-muted"}`}
          >
            <Send size={16} color={content.trim() ? themeColors.white : themeColors.mutedForeground} />
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
