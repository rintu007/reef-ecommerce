import { redeemPromoCode } from "@reef-market/shared";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";

export function PromoCodeSection() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleSubmit() {
    if (!code.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const { granted } = await redeemPromoCode(apiClient, code);
      setMessage({ type: "ok", text: granted });
      setCode("");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to redeem code" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="rounded-xl border border-border bg-card p-4">
      <Text className="font-semibold text-sm text-foreground">Redeem Promo Code</Text>
      <View className="flex-row gap-2 mt-3">
        <TextInput
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          placeholder="PROMOCODE"
          autoCapitalize="characters"
          placeholderTextColor={themeColors.mutedForeground}
          className="flex-1 border border-border bg-background rounded-lg px-3 py-2.5 text-sm text-foreground"
        />
        <Pressable onPress={handleSubmit} disabled={busy} className="bg-foreground rounded-lg px-4 items-center justify-center">
          {busy ? <ActivityIndicator color={themeColors.white} /> : <Text className="text-sm font-semibold text-white">Apply</Text>}
        </Pressable>
      </View>
      {message && <Text className={`text-sm mt-2 ${message.type === "ok" ? "text-emerald-600" : "text-destructive"}`}>{message.text}</Text>}
    </View>
  );
}
