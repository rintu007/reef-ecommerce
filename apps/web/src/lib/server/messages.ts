import type { Message, SendMessageInput } from "@reef-market/shared";
import { supabaseAdmin } from "./supabase-admin";

export interface ConversationSummary {
  id: string;
  listing_id: string | null;
  last_message_at: string | null;
  created_at: string;
  other_participant: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  last_message: { content: string; sender_id: string; created_at: string } | null;
  unread_count: number;
}

export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const db = supabaseAdmin();
  const { data: conversations, error } = await db
    .from("conversations")
    .select("*")
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  if (!conversations || conversations.length === 0) return [];

  const otherIds = conversations.map((c) => (c.user_a_id === userId ? c.user_b_id : c.user_a_id));
  const { data: profiles } = await db.from("profiles").select("id, display_name, avatar_url").in("id", otherIds);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const conversationIds = conversations.map((c) => c.id);
  const { data: lastMessages } = await db
    .from("messages")
    .select("conversation_id, content, sender_id, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });
  const lastMessageMap = new Map<string, { content: string; sender_id: string; created_at: string }>();
  for (const m of lastMessages ?? []) {
    if (!lastMessageMap.has(m.conversation_id)) lastMessageMap.set(m.conversation_id, m);
  }

  const { data: unread } = await db
    .from("messages")
    .select("conversation_id")
    .in("conversation_id", conversationIds)
    .eq("read", false)
    .neq("sender_id", userId);
  const unreadCounts = new Map<string, number>();
  for (const m of unread ?? []) {
    unreadCounts.set(m.conversation_id, (unreadCounts.get(m.conversation_id) ?? 0) + 1);
  }

  return conversations.map((c) => {
    const otherId = c.user_a_id === userId ? c.user_b_id : c.user_a_id;
    const profile = profileMap.get(otherId);
    return {
      id: c.id,
      listing_id: c.listing_id,
      last_message_at: c.last_message_at,
      created_at: c.created_at,
      other_participant: {
        id: otherId,
        display_name: profile?.display_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
      },
      last_message: lastMessageMap.get(c.id) ?? null,
      unread_count: unreadCounts.get(c.id) ?? 0,
    };
  });
}

async function assertParticipant(conversationId: string, userId: string) {
  const db = supabaseAdmin();
  const { data: conversation, error } = await db
    .from("conversations")
    .select("id, user_a_id, user_b_id, listing_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (error) throw error;
  if (!conversation || (conversation.user_a_id !== userId && conversation.user_b_id !== userId)) {
    return null;
  }
  return conversation;
}

export interface ConversationThread {
  id: string;
  listing_id: string | null;
  other_participant: { id: string; display_name: string | null; avatar_url: string | null };
  messages: Message[];
}

export async function getConversationMessages(conversationId: string, userId: string): Promise<ConversationThread | null> {
  const conversation = await assertParticipant(conversationId, userId);
  if (!conversation) return null;

  const db = supabaseAdmin();
  const otherId = conversation.user_a_id === userId ? conversation.user_b_id : conversation.user_a_id;

  const [{ data: messages, error }, { data: profile }] = await Promise.all([
    db.from("messages").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true }),
    db.from("profiles").select("id, display_name, avatar_url").eq("id", otherId).single(),
  ]);
  if (error) throw error;

  return {
    id: conversation.id,
    listing_id: conversation.listing_id,
    other_participant: {
      id: otherId,
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
    },
    messages: (messages ?? []) as Message[],
  };
}

export async function markConversationRead(conversationId: string, userId: string): Promise<boolean> {
  const conversation = await assertParticipant(conversationId, userId);
  if (!conversation) return false;

  const db = supabaseAdmin();
  await db.from("messages").update({ read: true }).eq("conversation_id", conversationId).neq("sender_id", userId);
  return true;
}

export interface AdminMessage extends Message {
  sender_email: string | null;
  sender_display_name: string | null;
}

/**
 * A report's reporter/reported pair, viewed by an admin — unlike
 * getConversationMessages(), this never creates a conversation and doesn't
 * require the caller to be a participant. A report referencing a user with
 * no message history returns an empty thread rather than an error, since
 * that's a normal, unremarkable case (not every report follows contact).
 */
export async function getConversationForAdmin(userA: string, userB: string): Promise<{ conversationId: string | null; messages: AdminMessage[] }> {
  const db = supabaseAdmin();
  const { data: conversation, error } = await db
    .from("conversations")
    .select("id")
    .or(`and(user_a_id.eq.${userA},user_b_id.eq.${userB}),and(user_a_id.eq.${userB},user_b_id.eq.${userA})`)
    .maybeSingle();
  if (error) throw error;
  if (!conversation) return { conversationId: null, messages: [] };

  const { data: messages, error: messagesError } = await db
    .from("messages")
    .select("*, profiles(email, display_name)")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true });
  if (messagesError) throw messagesError;

  return {
    conversationId: conversation.id,
    messages: (messages ?? []).map((m) => {
      const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      return { ...(m as Message), sender_email: profile?.email ?? null, sender_display_name: profile?.display_name ?? null };
    }),
  };
}

export async function getOrCreateConversation(userA: string, userB: string, listingId: string | null): Promise<string> {
  const db = supabaseAdmin();
  const { data: existing, error: findError } = await db
    .from("conversations")
    .select("id")
    .or(`and(user_a_id.eq.${userA},user_b_id.eq.${userB}),and(user_a_id.eq.${userB},user_b_id.eq.${userA})`)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing.id;

  const { data: created, error: createError } = await db
    .from("conversations")
    .insert({ user_a_id: userA, user_b_id: userB, listing_id: listingId })
    .select("id")
    .single();
  if (createError) throw createError;
  return created.id;
}

export async function sendMessage(senderId: string, input: SendMessageInput): Promise<Message> {
  const listingId = input.listing_id ?? null;
  const conversationId = await getOrCreateConversation(senderId, input.recipient_id, listingId);

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("messages")
    .insert({
      conversation_id: conversationId,
      listing_id: listingId,
      sender_id: senderId,
      content: input.content,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Message;
}
