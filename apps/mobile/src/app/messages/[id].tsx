import { getConversationMessages, sendMessage, type ConversationThread, type Message } from "@reef-market/shared";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Send } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { TextInput } from "@/components/ui/TextInput";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { themeColors } from "@/lib/theme-colors";
import { safeGoBack } from "@/lib/navigation";

/** Extends the real Message shape with client-only state for a not-yet-confirmed send — never persisted, just drives the bubble's look until the real row arrives (either via the API response or the realtime subscription, whichever lands first). */
type DisplayMessage = Message & { pending?: boolean; failed?: boolean };

export default function ConversationThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();

  const [thread, setThread] = useState<ConversationThread | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const listRef = useRef<FlatList<DisplayMessage>>(null);
  // Ref mutation (not Date.now()/Math.random()) for temp message ids — the
  // React Compiler's purity check flags impure calls even inside an event
  // handler, not just during render.
  const tempIdCounter = useRef(0);

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

  /**
   * Optimistic send: the bubble appears and the input clears the instant
   * you tap, not after the round trip — previously the button just stayed
   * disabled with no visual change while sending, which read as "nothing
   * happened" and led to repeat taps. The temp bubble is replaced by the
   * real row once the API responds, or marked failed (tap to retry) if it
   * errors. The realtime subscription above also sees this same row once
   * it's actually inserted — its own dedupe-by-id check is what keeps that
   * from ever showing twice once the temp entry has been swapped for it.
   */
  async function handleSend(retryContent?: string, retryTempId?: string) {
    const trimmed = retryContent ?? content.trim();
    if (!trimmed || !thread || !session) return;

    const tempId = retryTempId ?? `temp-${++tempIdCounter.current}`;
    if (!retryTempId) {
      setContent("");
      const optimistic: DisplayMessage = {
        id: tempId,
        conversation_id: id,
        listing_id: thread.listing_id,
        sender_id: session.user.id,
        content: trimmed,
        read: false,
        created_at: new Date().toISOString(),
        pending: true,
      };
      setMessages((prev) => [...prev, optimistic]);
    } else {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, pending: true, failed: false } : m)));
    }

    try {
      const { message } = await sendMessage(apiClient, {
        recipient_id: thread.other_participant.id,
        listing_id: thread.listing_id ?? undefined,
        content: trimmed,
      });
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempId);
        return withoutTemp.some((m) => m.id === message.id) ? withoutTemp : [...withoutTemp, message];
      });
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)));
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
    // The input bar is wrapped in KeyboardStickyView below instead of
    // wrapping the whole screen in a KeyboardAvoidingView — this is a chat
    // layout (scrollable history + fixed bottom bar), and sticking just
    // the bar to the keyboard is the behavior that actually matches what a
    // chat UI should do, not resizing/padding the whole screen.
    <>
      {/* "bottom" edge matters here specifically because this screen's
          input bar is the last thing in the layout with nothing below it —
          without it, Android's on-screen nav bar (3-button mode) sits
          right on top of the message input, same spot a user needs to tap
          to type. Tab screens don't need this since the tab bar itself
          already reserves that space. */}
      <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
          <Pressable onPress={() => safeGoBack(router)} className="w-9 h-9 items-center justify-center -ml-2">
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
                <Pressable
                  disabled={!item.failed}
                  onPress={() => handleSend(item.content, item.id)}
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${item.failed ? "bg-destructive/15 border border-destructive" : isMine ? "bg-primary" : "bg-muted"}`}
                  style={{ opacity: item.pending ? 0.6 : 1 }}
                >
                  <Text className={`text-sm ${item.failed ? "text-destructive" : isMine ? "text-white" : "text-foreground"}`}>{item.content}</Text>
                  {item.failed && <Text className="text-xs text-destructive mt-0.5">Failed to send — tap to retry</Text>}
                </Pressable>
              </View>
            );
          }}
        />

        <KeyboardStickyView className="flex-row items-center gap-2 px-4 py-3 border-t border-border bg-background">
          <TextInput
            testID="message-input"
            value={content}
            onChangeText={setContent}
            placeholder="Type a message…"
            placeholderTextColor={themeColors.mutedForeground}
            onSubmitEditing={() => handleSend()}
            className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-foreground"
          />
          <Pressable
            testID="send-button"
            onPress={() => handleSend()}
            disabled={!content.trim()}
            className={`w-10 h-10 rounded-full items-center justify-center ${content.trim() ? "bg-primary" : "bg-muted"}`}
          >
            <Send size={16} color={content.trim() ? themeColors.white : themeColors.mutedForeground} />
          </Pressable>
        </KeyboardStickyView>
      </SafeAreaView>
    </>
  );
}
