import { acceptEula, getOwnProfile } from "@reef-market/shared";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Check } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { apiClient } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";
import { themeColors } from "@/lib/theme-colors";

const EULA_KEY = "reef_eula_v1_accepted";

/**
 * Legacy parity: legacy/vite-app/src/components/moderation/EULAModal.jsx,
 * rendered unconditionally from AppShell.jsx and blocking the entire app
 * until accepted — no decline/close option, no guest bypass. Trigger order
 * mirrors legacy: AsyncStorage first (fast path, no flash for returning
 * users), then — for signed-in users only — the profile's eula_accepted
 * flag (synced across devices). Guests without a session rely on
 * AsyncStorage alone, same as legacy's `base44.auth.updateMe(...).catch(() => {})`
 * pattern (fire-and-forget, never blocks the UI). Uses a full-screen RN
 * Modal rather than the Alert-style helpers in lib/alert.ts since this is a
 * blocking view with rich content, not a dismissible alert.
 */
export function EULAGate() {
  const [checked, setChecked] = useState(false);
  // null = still determining (avoid flashing the modal for returning users)
  const [accepted, setAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const stored = await AsyncStorage.getItem(EULA_KEY);
      if (stored) {
        if (!cancelled) setAccepted(true);
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const { profile } = await getOwnProfile(apiClient);
          if (profile.eula_accepted) {
            await AsyncStorage.setItem(EULA_KEY, "1");
            if (!cancelled) setAccepted(true);
            return;
          }
        }
      } catch {
        // Profile fetch failed — fall through to showing the gate.
      }

      if (!cancelled) setAccepted(false);
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleAccept() {
    if (!checked) return;
    AsyncStorage.setItem(EULA_KEY, "1");
    setAccepted(true);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data.session) acceptEula(apiClient).catch(() => {});
      })
      .catch(() => {});
  }

  if (accepted !== false) return null;

  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent>
      <View className="flex-1 bg-black/70 items-center justify-center p-4">
        <View className="bg-card w-full max-w-md rounded-2xl p-4 gap-3" style={{ maxHeight: "85%" }}>
          <View className="items-center">
            <Text className="text-2xl">🪸</Text>
            <Text className="text-lg font-bold mt-1 text-foreground text-center">Welcome to Reef Market</Text>
            <Text className="text-xs text-muted-foreground mt-0.5 text-center">
              Please review and accept our terms before continuing
            </Text>
          </View>

          <ScrollView className="bg-muted rounded-xl p-3" style={{ maxHeight: 320 }}>
            <Text className="font-semibold text-foreground text-sm mb-2">Community Standards & Terms of Use</Text>

            <Text className="text-xs text-muted-foreground leading-relaxed mb-2">
              <Text className="font-bold">Zero Tolerance for Objectionable Content.</Text> Reef Market has a strict
              zero-tolerance policy for objectionable content of any kind. This includes but is not limited to: hate
              speech, harassment, abusive behavior, illegal content, scams, fraud, or any content that violates
              applicable laws or community standards.
            </Text>

            <Text className="text-xs text-muted-foreground leading-relaxed mb-2">
              <Text className="font-bold">User Responsibilities.</Text> By using Reef Market, you agree to only post
              accurate, honest listings for aquarium animals and equipment. You agree not to harass, threaten, or
              abuse other users in any way.
            </Text>

            <Text className="text-xs text-muted-foreground leading-relaxed mb-2">
              <Text className="font-bold">Content Moderation.</Text> All listings and messages are subject to
              review. Reef Market reserves the right to remove any content and suspend or permanently ban any user
              at any time, without notice, for violating these terms.
            </Text>

            <Text className="text-xs text-muted-foreground leading-relaxed mb-2">
              <Text className="font-bold">Reporting.</Text> Users are encouraged to report objectionable content or
              abusive users using the in-app reporting tools. Reports are reviewed within 24 hours and appropriate
              action will be taken, including content removal and user ejection.
            </Text>

            <Text className="text-xs text-muted-foreground leading-relaxed mb-2">
              <Text className="font-bold">Blocking.</Text> You may block any user at any time. Blocked users will
              not appear in your feed. Reef Market will be notified of all block actions for review.
            </Text>

            <Text className="text-xs text-muted-foreground leading-relaxed mb-2">
              <Text className="font-bold">Transactions.</Text> All sales are between buyers and sellers. Reef
              Market facilitates payments but is not responsible for the condition of items or live animal survival.
              Review each seller&apos;s DOA policy carefully.
            </Text>

            <Text className="text-xs text-muted-foreground leading-relaxed mb-2">
              <Text className="font-bold">Privacy.</Text> Your information is used only to facilitate transactions
              and improve the platform. We do not sell your data to third parties.
            </Text>

            <Text className="text-xs text-muted-foreground leading-relaxed">
              By tapping &quot;I Agree&quot;, you confirm you have read and agree to these terms and our Community
              Standards. Violations may result in immediate removal from the platform.
            </Text>
          </ScrollView>

          <Pressable className="flex-row items-start gap-3" onPress={() => setChecked((c) => !c)}>
            <View
              className="mt-0.5 w-5 h-5 rounded border items-center justify-center shrink-0"
              style={{
                borderColor: themeColors.primary,
                backgroundColor: checked ? themeColors.primary : "transparent",
              }}
            >
              {checked && <Check size={14} color={themeColors.white} />}
            </View>
            <Text className="text-sm text-foreground flex-1">
              I have read and agree to the Community Standards and Terms of Use. I understand there is zero
              tolerance for objectionable content or abusive behavior.
            </Text>
          </Pressable>

          <Pressable
            onPress={handleAccept}
            disabled={!checked}
            className="w-full rounded-xl py-3 items-center shrink-0"
            style={{ backgroundColor: checked ? themeColors.primary : themeColors.border }}
          >
            <Text className="font-bold text-sm" style={{ color: checked ? themeColors.white : themeColors.mutedForeground }}>
              I Agree — Enter Reef Market
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
