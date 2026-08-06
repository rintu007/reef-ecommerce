import { useState } from "react";
import { Modal, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { themeColors } from "@/lib/theme-colors";

function FeeRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View className={`flex-row justify-between items-center py-1.5 ${highlight ? "border-t border-border mt-1 pt-2" : ""}`}>
      <Text className={highlight ? "font-bold text-foreground" : "text-sm text-muted-foreground"}>{label}</Text>
      <Text className={highlight ? "font-bold text-base text-emerald-600" : "text-sm text-foreground"}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-1.5">
      <Text className="font-bold text-foreground">{title}</Text>
      {children}
    </View>
  );
}

export function SellerAgreementModal({ onAgree, onClose }: { onAgree: () => void; onClose: () => void }) {
  const [checked, setChecked] = useState(false);

  return (
    <Modal visible animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-5 pt-3 pb-3 border-b border-border">
          <Text className="font-bold text-lg text-foreground">🛡️ Seller Agreement</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={20} color={themeColors.mutedForeground} />
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5 py-4" contentContainerClassName="gap-5">
          <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 gap-2">
            <Text className="font-bold text-amber-800">💲 What You&apos;ll Be Charged Per Sale</Text>
            <Text className="text-xs text-amber-700">
              All fees are deducted from your payout. Reef Market&apos;s 5% platform fee and Stripe&apos;s processing
              fee apply to the full amount the buyer pays (item price + any shipping you charge). Example with a $100
              item and $15 shipping:
            </Text>
            <View className="bg-white rounded-lg p-3 border border-amber-200">
              <FeeRow label="Buyer pays (item + shipping + tax)" value="~$123.30" />
              <FeeRow label="Your item price" value="$100.00" />
              <FeeRow label="Your shipping charge" value="$15.00" />
              <FeeRow label="Platform fee (5% of $115)" value="− $5.75" />
              <FeeRow label="Stripe processing fee (2.9% + $0.30)" value="− $3.64" />
              <FeeRow label="You receive" value="~$105.61" highlight />
            </View>
          </View>

          <Section title="💳 When You Get Paid">
            <Text className="text-sm text-muted-foreground">
              Payments are held by Stripe until the transaction is complete. Funds are released when: shipped orders —
              carrier confirms delivery, or buyer confirms receipt; local pickup — buyer confirms pickup in the app, or
              automatically after 3 business days with no dispute.
            </Text>
            <View className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <Text className="text-xs text-blue-800">
                ⚡ Stripe setup required: after agreeing, you&apos;ll connect a Stripe payout account (~2 min).
              </Text>
            </View>
          </Section>

          <Section title="🚚 Shipping Options — You're in Control">
            <Text className="text-sm text-muted-foreground">
              Set a flat shipping rate or tiered pricing by quantity, plus a minimum order quantity/amount. Package
              items safely — especially live animals — and enter tracking after shipment. Honor your stated DOA /
              arrival policy.
            </Text>
          </Section>

          <Section title="✅ Your Responsibilities">
            <Text className="text-sm text-muted-foreground">
              Post accurate descriptions and real photos, ship or arrange pickup promptly, comply with all laws on the
              sale/transport of live animals, and honor your stated pickup windows.
            </Text>
          </Section>

          <Section title="⚠️ Prohibited Items">
            <Text className="text-sm text-muted-foreground">
              Illegal species, stolen goods, endangered/protected animals, and misrepresented items are strictly
              prohibited and will result in immediate account suspension.
            </Text>
          </Section>
        </ScrollView>

        <View className="px-5 pt-3 pb-4 border-t border-border gap-3">
          <Pressable className="flex-row items-start gap-3" onPress={() => setChecked((v) => !v)}>
            <Switch value={checked} onValueChange={setChecked} />
            <Text className="flex-1 text-sm text-foreground">
              I understand that Reef Market&apos;s 5% fee and Stripe&apos;s processing fee are deducted from my payout.
              Fees apply to the full item + shipping total. I am responsible for shipping costs and agree to all terms
              above.
            </Text>
          </Pressable>
          <Pressable
            disabled={!checked}
            onPress={onAgree}
            className={`h-12 rounded-xl items-center justify-center ${checked ? "bg-primary" : "bg-primary/40"}`}
          >
            <Text className="text-white font-bold">I Agree — Continue to Payout Setup</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
