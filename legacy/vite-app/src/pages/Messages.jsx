import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useUserPrefs } from "@/lib/UserPrefsContext";
import { getT } from "@/lib/i18n";

function getConversationId(a, b) {
  return [a, b].sort().join("__");
}

export default function Messages() {
  const { language } = useUserPrefs();
  const t = getT(language);
  const params = new URLSearchParams(window.location.search);
  const toEmail = params.get("to");

  const [me, setMe] = useState(null);
  const [selectedConvo, setSelectedConvo] = useState(toEmail ? toEmail : null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setMe);
  }, []);

  const { data: allMessages = [] } = useQuery({
    queryKey: ["messages", me?.email],
    queryFn: () => base44.entities.Message.filter({ sender_email: me.email }, "-created_date", 200),
    enabled: !!me,
  });

  const { data: receivedMessages = [] } = useQuery({
    queryKey: ["messages-received", me?.email],
    queryFn: () => base44.entities.Message.filter({ receiver_email: me.email }, "-created_date", 200),
    enabled: !!me,
  });

  const combinedMessages = [...allMessages, ...receivedMessages].sort(
    (a, b) => new Date(a.created_date) - new Date(b.created_date)
  );

  // Get unique conversations
  const conversations = {};
  combinedMessages.forEach((m) => {
    const other = m.sender_email === me?.email ? m.receiver_email : m.sender_email;
    if (!conversations[other] || new Date(m.created_date) > new Date(conversations[other].created_date)) {
      conversations[other] = m;
    }
  });

  const convoList = Object.entries(conversations).sort(
    ([, a], [, b]) => new Date(b.created_date) - new Date(a.created_date)
  );

  const currentMessages = selectedConvo
    ? combinedMessages.filter((m) => m.sender_email === selectedConvo || m.receiver_email === selectedConvo)
    : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages.length]);

  const sendMutation = useMutation({
    mutationFn: async (optimisticMsg) => {
      return base44.entities.Message.create({
        conversation_id: optimisticMsg.conversation_id,
        sender_email: optimisticMsg.sender_email,
        receiver_email: optimisticMsg.receiver_email,
        content: optimisticMsg.content,
        listing_id: params.get("listing") || "",
      });
    },
    onMutate: async (optimisticMsg) => {
      // Cancel in-flight refetches for both query keys
      await queryClient.cancelQueries({ queryKey: ["messages", me.email] });
      await queryClient.cancelQueries({ queryKey: ["messages-received", me.email] });

      const prevSent = queryClient.getQueryData(["messages", me.email]);
      const prevReceived = queryClient.getQueryData(["messages-received", me.email]);

      // Inject the optimistic message into the sent cache so it appears instantly
      queryClient.setQueryData(["messages", me.email], (old = []) => [optimisticMsg, ...old]);

      return { prevSent, prevReceived };
    },
    onError: (_err, _vars, ctx) => {
      // Roll back both caches on failure
      queryClient.setQueryData(["messages", me.email], ctx.prevSent);
      queryClient.setQueryData(["messages-received", me.email], ctx.prevReceived);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["messages-received"] });
    },
  });

  if (!me) return null;

  // Conversation view
  if (selectedConvo) {
    return (
      <div className="flex flex-col h-[calc(100vh-5rem)]">
        <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSelectedConvo(null)}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="font-semibold text-sm truncate">{selectedConvo}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {currentMessages.map((m) => (
            <div key={m.id} className={cn("flex", m.sender_email === me.email ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm",
                m.sender_email === me.email
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              )}>
                <p>{m.content}</p>
                <p className={cn("text-[10px] mt-1", m.sender_email === me.email ? "text-primary-foreground/60" : "text-muted-foreground")}>
                  {format(new Date(m.created_date), "h:mm a")}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-card border-t border-border px-4 py-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newMessage.trim()) return;
              const optimisticMsg = {
                id: `optimistic-${Date.now()}`,
                conversation_id: getConversationId(me.email, selectedConvo),
                sender_email: me.email,
                receiver_email: selectedConvo,
                content: newMessage.trim(),
                created_date: new Date().toISOString(),
                read: false,
              };
              setNewMessage("");
              sendMutation.mutate(optimisticMsg);
            }}
            className="flex gap-2"
          >
            <Input
              placeholder={t("type_message")}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="rounded-xl"
            />
            <Button type="submit" size="icon" className="rounded-xl shrink-0" disabled={!newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Conversations list
  return (
    <div>
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold">{t("messages")}</h1>
      </div>
      {convoList.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">{t("no_messages")}</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {convoList.map(([email, lastMsg]) => (
            <button
              key={email}
              onClick={() => setSelectedConvo(email)}
              className="w-full px-4 py-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">{email[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{email}</p>
                <p className="text-xs text-muted-foreground truncate">{lastMsg.content}</p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {format(new Date(lastMsg.created_date), "MMM d")}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}