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

export default function PrivacyScreen() {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-1 -ml-1">
          <ArrowLeft size={20} color={themeColors.foreground} />
        </Pressable>
        <Text className="font-bold text-base text-foreground">Privacy Policy</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-xs text-muted-foreground mb-5">Last updated: April 2026</Text>

        <Section title="1. Information We Collect">
          When you use Reef Market, we collect information you provide directly, such as your name, email address, shipping address, and
          payment details when you create an account or complete a transaction. We also collect information about your listings, orders,
          and messages sent through the platform.
        </Section>
        <Section title="2. How We Use Your Information">
          We use your information to facilitate transactions between buyers and sellers, send order and shipping notifications, provide
          customer support, and improve our platform. We do not sell your personal information to third parties.
        </Section>
        <Section title="3. Payments">
          Payment processing is handled securely by Stripe. Reef Market does not store your full credit card number or bank account
          details. Stripe&apos;s privacy policy governs the handling of payment data.
        </Section>
        <Section title="4. Sharing of Information">
          To complete a transaction, certain information (such as your name and shipping address) is shared with the other party. We may
          also share data with service providers (e.g., shipping carriers, payment processors) solely to operate the platform.
        </Section>
        <Section title="5. Data Retention">
          We retain your account information and transaction history as long as your account is active. You may request deletion of your
          account at any time through the Profile page.
        </Section>
        <Section title="6. Cookies & Analytics">
          Reef Market may use cookies and similar technologies to maintain your session and analyze usage patterns to improve the app. No
          personally identifiable information is shared with analytics providers.
        </Section>
        <Section title="7. Children's Privacy">
          Reef Market is not intended for users under the age of 13. We do not knowingly collect personal information from children.
        </Section>
        <Section title="8. Contact Us">
          {
            "If you have questions about this Privacy Policy, please contact us at Andrew@freedomrisingnow.org or by mail at: Andrew Sveum, 3405 River Park Dr., Anderson, IN."
          }
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
