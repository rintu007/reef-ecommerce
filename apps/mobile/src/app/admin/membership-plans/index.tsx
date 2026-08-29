import { listAdminMembershipPlans, updateMembershipPlan, type MembershipPlan } from "@reef-market/shared";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminGate } from "@/components/AdminGate";
import { apiClient } from "@/lib/api-client";
import { notify } from "@/lib/alert";
import { themeColors } from "@/lib/theme-colors";
import { safeGoBack } from "@/lib/navigation";

const inputClassName = "border border-border bg-card rounded-xl px-3 py-2.5 text-sm text-foreground";

function FieldLabel({ children }: { children: string }) {
  return <Text className="text-sm font-medium text-muted-foreground mb-1">{children}</Text>;
}

interface FormState {
  name: string;
  price_monthly: string;
  max_active_listings: string;
  description: string;
  features: string;
  is_active: boolean;
}

function toForm(plan: MembershipPlan): FormState {
  return {
    name: plan.name,
    price_monthly: String(plan.price_monthly),
    max_active_listings: String(plan.max_active_listings),
    description: plan.description ?? "",
    features: plan.features.join("\n"),
    is_active: plan.is_active,
  };
}

function AdminMembershipPlansContent() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { plans } = await listAdminMembershipPlans(apiClient);
      setPlans(plans);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  function startEdit(plan: MembershipPlan) {
    setEditingId(plan.id);
    setForm(toForm(plan));
    setError(null);
  }

  async function save() {
    if (!editingId || !form) return;
    setSaving(true);
    setError(null);
    try {
      await updateMembershipPlan(apiClient, editingId, {
        name: form.name,
        price_monthly: Number(form.price_monthly) || 0,
        max_active_listings: Number(form.max_active_listings),
        description: form.description || null,
        features: form.features
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean),
        is_active: form.is_active,
      });
      setEditingId(null);
      setForm(null);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save plan";
      setError(message);
      notify("Error", message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={themeColors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      {plans.map((plan) =>
        editingId === plan.id && form ? (
          <View key={plan.id} className="rounded-xl border border-border bg-card p-4 gap-3">
            <View>
              <FieldLabel>Name</FieldLabel>
              <TextInput value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} className={inputClassName} placeholderTextColor={themeColors.mutedForeground} />
            </View>
            <View>
              <FieldLabel>Price / month</FieldLabel>
              <TextInput
                value={form.price_monthly}
                onChangeText={(t) => setForm({ ...form, price_monthly: t })}
                keyboardType="decimal-pad"
                className={inputClassName}
                placeholderTextColor={themeColors.mutedForeground}
              />
            </View>
            <View>
              <FieldLabel>Max active listings (-1 = unlimited)</FieldLabel>
              <TextInput
                value={form.max_active_listings}
                onChangeText={(t) => setForm({ ...form, max_active_listings: t })}
                keyboardType="number-pad"
                className={inputClassName}
                placeholderTextColor={themeColors.mutedForeground}
              />
            </View>
            <View>
              <FieldLabel>Description</FieldLabel>
              <TextInput
                value={form.description}
                onChangeText={(t) => setForm({ ...form, description: t })}
                multiline
                numberOfLines={2}
                className={inputClassName}
                style={{ minHeight: 60 }}
                placeholderTextColor={themeColors.mutedForeground}
              />
            </View>
            <View>
              <FieldLabel>Features (one per line)</FieldLabel>
              <TextInput
                value={form.features}
                onChangeText={(t) => setForm({ ...form, features: t })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className={inputClassName}
                style={{ minHeight: 90 }}
                placeholderTextColor={themeColors.mutedForeground}
              />
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-foreground flex-1 pr-3">Active (offered to new subscribers)</Text>
              <Switch value={form.is_active} onValueChange={(v) => setForm({ ...form, is_active: v })} trackColor={{ true: themeColors.primary, false: undefined }} />
            </View>
            {error && <Text className="text-sm text-destructive">{error}</Text>}
            <View className="flex-row gap-3">
              <Pressable onPress={save} disabled={saving} className="flex-1 rounded-xl py-2.5 items-center bg-primary">
                {saving ? <ActivityIndicator color={themeColors.white} /> : <Text className="text-sm font-semibold text-white">Save</Text>}
              </Pressable>
              <Pressable onPress={() => setEditingId(null)} disabled={saving} className="rounded-xl py-2.5 px-4 items-center bg-muted">
                <Text className="text-sm font-semibold text-muted-foreground">Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View key={plan.id} className="rounded-xl border border-border bg-card p-4">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="font-semibold text-sm text-foreground">
                  {plan.name} <Text className="text-xs font-mono text-muted-foreground">({plan.slug})</Text>{" "}
                  <Text className={`text-xs font-normal ${plan.is_active ? "text-primary" : "text-muted-foreground"}`}>
                    {plan.is_active ? "active" : "inactive"}
                  </Text>
                </Text>
                <Text className="text-sm text-muted-foreground mt-1">
                  ${plan.price_monthly.toFixed(2)}/mo · {plan.max_active_listings === -1 ? "unlimited listings" : `${plan.max_active_listings} listings`}
                </Text>
                {plan.description && <Text className="text-sm text-muted-foreground mt-1">{plan.description}</Text>}
                {plan.features.map((f) => (
                  <Text key={f} className="text-xs text-muted-foreground mt-0.5">
                    • {f}
                  </Text>
                ))}
              </View>
              <Pressable onPress={() => startEdit(plan)}>
                <Text className="text-sm font-semibold text-primary">Edit</Text>
              </Pressable>
            </View>
          </View>
        )
      )}
    </ScrollView>
  );
}

export default function AdminMembershipPlansScreen() {
  const router = useRouter();
  return (
    <AdminGate>
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
          <Pressable onPress={() => safeGoBack(router)} className="w-9 h-9 items-center justify-center -ml-2">
            <ArrowLeft size={20} color={themeColors.foreground} />
          </Pressable>
          <Text className="text-base font-semibold text-foreground">Membership Plans</Text>
        </View>
        <AdminMembershipPlansContent />
      </SafeAreaView>
    </AdminGate>
  );
}
