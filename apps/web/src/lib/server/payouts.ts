import { fromCents, type SellerPayoutStatus } from "@reef-market/shared";
import { stripe } from "./stripe";
import { supabaseAdmin } from "./supabase-admin";
import { env } from "./env";

export interface PayoutStatus {
  connected: boolean;
  payoutsEnabled: boolean;
}

export async function getPayoutStatus(userId: string): Promise<PayoutStatus> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("seller_payout_accounts")
    .select("stripe_account_id, payouts_enabled")
    .eq("user_id", userId)
    .maybeSingle();
  return { connected: !!data?.stripe_account_id, payoutsEnabled: !!data?.payouts_enabled };
}

/**
 * Creates (or reuses) a Stripe Express connected account and returns a fresh
 * onboarding link. Rows imported from the legacy Base44 dataset carry Stripe
 * account IDs from that system's own Stripe account — those won't resolve
 * under whatever Stripe account this app's STRIPE_SECRET_KEY belongs to, so
 * "Connect Stripe" always creates a new account under this app's keys rather
 * than trusting a pre-existing stripe_account_id value.
 */
export async function createOnboardingLink(
  userId: string,
  email: string,
  returnUrl?: string,
  refreshUrl?: string
): Promise<string> {
  const db = supabaseAdmin();
  const { data: existing } = await db
    .from("seller_payout_accounts")
    .select("stripe_account_id")
    .eq("user_id", userId)
    .maybeSingle();

  let accountId = existing?.stripe_account_id ?? null;

  if (accountId) {
    try {
      await stripe().accounts.retrieve(accountId);
    } catch {
      accountId = null; // belongs to a different Stripe account/keys — start fresh
    }
  }

  if (!accountId) {
    const account = await stripe().accounts.create({
      type: "express",
      email,
      capabilities: { transfers: { requested: true }, card_payments: { requested: true } },
    });
    accountId = account.id;

    await db.from("seller_payout_accounts").upsert(
      { user_id: userId, stripe_account_id: accountId, onboarding_complete: false, payouts_enabled: false },
      { onConflict: "user_id" }
    );
  }

  const link = await stripe().accountLinks.create({
    account: accountId,
    // Mobile passes its own reefmarket:// deep link here so Stripe hands
    // the user back to the native app instead of stranding them on the web
    // profile page in an in-app browser tab they have to manually back out
    // of — see apps/mobile/src/lib/use-payout-status.ts.
    refresh_url: refreshUrl ?? `${env.appUrl}/profile?stripe=refresh`,
    return_url: returnUrl ?? `${env.appUrl}/profile?stripe=return`,
    type: "account_onboarding",
  });
  return link.url;
}

/** Called from the account.updated webhook event to sync payout eligibility. */
export async function syncPayoutAccountStatus(stripeAccountId: string, payoutsEnabled: boolean, detailsSubmitted: boolean): Promise<void> {
  const db = supabaseAdmin();
  await db
    .from("seller_payout_accounts")
    .update({ payouts_enabled: payoutsEnabled, onboarding_complete: detailsSubmitted })
    .eq("stripe_account_id", stripeAccountId);
}

export interface SellerEarningsSummary {
  payoutsEnabled: boolean;
  /** Sum of (total_charged - platform_fee) across every completed order as seller — the exact amount Stripe's transfer_data.destination actually sent to this seller's connected account, not GMV. */
  lifetimeEarned: number;
  /** From Stripe's own balance for this connected account — what's already payable out vs. still clearing. Stripe Express accounts pay out automatically on their own schedule; this isn't an app-held wallet. */
  stripeAvailable: number;
  stripePending: number;
  lastSold: { listingTitle: string; amount: number; createdAt: string } | null;
  lastBought: { listingTitle: string; amount: number; createdAt: string } | null;
}

export async function getSellerEarningsSummary(userId: string): Promise<SellerEarningsSummary> {
  const db = supabaseAdmin();

  const { data: payoutAccount } = await db
    .from("seller_payout_accounts")
    .select("stripe_account_id, payouts_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: completedSales } = await db
    .from("orders")
    .select("total_charged, platform_fee")
    .eq("seller_id", userId)
    .eq("status", "completed");
  const lifetimeEarned = (completedSales ?? []).reduce((sum, o) => sum + (o.total_charged - o.platform_fee), 0);

  const { data: lastSoldRow } = await db
    .from("orders")
    .select("listing_title, total_charged, platform_fee, created_at")
    .eq("seller_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: lastBoughtRow } = await db
    .from("orders")
    .select("listing_title, total_charged, created_at")
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let stripeAvailable = 0;
  let stripePending = 0;
  if (payoutAccount?.stripe_account_id && payoutAccount.payouts_enabled) {
    try {
      const balance = await stripe().balance.retrieve({}, { stripeAccount: payoutAccount.stripe_account_id });
      stripeAvailable = fromCents(balance.available.find((b) => b.currency === "usd")?.amount ?? 0);
      stripePending = fromCents(balance.pending.find((b) => b.currency === "usd")?.amount ?? 0);
    } catch {
      // best-effort — earnings/last-sold info above is still useful without it
    }
  }

  return {
    payoutsEnabled: !!payoutAccount?.payouts_enabled,
    lifetimeEarned,
    stripeAvailable,
    stripePending,
    lastSold: lastSoldRow
      ? { listingTitle: lastSoldRow.listing_title, amount: lastSoldRow.total_charged - lastSoldRow.platform_fee, createdAt: lastSoldRow.created_at }
      : null,
    lastBought: lastBoughtRow
      ? { listingTitle: lastBoughtRow.listing_title, amount: lastBoughtRow.total_charged, createdAt: lastBoughtRow.created_at }
      : null,
  };
}

/** Only covers sellers who've started Connect onboarding at least once — no row exists for a seller who never clicked "Connect Stripe". */
export async function listSellerPayoutAccounts(): Promise<SellerPayoutStatus[]> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("seller_payout_accounts")
    .select("user_id, stripe_account_id, onboarding_complete, payouts_enabled, created_at, updated_at, profiles(email, display_name)")
    .order("updated_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      user_id: row.user_id,
      stripe_account_id: row.stripe_account_id,
      onboarding_complete: row.onboarding_complete,
      payouts_enabled: row.payouts_enabled,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user_email: profile?.email ?? null,
      user_display_name: profile?.display_name ?? null,
    };
  });
}
