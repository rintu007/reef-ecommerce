"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(apiClient, email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="max-w-sm mx-auto p-6 mt-12 text-center">
        <h1 className="text-xl font-bold mb-3">Check your email</h1>
        <p className="text-sm text-gray-600 mb-6">
          If an account exists for <span className="font-medium">{email}</span>, we&apos;ve sent a link to reset your password.
        </p>
        <Link href="/sign-in" className="text-sm text-blue-600 hover:underline">
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto p-6 mt-12">
      <h1 className="text-2xl font-bold mb-2">Reset your password</h1>
      <p className="text-sm text-gray-500 mb-6">Enter your email and we&apos;ll send you a reset link.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 text-white text-sm font-semibold py-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <Link href="/sign-in" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
        Back to Sign In
      </Link>
    </div>
  );
}
