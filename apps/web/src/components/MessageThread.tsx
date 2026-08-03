"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { sendMessage, type ConversationThread, type Message } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export function MessageThread({ thread, currentUserId }: { thread: ConversationThread; currentUserId: string }) {
  const [messages, setMessages] = useState<Message[]>(thread.messages);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`messages:${thread.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${thread.id}` },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [thread.id]);

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    setSending(true);
    setError(null);
    try {
      const { message } = await sendMessage(apiClient, {
        recipient_id: thread.other_participant.id,
        listing_id: thread.listing_id ?? undefined,
        content: trimmed,
      });
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col h-[calc(100vh-64px)]">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <Link href="/messages" className="text-blue-600 hover:underline text-sm">
          ←
        </Link>
        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-lg overflow-hidden">
          {thread.other_participant.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thread.other_participant.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            "👤"
          )}
        </div>
        <p className="font-semibold text-sm">{thread.other_participant.display_name ?? "Reef Market User"}</p>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-2">
        {messages.map((m) => {
          const isMine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  isMine ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 pt-3 border-t border-gray-200">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="px-5 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </form>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
