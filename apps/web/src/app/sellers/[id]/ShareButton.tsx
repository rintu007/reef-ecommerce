"use client";

import { useState } from "react";

export function ShareButton({ sellerName }: { sellerName: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `${sellerName} on Reef Market`, url }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button onClick={handleShare} className="mt-2 text-sm font-semibold text-blue-600 hover:underline">
      {copied ? "Link copied!" : "Share"}
    </button>
  );
}
