import {
  createPromoCode,
  deletePromoCode,
  listAdminPromoCodes,
  listPromoCodeRedemptions,
  updatePromoCode,
  type PromoCode,
  type PromoCodeRedemption,
  type PromoType,
} from "@reef-market/shared";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminGate } from "@/components/AdminGate";
import { apiClient } from "@/lib/api-client";
import { confirmAsync, notify } from "@/lib/alert";
import { themeColors } from "@/lib/theme-colors";
import { safeGoBack } from "@/lib/navigation";

const PROMO_TYPES: { value: PromoType; label: string }[] = [
  { value: "bonus_listings", label: "Bonus Listings" },
  { value: "free_membership_6mo", label: "Free Pro Membership — 6 Months" },
  { value: "free_membership_1yr", label: "Free Business Membership — 1 Year" },
];

function FieldLabel({ children }: { children: string }) {
  return <Text className="text-xs font-medium text-muted-foreground mb-1">{children}</Text>;
}

const inputClassName = "border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground";

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`px-3 py-2 rounded-full ${active ? "bg-primary" : "bg-muted"}`}>
      <Text className={`text-xs font-semibold ${active ? "text-primary-foreground" : "text-muted-foreground"}`}>{label}</Text>
    </Pressable>
  );
}

function PromoCodesContent() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [redemptions, setRedemptions] = useState<PromoCodeRedemption[]>([]);
  const [redemptionsLoading, setRedemptionsLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [type, setType] = useState<PromoType>("bonus_listings");
  const [bonusListings, setBonusListings] = useState("1");
  const [maxUses, setMaxUses] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { promoCodes } = await listAdminPromoCodes(apiClient, { limit: 100 });
      setCodes(promoCodes);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  function resetForm() {
    setEditingId(null);
    setCode("");
    setType("bonus_listings");
    setBonusListings("1");
    setMaxUses("1");
    setExpiresAt("");
    setNotes("");
    setIsActive(true);
  }

  function startEdit(promo: PromoCode) {
    setEditingId(promo.id);
    setCode(promo.code);
    setType(promo.type);
    setBonusListings(String(promo.bonus_listings ?? 1));
    setMaxUses(String(promo.max_uses));
    setExpiresAt(promo.expires_at ?? "");
    setNotes(promo.notes ?? "");
    setIsActive(promo.is_active);
    setError(null);
  }

  async function handleSubmit() {
    if (!code.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        type,
        bonus_listings: type === "bonus_listings" ? Number(bonusListings) || 1 : null,
        max_uses: Number(maxUses) || 1,
        expires_at: expiresAt.trim() || null,
        notes: notes.trim() || null,
        is_active: editingId ? isActive : true,
      };
      if (editingId) {
        await updatePromoCode(apiClient, editingId, payload);
      } else {
        await createPromoCode(apiClient, payload);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save promo code");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(promo: PromoCode) {
    setBusyId(promo.id);
    try {
      await updatePromoCode(apiClient, promo.id, { is_active: !promo.is_active });
      await load();
    } catch (err) {
      notify("Failed to update", err instanceof Error ? err.message : undefined);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirmAsync("Delete promo code?", "This can't be undone.", "Delete");
    if (!ok) return;
    setBusyId(id);
    try {
      await deletePromoCode(apiClient, id);
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      notify("Failed to delete", err instanceof Error ? err.message : undefined);
    } finally {
      setBusyId(null);
    }
  }

  async function toggleRedemptions(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    setRedemptionsLoading(true);
    try {
      const { redemptions } = await listPromoCodeRedemptions(apiClient, id);
      setRedemptions(redemptions);
    } catch (err) {
      notify("Failed to load redemptions", err instanceof Error ? err.message : undefined);
    } finally {
      setRedemptionsLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="rounded-xl border border-border bg-card p-4 gap-3">
        <Text className="font-semibold text-sm text-foreground">{editingId ? "Edit Promo Code" : "New Promo Code"}</Text>

        <View>
          <FieldLabel>Code</FieldLabel>
          <TextInput
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            placeholder="CODE"
            autoCapitalize="characters"
            placeholderTextColor={themeColors.mutedForeground}
            className={`${inputClassName} font-mono uppercase`}
          />
        </View>

        <View>
          <FieldLabel>Type</FieldLabel>
          <View className="flex-row flex-wrap gap-2">
            {PROMO_TYPES.map((t) => (
              <Chip key={t.value} label={t.label} active={type === t.value} onPress={() => setType(t.value)} />
            ))}
          </View>
        </View>

        <View className="flex-row gap-3">
          {type === "bonus_listings" && (
            <View className="flex-1">
              <FieldLabel>Bonus listings</FieldLabel>
              <TextInput
                value={bonusListings}
                onChangeText={setBonusListings}
                keyboardType="number-pad"
                placeholderTextColor={themeColors.mutedForeground}
                className={inputClassName}
              />
            </View>
          )}
          <View className="flex-1">
            <FieldLabel>Max uses</FieldLabel>
            <TextInput
              value={maxUses}
              onChangeText={setMaxUses}
              keyboardType="number-pad"
              placeholderTextColor={themeColors.mutedForeground}
              className={inputClassName}
            />
          </View>
        </View>

        <View>
          <FieldLabel>Expires (YYYY-MM-DD, optional)</FieldLabel>
          <TextInput
            value={expiresAt}
            onChangeText={setExpiresAt}
            placeholder="2026-12-31"
            placeholderTextColor={themeColors.mutedForeground}
            className={inputClassName}
          />
        </View>

        <View>
          <FieldLabel>Notes (internal, optional)</FieldLabel>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes"
            placeholderTextColor={themeColors.mutedForeground}
            className={inputClassName}
          />
        </View>

        {editingId && (
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-foreground">Active</Text>
            <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: themeColors.primary, false: undefined }} />
          </View>
        )}

        {error && <Text className="text-sm text-destructive">{error}</Text>}

        <View className="flex-row gap-3">
          <Pressable
            onPress={handleSubmit}
            disabled={submitting || !code.trim()}
            className={`flex-1 rounded-lg py-2.5 items-center ${submitting || !code.trim() ? "bg-muted" : "bg-primary"}`}
          >
            {submitting ? (
              <ActivityIndicator color={themeColors.white} />
            ) : (
              <Text className={`text-sm font-semibold ${submitting || !code.trim() ? "text-muted-foreground" : "text-white"}`}>
                {editingId ? "Save Changes" : "Create"}
              </Text>
            )}
          </Pressable>
          {editingId && (
            <Pressable onPress={resetForm} disabled={submitting} className="rounded-lg py-2.5 px-4 items-center bg-muted">
              <Text className="text-sm font-semibold text-muted-foreground">Cancel</Text>
            </Pressable>
          )}
        </View>
      </View>

      {loading ? (
        <View className="items-center py-8">
          <ActivityIndicator color={themeColors.primary} />
        </View>
      ) : codes.length === 0 ? (
        <Text className="text-sm text-muted-foreground text-center py-8">No promo codes yet.</Text>
      ) : (
        <View className="gap-2">
          {codes.map((p) => (
            <View key={p.id} className="rounded-xl border border-border bg-card p-3">
              <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-semibold font-mono text-foreground">
                    {p.code}{" "}
                    <Text className={`text-xs font-sans font-normal ${p.is_active ? "text-primary" : "text-muted-foreground"}`}>
                      {p.is_active ? "active" : "inactive"}
                    </Text>
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-1">
                    {PROMO_TYPES.find((t) => t.value === p.type)?.label}
                    {p.type === "bonus_listings" && ` · ${p.bonus_listings} slots`}
                  </Text>
                  <Pressable onPress={() => toggleRedemptions(p.id)}>
                    <Text className="text-xs text-muted-foreground mt-1 underline">
                      {p.uses}/{p.max_uses} used{p.expires_at ? ` · expires ${p.expires_at}` : ""}
                    </Text>
                  </Pressable>
                  {p.notes && <Text className="text-xs text-muted-foreground mt-1">{p.notes}</Text>}
                </View>
              </View>
              <View className="flex-row gap-4 mt-3">
                <Pressable onPress={() => startEdit(p)} disabled={busyId === p.id}>
                  <Text className="text-sm font-semibold text-primary">Edit</Text>
                </Pressable>
                <Pressable onPress={() => toggleActive(p)} disabled={busyId === p.id}>
                  <Text className="text-sm font-semibold text-primary">{p.is_active ? "Deactivate" : "Activate"}</Text>
                </Pressable>
                <Pressable onPress={() => handleDelete(p.id)} disabled={busyId === p.id}>
                  {busyId === p.id ? (
                    <ActivityIndicator size="small" color={themeColors.destructive} />
                  ) : (
                    <Text className="text-sm font-semibold text-destructive">Delete</Text>
                  )}
                </Pressable>
              </View>

              {expandedId === p.id && (
                <View className="mt-3 pt-3 border-t border-border gap-1.5">
                  <Text className="text-xs font-semibold text-muted-foreground">Redemptions</Text>
                  {redemptionsLoading ? (
                    <ActivityIndicator size="small" color={themeColors.primary} />
                  ) : redemptions.length === 0 ? (
                    <Text className="text-xs text-muted-foreground">No one has redeemed this code yet.</Text>
                  ) : (
                    redemptions.map((r) => (
                      <View key={r.id} className="flex-row items-center justify-between">
                        <Text className="text-xs text-foreground">{r.user_display_name || r.user_email || r.user_id}</Text>
                        <Text className="text-xs text-muted-foreground">{new Date(r.redeemed_at).toLocaleDateString()}</Text>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

export default function AdminPromoCodesScreen() {
  const router = useRouter();
  return (
    <AdminGate>
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
          <Pressable onPress={() => safeGoBack(router)} className="w-9 h-9 items-center justify-center -ml-2">
            <ArrowLeft size={20} color={themeColors.foreground} />
          </Pressable>
          <Text className="text-base font-semibold text-foreground">Promo Codes</Text>
        </View>
        <PromoCodesContent />
      </SafeAreaView>
    </AdminGate>
  );
}
