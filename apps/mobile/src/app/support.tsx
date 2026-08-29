import { submitSupportMessage, type SupportMessageInput } from "@reef-market/shared";
import { router } from "expo-router";
import { ArrowLeft, ChevronDown, ChevronUp, Mail, Phone } from "lucide-react-native";
import { useState } from "react";
import { Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";
import { safeGoBack } from "@/lib/navigation";

/**
 * Legacy parity: reef-trade-flow's Support/HelpFeedback pages. Didn't exist
 * on mobile at all before — only the web app had a (contact-info-only,
 * pre-this-change) Support page.
 */
const FAQS = [
  {
    q: "How do I buy an item on Reef Market?",
    a: "Browse or search for listings, tap one you like, then choose your shipping method and tap 'Buy Now'. You'll pay securely via Stripe and receive a confirmation immediately.",
  },
  {
    q: "How do I list something for sale?",
    a: "Tap the 'Sell' tab in the app, fill in your item details, set a price, upload photos, and submit. Your listing will be live instantly.",
  },
  {
    q: "When do I get paid as a seller?",
    a: "Payouts are released after the buyer confirms delivery or after 5 days post-shipment. Funds are sent to your connected Stripe payout account.",
  },
  {
    q: "What is the DOA (Dead on Arrival) policy?",
    a: "Each seller sets their own DOA policy, which is shown on the listing. If your item arrives dead or damaged, contact the seller within 2 hours of delivery with a photo.",
  },
  {
    q: "What fees does Reef Market charge?",
    a: "Sellers are charged a 5% Reef Market platform fee plus Stripe's standard 2.9% + $0.30 processing fee, deducted from the sale price.",
  },
  {
    q: "How do I track my shipment?",
    a: "Once the seller adds a tracking number, you'll see it in your Orders tab.",
  },
  {
    q: "Can I cancel an order?",
    a: "Contact the seller directly through the messaging feature as soon as possible. Cancellations are handled case-by-case between buyer and seller.",
  },
  {
    q: "How do I report a problem with a seller or listing?",
    a: "On any listing page, use the Report option. For urgent issues, contact us directly via email below.",
  },
];

function FaqItem({ q, a, isLast }: { q: string; a: string; isLast?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <View className={`py-3 ${isLast ? "" : "border-b border-border"}`}>
      <Pressable onPress={() => setOpen((v) => !v)} className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-sm font-medium text-foreground">{q}</Text>
        {open ? (
          <ChevronUp size={16} color={themeColors.mutedForeground} />
        ) : (
          <ChevronDown size={16} color={themeColors.mutedForeground} />
        )}
      </Pressable>
      {open && <Text className="text-sm text-muted-foreground mt-2 leading-5">{a}</Text>}
    </View>
  );
}

function ContactForm() {
  const [form, setForm] = useState<SupportMessageInput>({ name: "", email: "", type: "question", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!form.name || !form.email || !form.message) return;
    setLoading(true);
    setError(null);
    try {
      await submitSupportMessage(apiClient, form);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send your message. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <View className="rounded-xl border border-border bg-card p-4 items-center gap-2">
        <Text className="text-2xl">✅</Text>
        <Text className="font-semibold text-sm text-foreground">Message Sent!</Text>
        <Text className="text-sm text-muted-foreground text-center">We&apos;ll get back to you at {form.email} soon.</Text>
        <Pressable onPress={() => { setSubmitted(false); setForm({ name: "", email: "", type: "question", message: "" }); }}>
          <Text className="text-sm text-primary font-semibold mt-1">Send another message</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="rounded-xl border border-border bg-card p-4 gap-3">
      <Text className="font-semibold text-sm text-foreground">Send Us a Message</Text>
      <TextInput
        value={form.name}
        onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
        placeholder="Your Name"
        placeholderTextColor={themeColors.mutedForeground}
        className="border border-border bg-background rounded-xl px-3 py-2.5 text-sm text-foreground"
      />
      <TextInput
        value={form.email}
        onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
        placeholder="Email Address"
        placeholderTextColor={themeColors.mutedForeground}
        autoCapitalize="none"
        keyboardType="email-address"
        className="border border-border bg-background rounded-xl px-3 py-2.5 text-sm text-foreground"
      />
      <View className="flex-row flex-wrap gap-2">
        {(["question", "feedback", "bug", "other"] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setForm((f) => ({ ...f, type: t }))}
            className={`px-3 py-1.5 rounded-full ${form.type === t ? "bg-primary" : "bg-muted"}`}
          >
            <Text className={`text-xs font-semibold capitalize ${form.type === t ? "text-white" : "text-muted-foreground"}`}>{t}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={form.message}
        onChangeText={(v) => setForm((f) => ({ ...f, message: v }))}
        placeholder="Describe your question or feedback…"
        placeholderTextColor={themeColors.mutedForeground}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        className="border border-border bg-background rounded-xl px-3 py-2.5 text-sm text-foreground"
        style={{ minHeight: 90 }}
      />
      {error && <Text className="text-sm text-destructive">{error}</Text>}
      <Pressable
        onPress={handleSubmit}
        disabled={loading || !form.name || !form.email || !form.message}
        className="rounded-xl py-3 items-center bg-primary disabled:opacity-50"
      >
        <Text className="font-semibold text-sm text-white">{loading ? "Sending…" : "Send Message"}</Text>
      </Pressable>
    </View>
  );
}

export default function SupportScreen() {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <Pressable onPress={() => safeGoBack(router)} className="p-1 -ml-1">
          <ArrowLeft size={20} color={themeColors.foreground} />
        </Pressable>
        <Text className="font-bold text-base text-foreground">Support</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View className="rounded-xl border border-border bg-card overflow-hidden">
          <Pressable onPress={() => Linking.openURL("mailto:Andrew@freedomrisingnow.org")} className="flex-row items-center gap-3 p-3 border-b border-border">
            <Mail size={16} color={themeColors.primary} />
            <View>
              <Text className="text-xs text-muted-foreground">Email</Text>
              <Text className="text-sm font-medium text-primary">Andrew@freedomrisingnow.org</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => Linking.openURL("tel:7656107434")} className="flex-row items-center gap-3 p-3">
            <Phone size={16} color={themeColors.primary} />
            <View>
              <Text className="text-xs text-muted-foreground">Phone</Text>
              <Text className="text-sm font-medium text-primary">765-610-7434</Text>
            </View>
          </Pressable>
        </View>

        <ContactForm />

        <View className="rounded-xl border border-border bg-card p-4">
          <Text className="font-semibold text-sm text-foreground mb-1">Frequently Asked Questions</Text>
          {FAQS.map((item, i) => (
            <FaqItem key={item.q} q={item.q} a={item.a} isLast={i === FAQS.length - 1} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
