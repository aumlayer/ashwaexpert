import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui";
import { AlertCircle, CheckCircle2, Clock, Phone } from "lucide-react";
import { siteConfig } from "@/data/content";

export const metadata: Metadata = {
  title: "Cancellation Policy | Ashva Experts",
  description: "Understand our subscription cancellation policy, refund terms, and equipment return process.",
  alternates: {
    canonical: "/legal/cancellation",
  },
};

export default function CancellationPage() {
  return (
    <main className="py-16 bg-surface">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-h1 font-heading font-bold text-foreground">
            Cancellation Policy
          </h1>
          <p className="text-body text-foreground-muted mt-2">
            Last updated: January 2024
          </p>

            {/* Quick Summary */}
            <Card className="mt-8 bg-primary/5 border-primary/20">
              <CardContent className="py-6">
                <h2 className="text-h4 font-heading font-bold text-foreground flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Quick Summary
                </h2>
                <ul className="mt-4 space-y-3">
                  <li className="flex items-start gap-2 text-body text-foreground-muted">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    30 days notice required for cancellation
                  </li>
                  <li className="flex items-start gap-2 text-body text-foreground-muted">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    No cancellation fee after lock-in period
                  </li>
                  <li className="flex items-start gap-2 text-body text-foreground-muted">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    Equipment pickup scheduled within 7 days
                  </li>
                  <li className="flex items-start gap-2 text-body text-foreground-muted">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    Security deposit refunded within 15 days
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Detailed Policy */}
            <section className="mt-8">
              <h2 className="text-h3 font-heading font-bold text-foreground">
                1. Cancellation Process
              </h2>
              <p className="text-body text-foreground-muted mt-4">
                To cancel your subscription, you can:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-body text-foreground-muted">
                <li>Submit a cancellation request through your customer portal</li>
                <li>Call our support team at {siteConfig.phone}</li>
                <li>Email us at {siteConfig.supportEmail}</li>
              </ul>
              <p className="text-body text-foreground-muted mt-4">
                Cancellation requests must be submitted at least 30 days before your next 
                billing date to avoid being charged for the following month.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-h3 font-heading font-bold text-foreground">
                2. Lock-in Period
              </h2>
              <p className="text-body text-foreground-muted mt-4">
                Some plans have a minimum commitment period (lock-in). If you cancel during 
                this period, the following charges may apply:
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 text-body font-semibold text-foreground">Cancellation Time</th>
                      <th className="text-left py-3 text-body font-semibold text-foreground">Charge</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="py-3 text-body text-foreground-muted">Within 3 months</td>
                      <td className="py-3 text-body text-foreground-muted">₹2,000</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 text-body text-foreground-muted">3-6 months</td>
                      <td className="py-3 text-body text-foreground-muted">₹1,000</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 text-body text-foreground-muted">After 6 months</td>
                      <td className="py-3 text-body text-foreground-muted">No charge</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-h3 font-heading font-bold text-foreground">
                3. Equipment Return
              </h2>
              <p className="text-body text-foreground-muted mt-4">
                Upon cancellation, our technician will visit to uninstall and collect the 
                equipment within 7 working days. Please ensure:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-body text-foreground-muted">
                <li>The equipment is in working condition</li>
                <li>All accessories are available for return</li>
                <li>Someone is available at the premises during pickup</li>
              </ul>
              <p className="text-body text-foreground-muted mt-4">
                Damage to equipment beyond normal wear and tear may result in deductions 
                from your security deposit.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-h3 font-heading font-bold text-foreground">
                4. Refunds
              </h2>
              <p className="text-body text-foreground-muted mt-4">
                <strong>Security Deposit:</strong> Refunded within 15 working days after 
                equipment pickup, minus any applicable deductions.
              </p>
              <p className="text-body text-foreground-muted mt-4">
                <strong>Prepaid Subscriptions:</strong> Unused months will be refunded on a 
                pro-rata basis, minus any early termination charges.
              </p>
              <p className="text-body text-foreground-muted mt-4">
                Refunds are processed to the original payment method or via bank transfer.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-h3 font-heading font-bold text-foreground">
                5. Pause Instead of Cancel
              </h2>
              <p className="text-body text-foreground-muted mt-4">
                If you're temporarily relocating or need a break, consider pausing your 
                subscription instead of cancelling. Paused subscriptions:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-body text-foreground-muted">
                <li>Can be paused for up to 3 months</li>
                <li>No monthly charges during pause</li>
                <li>Equipment remains installed</li>
                <li>Resume anytime with no setup fee</li>
              </ul>
            </section>

            {/* Contact */}
            <Card className="mt-8">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-h4 font-heading font-bold text-foreground">
                      Need Help with Cancellation?
                    </h3>
                    <p className="text-body text-foreground-muted mt-1">
                      Our team is here to assist you. We may also be able to offer alternatives 
                      that better suit your needs.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-4">
                      <Link
                        href="/support"
                        className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white font-semibold rounded-btn hover:bg-primary/90 transition-colors text-small"
                      >
                        Contact Support
                      </Link>
                      <a
                        href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                        className="inline-flex items-center justify-center px-4 py-2 border border-border text-foreground font-semibold rounded-btn hover:bg-surface-2 transition-colors text-small"
                      >
                        Call {siteConfig.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>
      </div>
    </main>
  );
}
