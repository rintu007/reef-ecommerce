import { blockUser, createReport } from "@reef-market/shared";
import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from "react-native";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";

const REPORT_REASONS = [
  "Misleading or inaccurate listing",
  "Suspected scam or fraud",
  "Inappropriate or offensive content",
  "Sick or misrepresented animal",
  "Spam or duplicate listing",
  "Other",
];

type Panel = "menu" | "report" | "block" | "done";

export function ReportBlockSheet({
  visible,
  onClose,
  listingId,
  listingTitle,
  sellerId,
}: {
  visible: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  sellerId: string;
}) {
  const [panel, setPanel] = useState<Panel>("menu");
  const [blockReason, setBlockReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function handleClose() {
    setPanel("menu");
    setBlockReason("");
    setMessage(null);
    onClose();
  }

  async function submitReport(reason: string) {
    setBusy(true);
    try {
      await createReport(apiClient, {
        report_type: "listing",
        listing_id: listingId,
        reported_id: sellerId,
        reason,
        details: `Listing: ${listingTitle}`,
      });
      setMessage("Report submitted. Thanks for letting us know.");
      setPanel("done");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setBusy(false);
    }
  }

  async function submitBlock() {
    setBusy(true);
    try {
      await blockUser(apiClient, { blocked_id: sellerId, reason: blockReason || undefined });
      setMessage("Seller blocked. Their listings are now hidden from Browse.");
      setPanel("done");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to block seller");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable className="flex-1 bg-black/40" onPress={handleClose}>
        <Pressable className="mt-auto bg-card rounded-t-2xl p-4 gap-1" onPress={(e) => e.stopPropagation()}>
          {panel === "menu" && (
            <>
              <Pressable testID="report-listing-option" onPress={() => setPanel("report")} className="py-3">
                <Text className="text-base font-semibold text-foreground">Report Listing</Text>
              </Pressable>
              <Pressable testID="block-seller-option" onPress={() => setPanel("block")} className="py-3">
                <Text className="text-base font-semibold text-foreground">Block Seller</Text>
              </Pressable>
              <Pressable onPress={handleClose} className="py-3">
                <Text className="text-sm text-muted-foreground">Cancel</Text>
              </Pressable>
            </>
          )}

          {panel === "report" && (
            <>
              <Text className="text-sm font-semibold text-muted-foreground pb-2">Why are you reporting this listing?</Text>
              {REPORT_REASONS.map((reason) => (
                <Pressable key={reason} disabled={busy} onPress={() => submitReport(reason)} className="py-2.5">
                  <Text className="text-base text-foreground">{reason}</Text>
                </Pressable>
              ))}
              <Pressable onPress={() => setPanel("menu")} className="py-2">
                <Text className="text-sm text-muted-foreground">Back</Text>
              </Pressable>
            </>
          )}

          {panel === "block" && (
            <View className="gap-3 py-2">
              <Text className="text-sm text-muted-foreground">Block this seller? You won&apos;t see their listings in Browse anymore.</Text>
              <TextInput
                value={blockReason}
                onChangeText={setBlockReason}
                placeholder="Reason (optional)"
                placeholderTextColor={themeColors.mutedForeground}
                multiline
                numberOfLines={2}
                className="border border-border bg-background rounded-xl px-3 py-2.5 text-sm text-foreground"
              />
              <View className="flex-row gap-3">
                <Pressable
                  testID="confirm-block-seller"
                  onPress={submitBlock}
                  disabled={busy}
                  className="flex-1 bg-destructive rounded-xl py-3 items-center"
                >
                  {busy ? <ActivityIndicator color={themeColors.white} /> : <Text className="text-white font-semibold text-sm">Block Seller</Text>}
                </Pressable>
                <Pressable onPress={() => setPanel("menu")} className="px-4 justify-center">
                  <Text className="text-sm text-muted-foreground">Back</Text>
                </Pressable>
              </View>
            </View>
          )}

          {panel === "done" && (
            <View className="gap-3 py-2">
              <Text className="text-sm text-foreground">{message}</Text>
              <Pressable onPress={handleClose} className="py-2">
                <Text className="text-sm font-semibold text-primary">Close</Text>
              </Pressable>
            </View>
          )}

          {message && panel !== "done" && <Text className="text-xs text-destructive pt-1">{message}</Text>}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
