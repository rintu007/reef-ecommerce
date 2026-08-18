"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    (async () => {
      // Our own link (see api/auth/forgot-password) carries `token_hash` as
      // a query param and is exchanged for a session explicitly — this
      // doesn't touch the Auth "Site URL"/redirect-URL config at all, unlike
      // Supabase's own hash-fragment redirect flow below.
      if (tokenHash && type === "recovery") {
        const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
        if (verifyError) {
          setError("This reset link is invalid or has expired. Request a new one.");
          return;
        }
        setReady(true);
        return;
      }

      // Fallback: a legacy link that established a session via URL hash
      // (detectSessionInUrl) before this page even mounted.
      const { data } = await supabase.auth.getSession();
      setReady(!!data.session);
      if (!data.session) setError("This reset link is invalid or has expired. Request a new one.");
    })();
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      setTimeout(() => router.push("/browse"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-sm mx-auto p-6 mt-12 text-center">
        <h1 className="text-xl font-bold mb-2">Password updated</h1>
        <p className="text-sm text-gray-600">Redirecting you now…</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto p-6 mt-12">
      <h1 className="text-2xl font-bold mb-6">Set a new password</h1>

      {ready ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 text-white text-sm font-semibold py-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Saving…" : "Update password"}
          </button>
        </form>
      ) : (
        error && <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

/**
 * useSearchParams() opts this page into client-side rendering during static
 * generation, which App Router requires to be behind a Suspense boundary
 * (see apps/web/src/app/auth/callback/page.tsx for the same pattern).
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="max-w-sm mx-auto p-6 mt-12 text-center text-sm text-gray-500">Loading…</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
