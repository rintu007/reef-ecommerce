import { Mail, Phone, MapPin, MessageSquare } from "lucide-react";

export default function HelpFeedback() {
  return (
    <div className="px-4 py-6 pb-10 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-1">Help & Feedback</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Have a problem, question, or feedback? Reach out to us directly.
      </p>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Email</p>
            <a
              href="mailto:Andrew@freedomrisingnow.org"
              className="text-primary text-sm underline-offset-2 hover:underline"
            >
              Andrew@freedomrisingnow.org
            </a>
          </div>
        </div>

        <div className="border-t border-border" />

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Phone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Phone</p>
            <a href="tel:7656107434" className="text-primary text-sm underline-offset-2 hover:underline">
              765-610-7434
            </a>
          </div>
        </div>

        <div className="border-t border-border" />

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Mailing Address</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Andrew Sveum<br />
              3405 River Park Dr.<br />
              Anderson, IN
            </p>
          </div>
        </div>
      </div>

      <div className="bg-muted rounded-2xl p-5 mt-5">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          <p className="font-semibold text-sm">Tips for faster support</p>
        </div>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Include your order number if reporting a transaction issue</li>
          <li>Attach photos when reporting a DOA or damage claim</li>
          <li>For account issues, include the email address on your account</li>
        </ul>
      </div>
    </div>
  );
}