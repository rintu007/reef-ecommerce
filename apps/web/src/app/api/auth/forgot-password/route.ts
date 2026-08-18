import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/server/env";
import { supabaseAdmin } from "@/lib/server/supabase-admin";
import { sendPasswordResetEmail } from "@/lib/server/email";
import { handleRouteError } from "@/lib/server/http";

const inputSchema = z.object({ email: z.string().email() });

/**
 * Bypasses Supabase's own recovery email entirely. `resetPasswordForEmail`
 * (the direct client-SDK call) builds its link from the project's Auth
 * "Site URL" setting, which is dashboard-only config neither this repo nor
 * this deploy can reach — and on this project it's still pointed at
 * `http://127.0.0.1:3000` from initial setup, so every emailed link was
 * dead on arrival.
 *
 * `admin.generateLink` sidesteps that: it returns a `hashed_token` directly
 * in the API response regardless of the (broken) redirect config, so we
 * build the reset link ourselves from `env.appUrl` — which we do control —
 * and send it via Resend instead of Supabase's own mailer. The web
 * `/reset-password` page then exchanges `token_hash` via `verifyOtp`, which
 * doesn't touch Site URL/redirect validation at all.
 */
export async function POST(request: Request) {
  try {
    const { email } = inputSchema.parse(await request.json());

    const { data, error } = await supabaseAdmin().auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${env.appUrl}/reset-password` },
    });

    // Don't leak whether the email exists — same privacy behavior as
    // Supabase's own resetPasswordForEmail. Only real send failures throw;
    // "user not found" (and similar) are logged server-side and swallowed.
    if (!error && data.properties?.hashed_token) {
      const link = `${env.appUrl}/reset-password?token_hash=${data.properties.hashed_token}&type=recovery`;
      await sendPasswordResetEmail(email, link);
    } else if (error) {
      console.error("forgot-password generateLink error:", error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
