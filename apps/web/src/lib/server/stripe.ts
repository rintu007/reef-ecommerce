import Stripe from "stripe";
import { env } from "./env";

let client: Stripe | null = null;

/**
 * Lazy singleton, same pattern as supabase-admin.ts — throws only when a
 * caller actually needs Stripe, not at module load, so routes that don't
 * touch payments keep working before STRIPE_SECRET_KEY is configured.
 */
export function stripe(): Stripe {
  if (!client) {
    client = new Stripe(env.stripeSecretKey);
  }
  return client;
}
