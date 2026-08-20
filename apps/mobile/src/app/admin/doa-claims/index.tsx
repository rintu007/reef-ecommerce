import { listDoaClaims, type AdminDoaClaim, type DoaClaimReviewStatus } from "@reef-market/shared";
import { Link, Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminGate } from "@/components/AdminGate";
import { markAdminBadgeSeen } from "@/components/admin/NewSinceBadge";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";
import { safeGoBack } from "@/lib/navigation";

const STATUS_TABS: { value: DoaClaimReviewStatus | "all"; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "denied", label: "Denied" },
  { value: "all", label: "All" },
];

const STATUS_COLORS: Record<DoaClaimReviewStatus, { bg: string; fg: string }> = {
  pending: { bg: "#fef3c7", fg: "#92400e" },
  approved: { bg: "#d1fae5", fg: "#047857" },
  denied: { bg: "#f3f4f6", fg: "#4b5563" },
};

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`px-3 py-1.5 rounded-full ${active ? "bg-primary" : "bg-muted"}`}>
      <Text className={`text-xs font-semibold ${active ? "text-primary-foreground" : "text-muted-foreground"}`}>{label}</Text>
    </Pressable>
  );
}

function DoaClaimsContent() {
  const [status, setStatus] = useState<DoaClaimReviewStatus | "all">("pending");
  const [claims, setClaims] = useState<AdminDoaClaim[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { claims, total } = await listDoaClaims(apiClient, {
        status: status === "all" ? undefined : status,
        limit: 100,
      });
      setClaims(claims);
      setTotal(total);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      listDoaClaims(apiClient, { status: "pending", limit: 1 }).then(({ total }) => markAdminBadgeSeen("doa_claims", total));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View className="flex-row flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Chip key={tab.value} label={tab.label} active={status === tab.value} onPress={() => setStatus(tab.value)} />
        ))}
      </View>

      <Text className="text-xs text-muted-foreground">
        {total} claim{total === 1 ? "" : "s"}
      </Text>

      {loading ? (
        <View className="items-center py-8">
          <ActivityIndicator color={themeColors.primary} />
        </View>
      ) : claims.length === 0 ? (
        <Text className="text-sm text-muted-foreground text-center py-8">No claims in this view.</Text>
      ) : (
        <View className="gap-2">
          {claims.map((claim) => {
            const colors = STATUS_COLORS[claim.doa_claim_status ?? "pending"];
            return (
              <Link key={claim.id} href={`/orders/${claim.id}`} asChild>
                <Pressable className="rounded-xl border border-border bg-card p-3">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="min-w-0 flex-1">
                      <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                        {claim.listing_title}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-1" numberOfLines={1}>
                        Buyer: {claim.buyer?.display_name ?? claim.buyer?.email ?? "unknown"} · Seller:{" "}
                        {claim.seller?.display_name ?? claim.seller?.email ?? "unknown"}
                      </Text>
                      {claim.doa_claim_reason && (
                        <Text className="text-sm text-muted-foreground mt-1" numberOfLines={2}>
                          {claim.doa_claim_reason}
                        </Text>
                      )}
                      <Text className="text-xs text-muted-foreground mt-1">
                        ${(claim.total_charged ?? claim.price).toFixed(2)}
                        {claim.doa_claim_photos.length > 0 && ` · ${claim.doa_claim_photos.length} photo${claim.doa_claim_photos.length === 1 ? "" : "s"}`}
                        {claim.doa_claim_filed_at && ` · filed ${new Date(claim.doa_claim_filed_at).toLocaleDateString()}`}
                      </Text>
                    </View>
                    <View className="shrink-0 px-2.5 py-1 rounded-full" style={{ backgroundColor: colors.bg }}>
                      <Text className="text-xs font-semibold capitalize" style={{ color: colors.fg }}>
                        {claim.doa_claim_status}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </Link>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

export default function AdminDoaClaimsScreen() {
  const router = useRouter();
  return (
    <AdminGate>
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
          <Pressable onPress={() => safeGoBack(router)} className="w-9 h-9 items-center justify-center -ml-2">
            <ArrowLeft size={20} color={themeColors.foreground} />
          </Pressable>
          <Text className="text-base font-semibold text-foreground">DOA Claims</Text>
        </View>
        <DoaClaimsContent />
      </SafeAreaView>
    </AdminGate>
  );
}
