import AsyncStorage from "@react-native-async-storage/async-storage";
import { agreeSellerTerms, getOwnProfile, getPayoutStatus } from "@reef-market/shared";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "expo-router";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { SellerAgreementModal } from "./SellerAgreementModal";
import { PayoutSetupPrompt } from "./PayoutSetupPrompt";

const SELLER_AGREEMENT_KEY = "reef_seller_agreed_v1";

/** Gates the create/edit-listing screens behind the Seller Agreement, then offers Stripe payout setup once — mirrors legacy's `Sell.jsx` flow. */
export function SellerAgreementGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { session } = useAuth();
  const [checking, setChecking] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [showPayoutPrompt, setShowPayoutPrompt] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(SELLER_AGREEMENT_KEY).then((stored) => {
      if (cancelled) return;
      if (stored) {
        setAgreed(true);
        setChecking(false);
        return;
      }
      if (!session) {
        setChecking(false);
        return;
      }
      getOwnProfile(apiClient)
        .then(({ profile }) => {
          if (cancelled) return;
          if (profile.seller_agreed) {
            AsyncStorage.setItem(SELLER_AGREEMENT_KEY, "true");
            setAgreed(true);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setChecking(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  async function handleAgree() {
    await AsyncStorage.setItem(SELLER_AGREEMENT_KEY, "true");
    setAgreed(true);
    agreeSellerTerms(apiClient).catch(() => {});
    try {
      const status = await getPayoutStatus(apiClient);
      if (!status.payoutsEnabled) setShowPayoutPrompt(true);
    } catch {
      // best-effort — don't block listing creation if this check fails
    }
  }

  if (checking) return null;

  if (!agreed) {
    return <SellerAgreementModal onAgree={handleAgree} onClose={() => router.back()} />;
  }

  if (showPayoutPrompt) {
    return (
      <PayoutSetupPrompt onContinue={() => setShowPayoutPrompt(false)} onSkip={() => setShowPayoutPrompt(false)} />
    );
  }

  return <>{children}</>;
}
