"use client";

import { useEffect, useState, type ReactNode } from "react";
import { agreeSellerTerms, getOwnProfile, getPayoutStatus } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";
import { SellerAgreementModal } from "./SellerAgreementModal";
import { PayoutSetupPrompt } from "./PayoutSetupPrompt";

const SELLER_AGREEMENT_KEY = "reef_seller_agreed_v1";

/** Gates the Sell/Edit-listing flow behind the Seller Agreement (legacy: `Sell.jsx`'s `agreedToSell` check), then offers Stripe payout setup once, matching legacy's `PayoutSetupPrompt` flow. */
export function SellerAgreementGate({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [showPayoutPrompt, setShowPayoutPrompt] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== "undefined" && window.localStorage.getItem(SELLER_AGREEMENT_KEY)) {
        setAgreed(true);
        setChecking(false);
        return;
      }
      getOwnProfile(apiClient)
        .then(({ profile }) => {
          if (profile.seller_agreed) {
            window.localStorage.setItem(SELLER_AGREEMENT_KEY, "true");
            setAgreed(true);
          }
        })
        .catch(() => {})
        .finally(() => setChecking(false));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function handleAgree() {
    window.localStorage.setItem(SELLER_AGREEMENT_KEY, "true");
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
    return <SellerAgreementModal onAgree={handleAgree} onClose={() => window.history.back()} />;
  }

  if (showPayoutPrompt) {
    return <PayoutSetupPrompt onSkip={() => setShowPayoutPrompt(false)} />;
  }

  return <>{children}</>;
}
