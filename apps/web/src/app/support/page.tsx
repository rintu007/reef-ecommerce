"use client";

import { useState } from "react";
import { submitSupportMessage, ApiError, type SupportMessageInput } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

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

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button className="w-full flex items-center justify-between gap-3 py-4 text-left" onClick={() => setOpen((v) => !v)}>
        <span className="font-medium text-sm text-gray-800">{q}</span>
        <span className="text-gray-400 shrink-0">{open ? "−" : "+"}</span>
      </button>
      {open && <p className="text-sm text-gray-600 pb-4 leading-relaxed">{a}</p>}
    </div>
  );
}

/** Legacy parity: reef-trade-flow's Support page "Send Us a Message" contact form — this had been dropped, leaving only FAQ + static contact info. */
function ContactForm() {
  const [form, setForm] = useState<SupportMessageInput>({ name: "", email: "", type: "question", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setLoading(true);
    setError(null);
    try {
      await submitSupportMessage(apiClient, form);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send your message. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-8 text-center space-y-3">
        <p className="text-3xl">✅</p>
        <p className="font-semibold text-gray-900">Message Sent!</p>
        <p className="text-sm text-gray-500">We&apos;ll get back to you at {form.email} as soon as possible.</p>
        <button
          onClick={() => {
            setSubmitted(false);
            setForm({ name: "", email: "", type: "question", message: "" });
          }}
          className="text-blue-700 text-sm hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Send Us a Message</h2>
      </div>
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Your Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Jane Smith"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Email Address *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="you@email.com"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as SupportMessageInput["type"] }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          >
            <option value="question">Question</option>
            <option value="feedback">Feedback</option>
            <option value="bug">Report a Bug</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Message *</label>
          <textarea
            required
            rows={4}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            placeholder="Describe your question or feedback…"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || !form.name || !form.email || !form.message}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl py-2.5 text-sm"
        >
          {loading ? "Sending…" : "Send Message"}
        </button>
      </form>
    </div>
  );
}

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Reef Market Support</h1>
          <p className="text-gray-500 text-sm mt-1">Questions, issues, or feedback? We&apos;re here to help.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Contact Us</h2>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="px-5 py-4">
              <p className="text-xs text-gray-500 mb-0.5">Email</p>
              <a href="mailto:Andrew@freedomrisingnow.org" className="text-sm font-medium text-blue-700 hover:underline">
                Andrew@freedomrisingnow.org
              </a>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-gray-500 mb-0.5">Phone</p>
              <a href="tel:7656107434" className="text-sm font-medium text-blue-700 hover:underline">
                765-610-7434
              </a>
            </div>
          </div>
        </div>

        <ContactForm />

        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 space-y-2">
          <p className="font-semibold text-sm text-blue-900">Tips for faster support</p>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Include your order number for transaction issues</li>
            <li>Attach photos for DOA or damage claims</li>
            <li>Include the email address on your account for account issues</li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="px-5">
            {FAQS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">© {new Date().getFullYear()} Reef Market. All rights reserved.</p>
      </div>
    </div>
  );
}
