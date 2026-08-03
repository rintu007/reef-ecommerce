import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { getOrCreateConversation } from "@/lib/server/messages";

export default async function NewConversationPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string; listing?: string }>;
}) {
  const { to, listing } = await searchParams;
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");
  if (!to || to === user.id) redirect("/messages");

  const conversationId = await getOrCreateConversation(user.id, to, listing ?? null);
  redirect(`/messages/${conversationId}`);
}
