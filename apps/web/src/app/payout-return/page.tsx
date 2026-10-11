"use client";

import { useEffect } from "react";

const DEEP_LINK = "reefmarket://payout-return";

/**
 * Stripe's account_links return_url/refresh_url must be a real https URL —
 * it rejects a custom scheme outright ("Not a valid URL"). This page is
 * the bridge: Stripe sends the mobile user here after onboarding, and this
 * immediately hands off to the app via the reefmarket:// deep link, which
 * WebBrowser.openAuthSessionAsync (see apps/mobile/src/lib/use-payout-status.ts)
 * is watching for and closes on. Some mobile browsers block an auto-redirect
 * to a custom scheme without a tap, so there's a visible button too.
 */
export default function PayoutReturnPage() {
  useEffect(() => {
    window.location.href = DEEP_LINK;
  }, []);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🪸</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>You&apos;re all set</h1>
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Taking you back to Reef Market…</p>
        <a
          href={DEEP_LINK}
          style={{
            display: "inline-block",
            padding: "14px 28px",
            background: "#0b81b7",
            color: "#fff",
            textDecoration: "none",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          Return to the app
        </a>
      </div>
    </div>
  );
}
