"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const supabase = createSupabaseBrowserClient();

    (async () => {
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
      }
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError("Sign-in failed. Please try again.");
        return;
      }
      router.push("/browse");
      router.refresh();
    })();
  }, [router, searchParams]);

  return (
    <div className="max-w-sm mx-auto p-6 mt-12 text-center">
      {error ? (
        <>
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <a href="/sign-in" className="text-sm text-blue-600 hover:underline">
            Back to Sign In
          </a>
        </>
      ) : (
        <p className="text-sm text-gray-500">Signing you in…</p>
      )}
    </div>
  );
}
