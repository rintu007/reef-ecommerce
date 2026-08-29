import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { subject, message, send_email = true, send_popup = false, max_views = 1, show_to_guests = false } = await req.json();

    if (!subject || !message) {
      return Response.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    let sent = 0;
    let failed = 0;

    // Save announcement as popup if requested
    if (send_popup) {
      await base44.asServiceRole.entities.Announcement.create({ subject, message, is_active: true, max_views, show_to_guests });
    }

    // Email all users if requested
    if (send_email) {
      const users = await base44.asServiceRole.entities.User.list('-created_date', 2000);
      for (const u of users) {
        if (!u.email) continue;
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: u.email,
            subject: subject,
            body: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="background: #0ea5e9; padding: 16px 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">🪸 Reef Market Announcement</h1>
  </div>
  <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="color: #334155; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
    <p style="color: #94a3b8; font-size: 12px; margin: 0;">You're receiving this because you have a Reef Market account. This message was sent to all users.</p>
  </div>
</div>
            `.trim(),
          });
          sent++;
        } catch {
          failed++;
        }
      }
    }

    return Response.json({ success: true, sent, failed, popup_created: send_popup });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});