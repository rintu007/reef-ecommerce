import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { listConversations } from "@/lib/server/messages";

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function MessagesPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");

  const conversations = await listConversations(user.id);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      {conversations.length === 0 ? (
        <p className="text-gray-500 text-center py-16">No conversations yet.</p>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/messages/${c.id}`}
              className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg shrink-0 overflow-hidden">
                {c.other_participant.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.other_participant.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  "👤"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm truncate">
                    {c.other_participant.display_name ?? "Reef Market User"}
                  </p>
                  <span className="text-xs text-gray-400 shrink-0">{timeAgo(c.last_message_at)}</span>
                </div>
                <p className="text-sm text-gray-500 truncate">{c.last_message?.content ?? ""}</p>
              </div>
              {c.unread_count > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                  {c.unread_count}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
