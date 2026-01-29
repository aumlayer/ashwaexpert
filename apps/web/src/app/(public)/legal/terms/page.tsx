import { Metadata } from "next";
import { siteConfig } from "@/data/content";

export const metadata: Metadata = {
  title: "Terms of Service | Ashva Experts",
  description: "Terms and conditions for using Ashva Experts water purifier subscription services.",
  alternates: {
    canonical: "/legal/terms",
  },
};

export default function TermsPage() {
  return (
    <main className="py-16 bg-surface">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto prose prose-slate">
          <h1 className="text-h1 font-heading font-bold text-foreground">
            Terms of Service
          </h1>
          <p className="text-body text-foreground-muted">
            Last updated: January 2024
          </p>

            <section className="mt-8">
              <h2 className="text-h3 font-heading font-bold text-foreground">
                1. Acceptance of Terms
              </h2>
              <p className="text-body text-foreground-muted mt-4">
                By accessing and using Ashva Experts services, you accept and agree to be bound by 
                the terms and provision of this agreement. If you do not agree to abide by these 
                terms, please do not use our services.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-h3 font-heading font-bold text-foreground">
                2. Subscription Services
              </h2>
              <p className="text-body text-foreground-muted mt-4">
                Ashva Experts provides water purifier subscription services including:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-body text-foreground-muted">
                <li>Installation of water purification equipment</li>
                <li>Regular maintenance and filter replacement</li>
                <li>Repair and replacement services</li>
                <li>Customer support</li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-h3 font-heading font-bold text-foreground">
                3. Payment Terms
              </h2>
              <p className="text-body text-foreground-muted mt-4">
                Subscription fees are billed monthly in advance. Payment is due on the billing 
                date specified in your subscription agreement. We accept various payment methods 
                including UPI, credit/debit cards, and net banking.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-h3 font-heading font-bold text-foreground">
                4. Equipment Ownership
              </h2>
              <p className="text-body text-foreground-muted mt-4">
                The water purification equipment remains the property of Ashva Experts throughout 
                the subscription period. Customers are responsible for the care and safekeeping 
                of the equipment during the subscription term.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-h3 font-heading font-bold text-foreground">
                5. Service Level Agreement
              </h2>
              <p className="text-body text-foreground-muted mt-4">
                We commit to responding to service requests within 4 hours and resolving issues 
                within 24 hours for standard maintenance. Emergency issues are addressed on the 
                same day.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-h3 font-heading font-bold text-foreground">
                6. Cancellation Policy
              </h2>
              <p className="text-body text-foreground-muted mt-4">
                Subscriptions can be cancelled with 30 days notice. Early termination within the 
                lock-in period may incur charges as specified in your subscription agreement. 
                See our <a href="/legal/cancellation" className="text-primary hover:underline">
                Cancellation Policy</a> for details.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-h3 font-heading font-bold text-foreground">
                7. Limitation of Liability
              </h2>
              <p className="text-body text-foreground-muted mt-4">
                Ashva Experts shall not be liable for any indirect, incidental, special, 
                consequential, or punitive damages resulting from your use of our services.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-h3 font-heading font-bold text-foreground">
                8. Contact Information
              </h2>
              <p className="text-body text-foreground-muted mt-4">
                For questions about these Terms of Service, please contact us at:
              </p>
              <p className="text-body text-foreground-muted mt-2">
                Email: {siteConfig.legalEmail}<br />
                Phone: {siteConfig.phone}
              </p>
            </section>
        </div>
      </div>
    </main>
  );
}
