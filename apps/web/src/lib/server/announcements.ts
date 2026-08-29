import type { Announcement, AnnouncementCreateInput, AnnouncementUpdateInput } from "@reef-market/shared";
import type { AuthUser } from "./auth";
import { sendAnnouncementBroadcast } from "./email";
import { AppError } from "./http";
import { supabaseAdmin } from "./supabase-admin";

/** Most recent active announcement visible to this viewer, or null. No per-user view-cap tracking table exists — max_views is enforced client-side via local storage. */
export async function getActiveAnnouncement(viewer: AuthUser | null): Promise<Announcement | null> {
  const db = supabaseAdmin();
  let query = db.from("announcements").select("*").eq("is_active", true);
  if (!viewer) query = query.eq("show_to_guests", true);
  query = query.order("created_at", { ascending: false }).limit(1);

  const { data, error } = await query;
  if (error) throw error;
  return (data?.[0] ?? null) as Announcement | null;
}

export async function listAdminAnnouncements(params: { limit?: number; offset?: number } = {}): Promise<{ announcements: Announcement[]; total: number }> {
  const db = supabaseAdmin();
  const limit = Math.min(params.limit ?? 50, 200);
  const offset = Math.max(params.offset ?? 0, 0);

  const { data, error, count } = await db
    .from("announcements")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return { announcements: (data ?? []) as Announcement[], total: count ?? data?.length ?? 0 };
}

export async function createAnnouncement(input: AnnouncementCreateInput): Promise<Announcement> {
  const db = supabaseAdmin();
  const { data, error } = await db.from("announcements").insert(input).select().single();
  if (error) throw error;
  return data as Announcement;
}

export async function updateAnnouncement(id: string, input: AnnouncementUpdateInput): Promise<Announcement> {
  const db = supabaseAdmin();
  const { data, error } = await db.from("announcements").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data as Announcement;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const db = supabaseAdmin();
  const { error } = await db.from("announcements").delete().eq("id", id);
  if (error) throw error;
}

export interface BroadcastInput {
  subject: string;
  message: string;
  sendEmail: boolean;
  sendPopup: boolean;
  maxViews: number;
  showToGuests: boolean;
}

export interface BroadcastResult {
  popupCreated: boolean;
  emailsSent: number;
  emailsFailed: number;
}

/**
 * Legacy parity: reef-trade-flow's admin "Broadcast Announcement" (sendBroadcastMessage)
 * — an in-app popup, an email blast, or both, in one step. Shares the same
 * `sendAnnouncementBroadcast` sender and `emailed_at` idempotency stamp as
 * `sendAnnouncementEmail` below (the follow-up "email this existing
 * announcement" action) so the two entry points can't double-email the same
 * announcement.
 */
export async function broadcastAnnouncement(input: BroadcastInput): Promise<BroadcastResult> {
  let popupId: string | null = null;
  if (input.sendPopup) {
    const announcement = await createAnnouncement({
      subject: input.subject,
      message: input.message,
      is_active: true,
      max_views: input.maxViews,
      show_to_guests: input.showToGuests,
    });
    popupId = announcement.id;
  }

  let emailsSent = 0;
  let emailsFailed = 0;
  if (input.sendEmail) {
    const db = supabaseAdmin();
    const { data: profiles, error } = await db.from("profiles").select("email").not("email", "is", null);
    if (error) throw error;
    const emails = (profiles ?? []).map((p) => p.email).filter((e): e is string => !!e);
    const result = await sendAnnouncementBroadcast(emails, input.subject, input.message);
    emailsSent = result.sent;
    emailsFailed = result.failed;

    if (popupId) {
      const { error: stampError } = await db.from("announcements").update({ emailed_at: new Date().toISOString() }).eq("id", popupId);
      if (stampError) throw stampError;
    }
  }

  return { popupCreated: !!popupId, emailsSent, emailsFailed };
}

/** Legacy parity: broadcasting an already-existing announcement by email, not just the in-app popup. One-shot — repeat calls after the first success are rejected so a re-click can't double-email everyone. */
export async function sendAnnouncementEmail(id: string): Promise<{ sent: number; failed: number }> {
  const db = supabaseAdmin();

  const { data: announcement, error: fetchError } = await db
    .from("announcements")
    .select("subject, message, emailed_at")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!announcement) throw new AppError("Announcement not found", 404);
  if (announcement.emailed_at) throw new AppError("This announcement has already been emailed", 400);

  const { data: profiles, error: profilesError } = await db.from("profiles").select("email").not("email", "is", null);
  if (profilesError) throw profilesError;
  const recipients = (profiles ?? []).map((p) => p.email).filter((e): e is string => !!e);

  const result = await sendAnnouncementBroadcast(recipients, announcement.subject, announcement.message);

  const { error: updateError } = await db.from("announcements").update({ emailed_at: new Date().toISOString() }).eq("id", id);
  if (updateError) throw updateError;

  return result;
}
