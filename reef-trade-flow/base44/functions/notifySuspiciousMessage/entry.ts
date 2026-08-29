/**
 * notifySuspiciousMessage
 * Triggered by entity automation when a new Message is created.
 * If the message content contains a URL or phone number, emails all admin users.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const URL_REGEX = /https?:\/\/[^\s]+|www\.[^\s]+\.[^\s]{2,}/gi;
const PHONE_REGEX = /(\+?1[\s.\-]?)?(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/g;

function detectSuspicious(content) {
  const urls = content.match(URL_REGEX) || [];
  const phones = content.match(PHONE_REGEX) || [];
  return { urls, phones, found: urls.length > 0 || phones.length > 0 };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const body = await req.json();
  const message = body.data;

  if (!message?.content) {
    return Response.json({ skipped: true });
  }

  const { urls, phones, found } = detectSuspicious(message.content);

  if (!found) {
    return Response.json({ skipped: true, reason: 'no suspicious content' });
  }

  // Fetch all admin users
  const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });

  if (!admins.length) {
    return Response.json({ success: true, notified: 0, reason: 'no admins found' });
  }

  const detectedItems = [
    ...urls.map(u => `🔗 URL: <code>${u}</code>`),
    ...phones.map(p => `📞 Phone: <code>${p}</code>`),
  ].join('<br>');

  for (const admin of admins) {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: admin.email,
      subject: `⚠️ Suspicious message flagged — Reef Market`,
      body: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
          <h2 style="color:#dc2626;margin-bottom:4px;">⚠️ Suspicious Message Detected</h2>
          <p style="color:#666;margin-top:0;">A message was sent containing external URLs or phone numbers.</p>

          <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
            <tr>
              <td style="padding:6px 0;color:#888;width:120px;">From</td>
              <td style="padding:6px 0;font-weight:bold;">${message.sender_email}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#888;">To</td>
              <td style="padding:6px 0;">${message.receiver_email}</td>
            </tr>
            ${message.listing_id ? `<tr><td style="padding:6px 0;color:#888;">Listing ID</td><td style="padding:6px 0;">${message.listing_id}</td></tr>` : ''}
          </table>

          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin-top:16px;">
            <p style="margin:0 0 8px 0;font-weight:bold;font-size:13px;color:#991b1b;">Message Content:</p>
            <p style="margin:0;font-size:14px;word-break:break-word;">${message.content}</p>
          </div>

          <div style="margin-top:16px;">
            <p style="font-weight:bold;font-size:13px;color:#dc2626;margin-bottom:6px;">Detected:</p>
            <p style="font-size:14px;margin:0;">${detectedItems}</p>
          </div>

          <p style="margin-top:24px;font-size:12px;color:#aaa;">Reef Market admin alert. Review in the admin dashboard.</p>
        </div>
      `,
    });
  }

  return Response.json({ success: true, notified: admins.length, urls, phones });
});