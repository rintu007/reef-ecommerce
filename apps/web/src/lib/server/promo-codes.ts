import type { PromoCode, PromoCodeCreateInput, PromoCodeRedemption, PromoCodeUpdateInput } from "@reef-market/shared";
import { AppError } from "./http";
import { supabaseAdmin } from "./supabase-admin";

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Grants for the two free_membership types map to the plan slugs the legacy
 * Admin UI's promo labels reference ("Free Pro Membership — 6 Months",
 * "Free Business Membership — 1 Year") — see project-legacy-parity-audit.
 */
const FREE_MEMBERSHIP_GRANTS = {
  free_membership_6mo: { planSlug: "pro" as const, months: 6, label: "Hobbyist Premium" },
  free_membership_1yr: { planSlug: "business" as const, months: 12, label: "Business" },
};

export async function redeemPromoCode(userId: string, rawCode: string): Promise<{ granted: string }> {
  const code = rawCode.trim();
  if (!code) throw new AppError("Enter a promo code");

  const db = supabaseAdmin();
  const { data: promo, error } = await db.from("promo_codes").select("*").ilike("code", code).maybeSingle();
  if (error) throw error;
  if (!promo || !promo.is_active) throw new AppError("Invalid or inactive promo code");
  if (promo.expires_at && promo.expires_at < toIsoDate(new Date())) throw new AppError("This promo code has expired");
  if (promo.uses >= promo.max_uses) throw new AppError("This promo code has reached its use limit");

  const { error: redemptionError } = await db
    .from("promo_code_redemptions")
    .insert({ promo_code_id: promo.id, user_id: userId });
  if (redemptionError) {
    if (redemptionError.code === "23505") throw new AppError("You've already redeemed this code");
    throw redemptionError;
  }

  let granted: string;
  if (promo.type === "bonus_listings") {
    const bonus = promo.bonus_listings ?? 0;
    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("bonus_listing_slots")
      .eq("id", userId)
      .single();
    if (profileError) throw profileError;
    const { error: updateError } = await db
      .from("profiles")
      .update({ bonus_listing_slots: (profile.bonus_listing_slots as number) + bonus })
      .eq("id", userId);
    if (updateError) throw updateError;
    granted = `${bonus} bonus listing slot${bonus === 1 ? "" : "s"} added!`;
  } else {
    const grant = FREE_MEMBERSHIP_GRANTS[promo.type as keyof typeof FREE_MEMBERSHIP_GRANTS];
    const periodStart = new Date();
    const periodEnd = addMonths(periodStart, grant.months);

    const { data: existing, error: existingError } = await db
      .from("user_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .maybeSingle();
    if (existingError) throw existingError;

    const row = {
      plan_slug: grant.planSlug,
      status: "active" as const,
      current_period_start: toIsoDate(periodStart),
      current_period_end: toIsoDate(periodEnd),
      payment_provider: "promo" as const,
      external_subscription_id: null,
      external_customer_id: null,
    };

    if (existing) {
      const { error: subError } = await db.from("user_subscriptions").update(row).eq("id", existing.id);
      if (subError) throw subError;
    } else {
      const { error: subError } = await db.from("user_subscriptions").insert({ ...row, user_id: userId });
      if (subError) throw subError;
    }
    granted = `${grant.label} membership granted through ${row.current_period_end}!`;
  }

  const { error: usesError } = await db.from("promo_codes").update({ uses: promo.uses + 1 }).eq("id", promo.id);
  if (usesError) throw usesError;

  return { granted };
}

export async function listAdminPromoCodes(params: { limit?: number; offset?: number } = {}): Promise<{ promoCodes: PromoCode[]; total: number }> {
  const db = supabaseAdmin();
  const limit = Math.min(params.limit ?? 50, 200);
  const offset = Math.max(params.offset ?? 0, 0);

  const { data, error, count } = await db
    .from("promo_codes")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return { promoCodes: (data ?? []) as PromoCode[], total: count ?? data?.length ?? 0 };
}

export async function createPromoCode(input: PromoCodeCreateInput): Promise<PromoCode> {
  const db = supabaseAdmin();
  const { data, error } = await db.from("promo_codes").insert(input).select().single();
  if (error) throw error;
  return data as PromoCode;
}

export async function updatePromoCode(id: string, input: PromoCodeUpdateInput): Promise<PromoCode> {
  const db = supabaseAdmin();
  const { data, error } = await db.from("promo_codes").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data as PromoCode;
}

export async function deletePromoCode(id: string): Promise<void> {
  const db = supabaseAdmin();
  const { error } = await db.from("promo_codes").delete().eq("id", id);
  if (error) throw error;
}

/** Who redeemed a given code, and when — the aggregate uses/max_uses count on the code itself doesn't say. */
export async function getPromoCodeRedemptions(promoCodeId: string): Promise<PromoCodeRedemption[]> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("promo_code_redemptions")
    .select("id, user_id, redeemed_at, profiles(email, display_name)")
    .eq("promo_code_id", promoCodeId)
    .order("redeemed_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.id,
      user_id: row.user_id,
      redeemed_at: row.redeemed_at,
      user_email: profile?.email ?? null,
      user_display_name: profile?.display_name ?? null,
    };
  });
}
