import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { themeColors } from "@/lib/theme-colors";

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View className="mb-5">
      <Text className="font-bold text-base text-foreground mb-1">{title}</Text>
      <Text className="text-sm text-muted-foreground leading-5">{children}</Text>
    </View>
  );
}

export default function TermsScreen() {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-1 -ml-1">
          <ArrowLeft size={20} color={themeColors.foreground} />
        </Pressable>
        <Text className="font-bold text-base text-foreground">Terms of Service</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-xs text-muted-foreground mb-5">Last updated: April 2026</Text>

        <Section title="1. Acceptance of Terms">
          By accessing or using Reef Market, you agree to be bound by these Terms of Service. If you do not agree, please do not use the
          platform.
        </Section>
        <Section title="2. Eligibility">
          You must be at least 18 years old to create an account and conduct transactions on Reef Market. By registering, you represent
          that you meet this requirement.
        </Section>
        <Section title="3. Listings and Sales">
          Sellers are responsible for ensuring their listings are accurate, legal, and comply with applicable local, state, and federal
          laws — including those governing the sale of live animals and aquatic species. Reef Market reserves the right to remove any
          listing at its discretion.
        </Section>
        <Section title="4. Fees & Shipping Pricing">
          {
            "Reef Market charges a 5% platform fee on completed sales, applied to the full transaction amount (item price + shipping). Stripe's standard processing fee (2.9% + $0.30) also applies. Both fees are deducted from the seller's payout — not added to the buyer's price. Sellers may set shipping as a flat rate, tiered by quantity, or included in the price ($0 shipping), and may set a minimum order quantity or amount. Fee structures are disclosed at listing time and checkout. Reef Market reserves the right to update fees with notice."
          }
        </Section>
        <Section title="5. Payments">
          All payments are processed securely through Stripe. By completing a purchase, you agree to Stripe&apos;s Terms of Service. Reef
          Market does not store payment card information.
        </Section>
        <Section title="6. Prohibited Conduct">
          You agree not to use Reef Market for fraudulent transactions, harassment, or the sale of illegal items. Accounts found in
          violation may be suspended or permanently banned.
        </Section>
        <Section title="7. Disputes">
          Reef Market provides tools to help resolve disputes between buyers and sellers, but is not liable for the outcome of individual
          transactions. Users are encouraged to communicate directly to resolve issues.
        </Section>
        <Section title="8. Disclaimer of Warranties">
          Reef Market is provided &quot;as is&quot; without warranties of any kind. We do not guarantee the accuracy of listings or the
          reliability of sellers. Use of the platform is at your own risk.
        </Section>
        <Section title="9. Limitation of Liability">
          Reef Market shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform,
          including loss of livestock or equipment.
        </Section>
        <Section title="10. Changes to Terms">
          We may update these Terms at any time. Continued use of Reef Market after changes are posted constitutes acceptance of the
          updated Terms.
        </Section>
        <Section title="11. Contact">
          Questions about these Terms? Contact us at Andrew@freedomrisingnow.org.
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
