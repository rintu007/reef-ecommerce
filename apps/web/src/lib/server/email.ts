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

/**
 * Shared branded shell for every outbound email — same gradient header
 * (🪸 Reef Market) and color scheme as the app itself (primary #0b81b7 →
 * #0a4a6b, matching the mobile Home screen's hero gradient), so a password
 * reset or a broadcast doesn't look like a different, unbranded product.
 * Table-based layout deliberately (not flexbox/grid) — this is the one
 * place CSS support can't be assumed; most email clients still render
 * against a decade-old subset of CSS.
 */
function wrapEmail(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background-color:#eef2f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f6;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(23,29,38,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#0b81b7,#0a4a6b);padding:36px 32px 30px;text-align:center;">
                <div style="font-size:34px;line-height:1;margin-bottom:10px;">🪸</div>
                <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">Reef Market</div>
                <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">The aquarium hobbyist marketplace</div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px;border-top:1px solid #eef2f6;text-align:center;">
                <div style="font-size:12px;color:#94a3b8;">Reef Market — built for aquarium hobbyists.</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

const emailHeading = (text: string) =>
  `<h1 style="margin:0 0 12px;font-size:21px;font-weight:800;color:#171d26;">${text}</h1>`;

const emailParagraph = (html: string) =>
  `<p style="margin:0 0 16px;font-size:14px;line-height:1.65;color:#475569;">${html}</p>`;

const emailButton = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;padding:14px 28px;background-color:#0b81b7;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">${label}</a>`;

/** Legacy parity: reef-trade-flow's Support page "Send Us a Message" contact form. */
export async function sendSupportMessage(input: { name: string; email: string; type: string; message: string }): Promise<void> {
  const body = `
    ${emailHeading(input.type === "feedback" ? "New feedback" : "New support question")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr><td style="padding:4px 0;font-size:13px;color:#94a3b8;width:80px;">Name</td><td style="padding:4px 0;font-size:14px;color:#171d26;font-weight:600;">${input.name}</td></tr>
      <tr><td style="padding:4px 0;font-size:13px;color:#94a3b8;">Email</td><td style="padding:4px 0;font-size:14px;color:#171d26;font-weight:600;">${input.email}</td></tr>
    </table>
    <div style="background-color:#f8fafc;border-radius:10px;padding:16px;white-space:pre-wrap;font-size:14px;line-height:1.6;color:#334155;">${input.message}</div>
  `;
  const { error } = await resend().emails.send({
    from: FROM,
    to: "Andrew@freedomrisingnow.org",
    replyTo: input.email,
    subject: `[Reef Market Support] ${input.type === "feedback" ? "Feedback" : "Question"} from ${input.name}`,
    html: wrapEmail(body),
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
  const photo = listing.photos[0]
    ? `<img src="${listing.photos[0]}" style="width:100%;max-height:260px;object-fit:cover;border-radius:12px;margin-bottom:16px;" />`
    : "";
  const searchList = searchNames.map((n) => `• ${n}`).join("<br>");

  const body = `
    ${emailHeading("A new listing matches your search")}
    ${emailParagraph("A listing was just posted that matches one of your saved searches.")}
    ${photo}
    <h2 style="margin:0 0 4px;font-size:17px;font-weight:700;color:#171d26;">${listing.title}</h2>
    <p style="margin:0 0 4px;font-size:24px;font-weight:800;color:#0b81b7;">$${listing.price}</p>
    ${listing.location ? `<p style="margin:0 0 16px;font-size:13px;color:#94a3b8;">📍 ${listing.location}</p>` : '<div style="margin-bottom:12px;"></div>'}
    <p style="margin:0 0 20px;font-size:12px;color:#94a3b8;">Matched your saved search${searchNames.length > 1 ? "es" : ""}:<br>${searchList}</p>
    ${emailButton(listingUrl, "View Listing")}
    <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;">You can manage your saved searches from your profile.</p>
  `;

  const { error } = await resend().emails.send({
    from: FROM,
    to,
    subject: `New listing match: ${listing.title}`,
    html: wrapEmail(body),
  });
  if (error) throw new Error(`Failed to send saved-search match email: ${error.message}`);
}

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  const body = `
    ${emailHeading("Reset your password")}
    ${emailParagraph("Someone requested a password reset for your Reef Market account. Click the button below to choose a new one.")}
    ${emailButton(resetLink, "Reset Password")}
    <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#94a3b8;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
    <p style="margin:16px 0 0;font-size:12px;color:#cbd5e1;word-break:break-all;">Or paste this link into your browser:<br>${resetLink}</p>
  `;
  const { error } = await resend().emails.send({
    from: FROM,
    to,
    subject: "Reset your Reef Market password",
    html: wrapEmail(body),
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
  const body = `
    ${emailHeading(subject)}
    <div style="font-size:14px;line-height:1.65;color:#334155;white-space:pre-wrap;">${message.replace(/\n/g, "<br/>")}</div>
  `;
  const html = wrapEmail(body);
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
