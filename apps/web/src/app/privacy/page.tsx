export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1">Privacy Policy</h1>
      <p className="text-gray-500 text-xs mb-6">Last updated: April 2026</p>

      <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
        <section>
          <h2 className="font-bold text-base text-gray-900 mb-2">1. Information We Collect</h2>
          <p>
            When you use Reef Market, we collect information you provide directly, such as your name, email address, shipping address,
            and payment details when you create an account or complete a transaction. We also collect information about your listings,
            orders, and messages sent through the platform.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base text-gray-900 mb-2">2. How We Use Your Information</h2>
          <p>We use your information to facilitate transactions between buyers and sellers, send order and shipping notifications, provide customer support, and improve our platform. We do not sell your personal information to third parties.</p>
        </section>

        <section>
          <h2 className="font-bold text-base text-gray-900 mb-2">3. Payments</h2>
          <p>Payment processing is handled securely by Stripe. Reef Market does not store your full credit card number or bank account details. Stripe&apos;s privacy policy governs the handling of payment data.</p>
        </section>

        <section>
          <h2 className="font-bold text-base text-gray-900 mb-2">4. Sharing of Information</h2>
          <p>To complete a transaction, certain information (such as your name and shipping address) is shared with the other party. We may also share data with service providers (e.g., shipping carriers, payment processors) solely to operate the platform.</p>
        </section>

        <section>
          <h2 className="font-bold text-base text-gray-900 mb-2">5. Data Retention</h2>
          <p>We retain your account information and transaction history as long as your account is active. You may request deletion of your account at any time through the Profile page.</p>
        </section>

        <section>
          <h2 className="font-bold text-base text-gray-900 mb-2">6. Cookies &amp; Analytics</h2>
          <p>Reef Market may use cookies and similar technologies to maintain your session and analyze usage patterns to improve the app. No personally identifiable information is shared with analytics providers.</p>
        </section>

        <section>
          <h2 className="font-bold text-base text-gray-900 mb-2">7. Children&apos;s Privacy</h2>
          <p>Reef Market is not intended for users under the age of 13. We do not knowingly collect personal information from children.</p>
        </section>

        <section>
          <h2 className="font-bold text-base text-gray-900 mb-2">8. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at{" "}
            <a href="mailto:Andrew@freedomrisingnow.org" className="text-blue-600 hover:underline">
              Andrew@freedomrisingnow.org
            </a>{" "}
            or by mail at: Andrew Sveum, 3405 River Park Dr., Anderson, IN.
          </p>
        </section>
      </div>
    </div>
  );
}
