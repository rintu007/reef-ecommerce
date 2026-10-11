import { NextResponse, after } from "next/server";
import { sendMessageSchema } from "@reef-market/shared";
import { requireUser } from "@/lib/server/auth";
import { apiError, handleRouteError } from "@/lib/server/http";
import { notifyNewMessage, sendMessage } from "@/lib/server/messages";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const input = sendMessageSchema.parse(body);

    if (input.recipient_id === user.id) {
      return apiError("Cannot message yourself", 400);
    }

    const message = await sendMessage(user.id, input);
    after(() => notifyNewMessage(message, input.recipient_id).catch((err) => console.error("notifyNewMessage failed", err)));
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
