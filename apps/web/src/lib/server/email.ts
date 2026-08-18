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
