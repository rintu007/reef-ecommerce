import { Mail, Phone, MapPin, MessageSquare, HelpCircle, Fish, ShieldCheck, Package, ChevronDown, ChevronUp, Send, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useState } from "react";

const faqs = [
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
    a: "Each seller sets their own DOA policy, which is shown on the listing. If your item arrives dead or damaged, contact the seller within 2 hours of delivery with a photo. Open a claim through your order page.",
  },
  {
    q: "What fees does Reef Market charge?",
    a: "Sellers are charged a 5% Reef Market platform fee plus Stripe's standard 2.9% + $0.30 processing fee, deducted from the sale price. Buyers pay applicable sales tax on top of the listing price.",
  },
  {
    q: "How do I track my shipment?",
    a: "Once the seller adds a tracking number, you'll see it in your Orders tab. You can also tap the tracking number to follow your package on the carrier's website.",
  },
  {
    q: "Can I cancel an order?",
    a: "Contact the seller directly through the messaging feature as soon as possible. Cancellations are handled case-by-case between buyer and seller.",
  },
  {
    q: "How do I report a problem with a seller or listing?",
    a: "On any listing page, scroll to the bottom and tap 'Report Listing'. For urgent issues, contact us directly via email or phone below.",
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        className="w-full flex items-center justify-between gap-3 py-4 text-left"
        onClick={() => setOpen(v => !v)}
      >
        <span className="font-medium text-sm text-gray-800">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && <p className="text-sm text-gray-600 pb-4 leading-relaxed">{a}</p>}
    </div>
  );
}

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", type: "question", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setLoading(true);
    await base44.integrations.Core.SendEmail({
      to: "Andrew@freedomrisingnow.org",
      subject: `[Reef Market Support] ${form.type === "feedback" ? "Feedback" : "Question"} from ${form.name}`,
      body: `Name: ${form.name}\nEmail: ${form.email}\nType: ${form.type}\n\nMessage:\n${form.message}`,
    });
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-8 text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
        <p className="font-semibold text-gray-900">Message Sent!</p>
        <p className="text-sm text-gray-500">We'll get back to you at {form.email} as soon as possible.</p>
        <button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", type: "question", message: "" }); }} className="text-cyan-700 text-sm hover:underline">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Send className="w-4 h-4 text-cyan-600" /> Send Us a Message
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Your Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Jane Smith"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Email Address *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="you@email.com"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
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
            onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
            placeholder="Describe your question or feedback..."
          />
        </div>
        <button
          type="submit"
          disabled={loading || !form.name || !form.email || !form.message}
          className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
          {loading ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
}

export default function Support() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-1">
            <Fish className="w-7 h-7 text-cyan-600" />
            <h1 className="text-2xl font-bold text-gray-900">Reef Market Support</h1>
          </div>
          <p className="text-gray-500 text-sm">
            Questions, issues, or feedback? We're here to help.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Contact cards */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-600" /> Contact Us
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-full bg-cyan-50 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-cyan-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Email (fastest response)</p>
                <a href="mailto:Andrew@freedomrisingnow.org" className="text-sm font-medium text-cyan-700 hover:underline">
                  Andrew@freedomrisingnow.org
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-full bg-cyan-50 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-cyan-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                <a href="tel:7656107434" className="text-sm font-medium text-cyan-700 hover:underline">
                  765-610-7434
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-full bg-cyan-50 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-cyan-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Mailing Address</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Andrew Sveum · 3405 River Park Dr, Anderson, IN
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <ContactForm />

        {/* Tips */}
        <div className="bg-cyan-50 border border-cyan-100 rounded-2xl px-5 py-4 space-y-2">
          <p className="font-semibold text-sm text-cyan-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Tips for faster support
          </p>
          <ul className="text-sm text-cyan-800 space-y-1 list-disc list-inside">
            <li>Include your order number for transaction issues</li>
            <li>Attach photos for DOA or damage claims</li>
            <li>Include the email address on your account for account issues</li>
          </ul>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-600" /> Frequently Asked Questions
            </h2>
          </div>
          <div className="px-5">
            {faqs.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
          </div>
        </div>

        {/* App info */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-start gap-4">
          <div className="w-9 h-9 rounded-full bg-cyan-50 flex items-center justify-center shrink-0 mt-0.5">
            <Package className="w-4 h-4 text-cyan-600" />
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">About Reef Market</p>
            <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">
              Reef Market is the dedicated buy-and-sell marketplace for saltwater and freshwater aquarium hobbyists —
              corals, fish, and equipment. Available on iOS and Android.
            </p>
            <a
              href="https://reef-trade-flow.base44.app"
              className="text-cyan-700 text-sm hover:underline mt-1 inline-block"
            >
              reef-trade-flow.base44.app
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">
          © {new Date().getFullYear()} Reef Market. All rights reserved.
        </p>
      </div>
    </div>
  );
}