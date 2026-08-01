export default function PrivacyPolicy() {
  return (
    <div className="px-4 py-6 pb-10 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-1">Privacy Policy</h1>
      <p className="text-muted-foreground text-xs mb-6">Last updated: April 2026</p>

      <div className="space-y-6 text-sm text-foreground leading-relaxed">
        <section>
          <h2 className="font-bold text-base mb-2">1. Information We Collect</h2>
          <p className="text-muted-foreground">
            When you use Reef Market, we collect information you provide directly, such as your name, email address, shipping address, and payment details when you create an account or complete a transaction. We also collect information about your listings, orders, and messages sent through the platform.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">2. How We Use Your Information</h2>
          <p className="text-muted-foreground">
            We use your information to facilitate transactions between buyers and sellers, send order and shipping notifications, provide customer support, and improve our platform. We do not sell your personal information to third parties.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">3. Payments</h2>
          <p className="text-muted-foreground">
            Payment processing is handled securely by Stripe. Reef Market does not store your full credit card number or bank account details. Stripe's privacy policy governs the handling of payment data.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">4. Sharing of Information</h2>
          <p className="text-muted-foreground">
            To complete a transaction, certain information (such as your name and shipping address) is shared with the other party. We may also share data with service providers (e.g., shipping carriers, payment processors) solely to operate the platform.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">5. Data Retention</h2>
          <p className="text-muted-foreground">
            We retain your account information and transaction history as long as your account is active. You may request deletion of your account at any time through the Profile page.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">6. Cookies & Analytics</h2>
          <p className="text-muted-foreground">
            Reef Market may use cookies and similar technologies to maintain your session and analyze usage patterns to improve the app. No personally identifiable information is shared with analytics providers.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">7. Children's Privacy</h2>
          <p className="text-muted-foreground">
            Reef Market is not intended for users under the age of 13. We do not knowingly collect personal information from children.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">8. Contact Us</h2>
          <p className="text-muted-foreground">
            If you have questions about this Privacy Policy, please contact us at{" "}
            <a href="mailto:Andrew@freedomrisingnow.org" className="text-primary underline-offset-2 hover:underline">
              Andrew@freedomrisingnow.org
            </a>{" "}
            or by mail at: Andrew Sveum, 3405 River Park Dr., Anderson, IN.
          </p>
        </section>
      </div>
    </div>
  );
}