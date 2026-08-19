import { Resend } from "resend";
import { env } from "./env";

let client: Resend | null = null;

/** Lazy singleton, same pattern as stripe.ts / supabase-admin.ts. */
function resend(): Resend {
  if (!client) {
    client = new Resend(env.resendApiKey);
  }
  return client;
}

/**
 * Sandbox sender — works without domain verification, but Resend restricts
 * it to sending only to the account owner's own verified email until a
 * custom domain is added. Swap for a verified "from" address once one's set
 * up (Resend dashboard → Domains).
 */
const FROM = "Reef Market <onboarding@resend.dev>";

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  const { error } = await resend().emails.send({
    from: FROM,
    to,
    subject: "Reset your Reef Market password",
    html: `
      <p>Someone requested a password reset for your Reef Market account.</p>
      <p><a href="${resetLink}">Click here to reset your password</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p style="color:#888;font-size:12px">${resetLink}</p>
    `,
  });
  if (error) throw new Error(`Failed to send password reset email: ${error.message}`);
}

/**
 * Legacy parity: legacy's Announce tab could email every registered user in
 * addition to showing the in-app popup. Batched at 100/request — Resend's
 * batch endpoint's own limit, not a guess — so a few thousand users is a
 * handful of requests instead of one per recipient.
 *
 * IMPORTANT: `FROM` above is Resend's sandbox sender, which only actually
 * delivers to the Resend account owner's own verified address until a
 * custom domain is verified (Resend dashboard → Domains). Until then, this
 * function will report per-recipient failures for everyone except that one
 * address — it's wired up correctly, but not yet capable of a real blast.
 */
export async function sendAnnouncementBroadcast(
  recipients: string[],
  subject: string,
  message: string
): Promise<{ sent: number; failed: number }> {
  const html = `<p>${message.replace(/\n/g, "<br/>")}</p>`;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += 100) {
    const batch = recipients.slice(i, i + 100);
    // batchValidation: "permissive" — default "strict" fails the whole batch
    // atomically on a single bad recipient, which would hide every other
    // real send behind one sandbox-blocked address.
    const { data, error } = await resend().batch.send(
      batch.map((to) => ({ from: FROM, to, subject, html })),
      { batchValidation: "permissive" }
    );
    if (error) {
      failed += batch.length;
      continue;
    }
    const errorCount = data?.errors?.length ?? 0;
    sent += batch.length - errorCount;
    failed += errorCount;
  }

  return { sent, failed };
}
