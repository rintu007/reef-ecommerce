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

/** Legacy parity: reef-trade-flow's Support page "Send Us a Message" contact form. */
export async function sendSupportMessage(input: { name: string; email: string; type: string; message: string }): Promise<void> {
  const { error } = await resend().emails.send({
    from: FROM,
    to: "Andrew@freedomrisingnow.org",
    replyTo: input.email,
    subject: `[Reef Market Support] ${input.type === "feedback" ? "Feedback" : "Question"} from ${input.name}`,
    html: `
      <p><strong>Name:</strong> ${input.name}</p>
      <p><strong>Email:</strong> ${input.email}</p>
      <p><strong>Type:</strong> ${input.type}</p>
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap;">${input.message}</p>
    `,
  });
  if (error) throw new Error(`Failed to send support message: ${error.message}`);
}

/** Legacy parity: reef-trade-flow's notifyMatchingSavedSearches automation email. */
export async function sendSavedSearchMatchEmail(
  to: string,
  listing: { id: string; title: string; price: number; photos: string[]; location: string | null },
  searchNames: string[]
): Promise<void> {
  const listingUrl = `${env.appUrl}/listings/${listing.id}`;
  const photo = listing.photos[0] ? `<img src="${listing.photos[0]}" style="max-width:100%;border-radius:8px;margin-bottom:12px;" />` : "";
  const searchList = searchNames.map((n) => `• ${n}`).join("<br>");

  const { error } = await resend().emails.send({
    from: FROM,
    to,
    subject: `New listing match: ${listing.title}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2 style="margin-bottom:4px;">New listing matches your saved search</h2>
        <p style="color:#666;margin-top:0;">A listing was just posted that matches one of your saved searches.</p>
        ${photo}
        <h3 style="margin-bottom:4px;">${listing.title}</h3>
        <p style="font-size:22px;font-weight:bold;color:#0ea5e9;margin:4px 0;">$${listing.price}</p>
        ${listing.location ? `<p style="color:#666;font-size:14px;">📍 ${listing.location}</p>` : ""}
        <p style="font-size:13px;color:#888;margin-top:12px;">Matched your saved search${searchNames.length > 1 ? "es" : ""}:<br>${searchList}</p>
        <a href="${listingUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">View Listing</a>
        <p style="margin-top:24px;font-size:12px;color:#aaa;">You can manage your saved searches in your profile. Reef Market.</p>
      </div>
    `,
  });
  if (error) throw new Error(`Failed to send saved-search match email: ${error.message}`);
}

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
