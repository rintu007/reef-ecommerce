import { useState } from "react";
import { base44 } from "@/api/base44Client";

const EULA_KEY = "reef_eula_v1_accepted";

export function hasAcceptedEULA() {
  return !!localStorage.getItem(EULA_KEY);
}

export function markEULAAccepted() {
  localStorage.setItem(EULA_KEY, "1");
}

export default function EULAModal({ onAccept }) {
  const [checked, setChecked] = useState(false);

  const handleAccept = async () => {
    if (!checked) return;
    markEULAAccepted();
    // Also save to user profile so it persists across devices
    base44.auth.updateMe({ eula_accepted: true }).catch(() => {});
    onAccept();
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl p-4 flex flex-col gap-3 overflow-hidden" style={{maxHeight: '85dvh'}}>
        <div className="text-center">
          <span className="text-2xl">🪸</span>
          <h2 className="text-lg font-bold mt-1 text-gray-900 dark:text-white">Welcome to Reef Market</h2>
          <p className="text-xs text-gray-500 mt-0.5">Please review and accept our terms before continuing</p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-xs text-gray-600 dark:text-gray-300 space-y-3 leading-relaxed">
          <p className="font-semibold text-gray-800 dark:text-white text-sm">Community Standards & Terms of Use</p>

          <p><strong>Zero Tolerance for Objectionable Content.</strong> Reef Market has a strict zero-tolerance policy for objectionable content of any kind. This includes but is not limited to: hate speech, harassment, abusive behavior, illegal content, scams, fraud, or any content that violates applicable laws or community standards.</p>

          <p><strong>User Responsibilities.</strong> By using Reef Market, you agree to only post accurate, honest listings for aquarium animals and equipment. You agree not to harass, threaten, or abuse other users in any way.</p>

          <p><strong>Content Moderation.</strong> All listings and messages are subject to review. Reef Market reserves the right to remove any content and suspend or permanently ban any user at any time, without notice, for violating these terms.</p>

          <p><strong>Reporting.</strong> Users are encouraged to report objectionable content or abusive users using the in-app reporting tools. Reports are reviewed within 24 hours and appropriate action will be taken, including content removal and user ejection.</p>

          <p><strong>Blocking.</strong> You may block any user at any time. Blocked users will not appear in your feed. Reef Market will be notified of all block actions for review.</p>

          <p><strong>Transactions.</strong> All sales are between buyers and sellers. Reef Market facilitates payments but is not responsible for the condition of items or live animal survival. Review each seller's DOA policy carefully.</p>

          <p><strong>Privacy.</strong> Your information is used only to facilitate transactions and improve the platform. We do not sell your data to third parties.</p>

          <p>By tapping "I Agree", you confirm you have read and agree to these terms and our Community Standards. Violations may result in immediate removal from the platform.</p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded accent-cyan-600 shrink-0"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            I have read and agree to the Community Standards and Terms of Use. I understand there is zero tolerance for objectionable content or abusive behavior.
          </span>
        </label>

        <button
          onClick={handleAccept}
          disabled={!checked}
          className="w-full bg-cyan-600 disabled:opacity-40 hover:bg-cyan-700 text-white font-bold rounded-xl py-3 text-sm transition-colors shrink-0"
        >
          I Agree — Enter Reef Market
        </button>
      </div>
    </div>
  );
}