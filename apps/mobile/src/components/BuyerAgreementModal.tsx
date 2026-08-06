import { Check, ShieldCheck, X } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { themeColors } from "@/lib/theme-colors";

/**
 * Shown on EVERY checkout attempt (single-item and cart) — matching legacy
 * (legacy/vite-app/src/components/payments/BuyerAgreementModal.jsx) exactly.
 * Deliberately NOT persisted anywhere (no profile field, no AsyncStorage skip)
 * — unlike the EULA/Seller Agreement gates, which do persist.
 */
export function BuyerAgreementModal({ onAgree, onClose }: { onAgree: () => void; onClose: () => void }) {
  const [checked, setChecked] = useState(false);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-card rounded-t-2xl max-h-[90%]">
          <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-border">
            <View className="flex-row items-center gap-2">
              <ShieldCheck size={18} color={themeColors.primary} />
              <Text className="font-bold text-lg text-foreground">Buyer Agreement</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color={themeColors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
            <Text className="text-sm text-muted-foreground">
              Please read and agree to the following before purchasing on Reef Market.
            </Text>

            <View>
              <Text className="font-bold text-foreground mb-1">💳 What You Pay</Text>
              <Text className="text-sm text-muted-foreground mb-2">
                As a buyer, you pay the item price + any shipping the seller has set + sales tax. No platform fees or
                processing fees are ever added to your total.
              </Text>
              <View className="bg-muted rounded-lg p-3 gap-1">
                <Text className="text-xs font-semibold text-foreground mb-1">
                  Example — buying a coral listed at $100 with $15 shipping:
                </Text>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted-foreground">Listing price</Text>
                  <Text className="text-xs text-foreground">$100.00</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted-foreground">Seller&apos;s shipping charge</Text>
                  <Text className="text-xs text-foreground">$15.00</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted-foreground">Sales tax (varies by state)</Text>
                  <Text className="text-xs text-foreground">~$8.30</Text>
                </View>
                <View className="flex-row justify-between border-t border-border pt-1 mt-1">
                  <Text className="text-xs font-bold text-foreground">You pay</Text>
                  <Text className="text-xs font-bold text-primary">~$123.30</Text>
                </View>
                <Text className="text-xs text-muted-foreground italic mt-1.5">
                  Reef Market&apos;s 5% fee and Stripe&apos;s processing fee are deducted from the seller&apos;s payout —
                  never added to your price. If a seller sets shipping to $0, you only pay item price + tax.
                </Text>
              </View>
              <Text className="text-xs text-muted-foreground mt-2">
                Some sellers offer tiered shipping pricing — the shipping cost may vary depending on how many items you
                buy. The final shipping cost is always shown clearly before you confirm payment.
              </Text>
            </View>

            <View>
              <Text className="font-bold text-foreground mb-1">🔒 Funds Are Held Securely</Text>
              <Text className="text-sm text-muted-foreground">
                Your payment is held by Reef Market and is not released to the seller until delivery or pickup is
                confirmed. This protects you as a buyer.
              </Text>
            </View>

            <View>
              <Text className="font-bold text-foreground mb-1">📦 Shipped Orders</Text>
              <Text className="text-sm text-muted-foreground">
                Once the seller ships your item and enters a tracking number, your order status updates to
                &quot;Shipped.&quot; Funds are released to the seller automatically when the tracking shows delivery.
                You can also manually confirm receipt to release funds early.
              </Text>
            </View>

            <View>
              <Text className="font-bold text-foreground mb-1">📍 Local Pickup Orders</Text>
              <Text className="text-sm text-muted-foreground mb-1">
                For local pickup, you will receive the exact pickup address and your chosen pickup time in your order
                confirmation. Funds are held until:
              </Text>
              <Text className="text-sm text-muted-foreground">
                • The seller marks the item as picked up, AND you confirm pickup via email, OR{"\n"}• 3 business days
                pass after the seller marks pickup — at which point pickup is assumed successful and funds are released
                automatically.
              </Text>
            </View>

            <View>
              <Text className="font-bold text-foreground mb-1">🐟 DOA / Arrival Policy</Text>
              <Text className="text-sm text-muted-foreground">
                Each seller sets their own Dead on Arrival (DOA) policy for live animals. Always review the
                seller&apos;s policy before purchasing. For DOA claims, photo proof of the animal still in a sealed bag
                is typically required within 2 hours of delivery.
              </Text>
            </View>

            <View>
              <Text className="font-bold text-foreground mb-1">❌ Cancellations &amp; Refunds</Text>
              <Text className="text-sm text-muted-foreground">
                All sales are final unless the seller&apos;s DOA policy provides otherwise. If you have an issue with an
                order, contact the seller directly through messaging. Reef Market may intervene in disputes at its
                discretion.
              </Text>
            </View>

            <View>
              <Text className="font-bold text-foreground mb-1">✅ Your Responsibilities</Text>
              <Text className="text-sm text-muted-foreground">
                • Be present or available at the agreed pickup time{"\n"}• Confirm receipt of shipped items promptly
                {"\n"}• Confirm or dispute pickup within 3 business days{"\n"}• Follow all applicable local laws
                regarding live animal purchase
              </Text>
            </View>
          </ScrollView>

          <View className="px-5 pt-3 pb-6 border-t border-border gap-3">
            <Pressable
              testID="buyer-agreement-checkbox"
              onPress={() => setChecked((c) => !c)}
              className="flex-row items-start gap-3"
            >
              <View
                className={`mt-0.5 w-5 h-5 rounded border shrink-0 items-center justify-center ${checked ? "bg-primary border-primary" : "border-border"}`}
              >
                {checked && <Check size={14} color={themeColors.white} />}
              </View>
              <Text className="flex-1 text-sm text-foreground">
                I have read and agree to the Reef Market Buyer Agreement, including the payment hold policy and
                pickup/delivery terms.
              </Text>
            </Pressable>

            <Pressable
              testID="buyer-agreement-continue"
              onPress={onAgree}
              disabled={!checked}
              className={`rounded-xl py-3 items-center ${checked ? "bg-primary" : "bg-muted"}`}
            >
              <Text className={`font-bold text-sm ${checked ? "text-white" : "text-muted-foreground"}`}>
                Agree &amp; Continue to Payment
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
