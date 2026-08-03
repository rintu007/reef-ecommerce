"use client";

import { useEffect, useState } from "react";
import { ListingForm } from "@/components/ListingForm";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function SellPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setSignedIn(!!data.user);
      setCheckingAuth(false);
    });
  }, []);

  if (checkingAuth) return null;

  if (!signedIn) {
    return (
      <div className="max-w-sm mx-auto p-6 mt-12 text-center">
        <p className="text-gray-700 mb-4">Sign in to create a listing.</p>
        <a href="/sign-in" className="text-blue-600 hover:underline text-sm font-semibold">
          Go to Sign In
        </a>
      </div>
    );
  }

  return <ListingForm mode="create" />;
}
