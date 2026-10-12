import { getSellerEarnings, type SellerEarningsSummary } from "@reef-market/shared";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { apiClient } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/Skeleton";

// Stale-while-revalidate: show the last known numbers instantly on every
// revisit and refresh in the background, instead of a spinner + a Stripe
// API round trip each time the profile tab regains focus.
let cached: SellerEarningsSummary | null = null;
let fetchedAt = 0;
const FRESH_MS = 30_000;

/** Module-level so the staleness check (Date.now) stays out of the component — the React Compiler's purity lint flags it even inside callbacks. Resolves null when the cache is still fresh. */
async function fetchIfStale(): Promise<SellerEarningsSummary | null> {
  if (cached && Date.now() - fetchedAt < FRESH_MS) return null;
  const s = await getSellerEarnings(apiClient);
  cached = s;
  fetchedAt = Date.now();
  return s;
}

const money = (n: number) => `$${n.toFixed(2)}`;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * The app never holds funds — Stripe moves the money straight to the
 * seller's connected account — so "available" and "pending" are Stripe's
 * own balance for that account, and payouts happen automatically on
 * Stripe's schedule rather than via a withdraw button.
 */
export function EarningsSection() {
  const [summary, setSummary] = useState<SellerEarningsSummary | null>(cached);

  useFocusEffect(
    useCallback(() => {
      fetchIfStale()
        .then((s) => {
          if (s) setSummary(s);
        })
        .catch(() => {});
    }, [])
  );

  if (!summary) {
    return (
      <View className="rounded-xl border border-border bg-card p-4 gap-3">
        <Skeleton style={{ height: 14, width: 80 }} />
        <Skeleton style={{ height: 28, width: 120 }} />
        <Skeleton style={{ height: 56, width: "100%" }} />
      </View>
    );
  }

  const hasActivity = summary.payoutsEnabled || summary.lifetimeEarned > 0 || !!summary.lastSold || !!summary.lastBought;
  if (!hasActivity) return null;

  return (
    <View className="rounded-xl border border-border bg-card p-4">
      <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total earned</Text>
      <Text className="text-3xl font-extrabold text-foreground mt-1">{money(summary.lifetimeEarned)}</Text>
      <Text className="text-xs text-muted-foreground mt-0.5">From completed sales, after Reef Market&apos;s fee</Text>

      {summary.payoutsEnabled && (
        <>
          <View className="flex-row gap-3 mt-4">
            <View className="flex-1 rounded-xl bg-emerald-50 p-3">
              <Text className="text-xs font-medium text-emerald-800">Ready to pay out</Text>
              <Text className="text-xl font-bold text-emerald-900 mt-1">{money(summary.stripeAvailable)}</Text>
            </View>
            <View className="flex-1 rounded-xl bg-amber-50 p-3">
              <Text className="text-xs font-medium text-amber-800">Clearing</Text>
              <Text className="text-xl font-bold text-amber-900 mt-1">{money(summary.stripePending)}</Text>
            </View>
          </View>
          <Text className="text-xs text-muted-foreground mt-3 leading-5">
            Stripe sends &quot;ready&quot; money to your bank automatically. &quot;Clearing&quot; becomes ready once the
            buyer&apos;s payment settles — usually a few business days.
          </Text>
        </>
      )}

      {(summary.lastSold || summary.lastBought) && (
        <View className="mt-4 pt-3 border-t border-border gap-3">
          {summary.lastSold && (
            <View>
              <Text className="text-xs text-muted-foreground">Last sold · {formatDate(summary.lastSold.createdAt)}</Text>
              <View className="flex-row items-center justify-between mt-0.5">
                <Text className="text-sm font-semibold text-foreground flex-1 pr-3" numberOfLines={1}>
                  {summary.lastSold.listingTitle}
                </Text>
                <Text className="text-sm font-bold text-emerald-700">+{money(summary.lastSold.amount)}</Text>
              </View>
            </View>
          )}
          {summary.lastBought && (
            <View>
              <Text className="text-xs text-muted-foreground">Last bought · {formatDate(summary.lastBought.createdAt)}</Text>
              <View className="flex-row items-center justify-between mt-0.5">
                <Text className="text-sm font-semibold text-foreground flex-1 pr-3" numberOfLines={1}>
                  {summary.lastBought.listingTitle}
                </Text>
                <Text className="text-sm font-bold text-foreground">{money(summary.lastBought.amount)}</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
