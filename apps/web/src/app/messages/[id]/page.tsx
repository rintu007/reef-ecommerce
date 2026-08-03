import { notFound, redirect } from "next/navigation";
import { MessageThread } from "@/components/MessageThread";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { getConversationMessages } from "@/lib/server/messages";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");

  const thread = await getConversationMessages(id, user.id);
  if (!thread) notFound();

  return <MessageThread thread={thread} currentUserId={user.id} />;
}
