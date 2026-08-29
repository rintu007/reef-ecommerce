export default function TermsOfService() {
  return (
    <div className="px-4 py-6 pb-10 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-1">Terms of Service</h1>
      <p className="text-muted-foreground text-xs mb-6">Last updated: April 2026</p>

      <div className="space-y-6 text-sm text-foreground leading-relaxed">
        <section>
          <h2 className="font-bold text-base mb-2">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground">
            By accessing or using Reef Market, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">2. Eligibility</h2>
          <p className="text-muted-foreground">
            You must be at least 18 years old to create an account and conduct transactions on Reef Market. By registering, you represent that you meet this requirement.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">3. Listings and Sales</h2>
          <p className="text-muted-foreground">
            Sellers are responsible for ensuring their listings are accurate, legal, and comply with applicable local, state, and federal laws — including those governing the sale of live animals and aquatic species. Reef Market reserves the right to remove any listing at its discretion.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">4. Fees & Shipping Pricing</h2>
          <p className="text-muted-foreground mb-2">
            Reef Market charges a <strong>5% platform fee</strong> on completed sales, applied to the full transaction amount (item price + shipping). Stripe's standard processing fee (2.9% + $0.30) also applies. Both fees are deducted from the seller's payout — not added to the buyer's price.
          </p>
          <p className="text-muted-foreground mb-2">
            Sellers may set their own shipping rates in one of the following ways:
          </p>
          <ul className="text-muted-foreground list-disc list-inside space-y-1 text-sm">
            <li><strong>Flat rate:</strong> A single shipping cost applied to any order regardless of quantity.</li>
            <li><strong>Tiered by quantity:</strong> Different shipping prices for different quantity ranges (e.g. 1–2 items: $15, 3–5 items: $20). The buyer is shown the applicable tier at checkout.</li>
            <li><strong>Included in price ($0 shipping):</strong> Seller absorbs the cost and prices the item accordingly.</li>
          </ul>
          <p className="text-muted-foreground mt-2">
            Sellers may also set a <strong>minimum order quantity</strong> or <strong>minimum order amount</strong>. These requirements are displayed on the listing and enforced at checkout. Fee structures are disclosed at the time of listing and checkout. Reef Market reserves the right to update fees with notice.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">5. Payments</h2>
          <p className="text-muted-foreground">
            All payments are processed securely through Stripe. By completing a purchase, you agree to Stripe's Terms of Service. Reef Market does not store payment card information.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">6. Prohibited Conduct</h2>
          <p className="text-muted-foreground">
            You agree not to use Reef Market for fraudulent transactions, harassment, or the sale of illegal items. Accounts found in violation may be suspended or permanently banned.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">7. Disputes</h2>
          <p className="text-muted-foreground">
            Reef Market provides tools to help resolve disputes between buyers and sellers, but is not liable for the outcome of individual transactions. Users are encouraged to communicate directly to resolve issues.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">8. Disclaimer of Warranties</h2>
          <p className="text-muted-foreground">
            Reef Market is provided "as is" without warranties of any kind. We do not guarantee the accuracy of listings or the reliability of sellers. Use of the platform is at your own risk.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">9. Limitation of Liability</h2>
          <p className="text-muted-foreground">
            Reef Market shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform, including loss of livestock or equipment.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">10. Changes to Terms</h2>
          <p className="text-muted-foreground">
            We may update these Terms at any time. Continued use of Reef Market after changes are posted constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">11. Contact</h2>
          <p className="text-muted-foreground">
            Questions about these Terms? Contact us at{" "}
            <a href="mailto:Andrew@freedomrisingnow.org" className="text-primary underline-offset-2 hover:underline">
              Andrew@freedomrisingnow.org
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}