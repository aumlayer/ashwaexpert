import { Metadata } from "next";
import { siteConfig } from "@/data/content";

export const metadata: Metadata = {
  title: "Privacy Policy | Ashva Experts",
  description: "Learn how Ashva Experts collects, uses, and protects your personal information.",
  alternates: {
    canonical: "/legal/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <main className="py-16 bg-surface">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto prose prose-slate">
          <h1 className="text-h1 font-heading font-bold text-foreground">
            Privacy Policy
          </h1>
          <p className="text-body text-foreground-muted">
            Last updated: January 2024
          </p>

            <section className="mt-8">
              <h2 className="text-h3 font-heading font-bold text-foreground">
                1. Information We Collect
              </h2>
              <p className="text-body text-foreground-muted mt-4">
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-body text-foreground-muted">
                <li>Name, email address, and phone number</li>
                <li>Billing and installation address</li>
                <li>Payment information</li>
                <li>Service history and preferences</li>
                <li>Communications with our support team</li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-h3 font-heading font-bold text-foreground">
                2. How We Use Your Information
              </h2>
              <p className="text-body text-foreground-muted mt-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-body text-foreground-muted">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Send promotional communications (with your consent)</li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-h3 font-heading font-bold text-foreground">
                3. Information Sharing
              </h2>
              <p className="text-body text-foreground-muted mt-4">
                We do not sell, trade, or rent your personal information to third parties. 
                We may share your information with:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-body text-foreground-muted">
                <li>Service providers who assist in our operations</li>
                <li>Payment processors for transaction handling</li>
                <li>Law enforcement when required by law</li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-h3 font-heading font-bold text-foreground">
                4. Data Security
              </h2>
              <p className="text-body text-foreground-muted mt-4">
                We implement appropriate security measures to protect your personal information 
                against unauthorized access, alteration, disclosure, or destruction. This includes 
                encryption, secure servers, and regular security audits.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-h3 font-heading font-bold text-foreground">
                5. Your Rights
              </h2>
              <p className="text-body text-foreground-muted mt-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-body text-foreground-muted">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Data portability</li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-h3 font-heading font-bold text-foreground">
                6. Cookies
              </h2>
              <p className="text-body text-foreground-muted mt-4">
                We use cookies and similar technologies to enhance your experience, analyze 
                usage patterns, and deliver personalized content. You can control cookie 
                preferences through your browser settings.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-h3 font-heading font-bold text-foreground">
                7. Contact Us
              </h2>
              <p className="text-body text-foreground-muted mt-4">
                For privacy-related inquiries, please contact our Data Protection Officer:
              </p>
              <p className="text-body text-foreground-muted mt-2">
                Email: {siteConfig.privacyEmail}<br />
                Phone: {siteConfig.phone}
              </p>
            </section>
        </div>
      </div>
    </main>
  );
}
