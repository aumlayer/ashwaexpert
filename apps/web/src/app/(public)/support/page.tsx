import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { MessageCircle, Phone, Mail, HelpCircle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { AccordionFaq } from "@/components/support/accordion-faq";
import { WhatsAppLink } from "@/components/support/whatsapp-link";
import { api } from "@/utils/api";
import type { FAQ } from "@/types/api";
import { faqs, siteConfig, serviceAreas } from "@/data/content";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get help with your Ashva Experts water purifier subscription. FAQs, WhatsApp support, and contact options.",
  alternates: {
    canonical: "/support",
  },
};

export default async function SupportPage() {
  let allFaqs: FAQ[] = [];
  try {
    const fetched = await api.get<FAQ[]>("/faqs");
    allFaqs = Array.isArray(fetched) ? fetched : [];
  } catch {
    allFaqs = [];
  }

  const faqsForUi = allFaqs.length > 0 ? allFaqs : (faqs as unknown as FAQ[]);

  const supportFaqs = faqsForUi
    .slice()
    .sort((a, b) => a.order - b.order)
    .slice(0, 8);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: supportFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const whatsappHref = `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
    "Hi Ashva Experts, I need help with my subscription."
  )}`;

  return (
    <div>
      <Script
        id="support-faq-jsonld"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* Hero */}
      <section className="py-16 bg-surface-2">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-h1 font-heading font-bold text-foreground">
              Support
            </h1>
            <p className="mt-4 text-body-lg text-foreground-muted">
              Get quick answers, contact our team, or raise a service request from your portal.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <WhatsAppLink
                href={whatsappHref}
                source="support_hero"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-btn hover:bg-primary/90 transition-colors"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                WhatsApp Support
              </WhatsAppLink>
              <a
                href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                className="inline-flex items-center justify-center px-6 py-3 bg-surface border border-border text-foreground font-semibold rounded-btn hover:bg-surface-2 transition-colors"
              >
                <Phone className="h-5 w-5 mr-2" />
                Call Us
              </a>
              <a
                href={`mailto:${siteConfig.email}`}
                className="inline-flex items-center justify-center px-6 py-3 bg-surface border border-border text-foreground font-semibold rounded-btn hover:bg-surface-2 transition-colors"
              >
                <Mail className="h-5 w-5 mr-2" />
                Email
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="py-14 bg-surface">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <HelpCircle className="h-6 w-6 text-primary" />
                </div>
                <h2 className="mt-4 text-h4 font-heading font-bold text-foreground">
                  FAQs
                </h2>
                <p className="mt-2 text-body text-foreground-muted">
                  Most questions are answered here.
                </p>
                <a
                  href="#faqs"
                  className="mt-4 inline-flex items-center text-primary font-semibold hover:underline"
                >
                  Browse FAQs <ArrowRight className="h-4 w-4 ml-1" />
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-accent" />
                </div>
                <h2 className="mt-4 text-h4 font-heading font-bold text-foreground">
                  Raise a Service Request
                </h2>
                <p className="mt-2 text-body text-foreground-muted">
                  For maintenance, repairs, taste issues, and more.
                </p>
                <Link
                  href="/app/service"
                  className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-primary text-white font-semibold rounded-btn hover:bg-primary/90 transition-colors"
                >
                  Go to Portal
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-success" />
                </div>
                <h2 className="mt-4 text-h4 font-heading font-bold text-foreground">
                  Talk to an Expert
                </h2>
                <p className="mt-2 text-body text-foreground-muted">
                  Need plan help or installation support? We’ll help.
                </p>
                <div className="mt-4 flex gap-3">
                  <WhatsAppLink
                    href={whatsappHref}
                    source="support_talk_to_expert"
                    className="inline-flex items-center justify-center px-4 py-2 border border-primary text-primary font-semibold rounded-btn hover:bg-primary/5 transition-colors"
                  >
                    WhatsApp
                  </WhatsAppLink>
                  <a
                    href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                    className="inline-flex items-center justify-center px-4 py-2 border border-border text-foreground font-semibold rounded-btn hover:bg-surface-2 transition-colors"
                  >
                    Call
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faqs" className="py-16 bg-surface-2">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h2 className="text-h2 font-heading font-bold text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-body text-foreground-muted">
              Quick answers about plans, installation, maintenance, billing, and service.
            </p>
          </div>

          <AccordionFaq faqs={faqsForUi} />

          <div className="mt-12 text-center">
            <Link
              href="/plans"
              className="inline-flex items-center justify-center px-6 py-3 border border-primary text-primary font-semibold rounded-btn hover:bg-primary/5 transition-colors"
            >
              View Plans
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Service areas */}
      <section className="py-16 bg-surface">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h2 className="text-h2 font-heading font-bold text-foreground">
              Service Coverage
            </h2>
            <p className="mt-3 text-body text-foreground-muted">
              We’re expanding fast. Check availability for your pincode to confirm coverage.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {serviceAreas.slice(0, 8).map((area) => (
              <Card key={area.city}>
                <CardContent className="pt-6">
                  <p className="text-body font-semibold text-foreground">{area.city}</p>
                  <p className="text-small text-foreground-muted">{area.state}</p>
                  <p className="mt-2 text-small text-foreground-muted">
                    {area.pincodes}+ pincodes
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/check-availability"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white font-semibold rounded-btn hover:bg-primary/90 transition-colors"
            >
              Check Availability
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
