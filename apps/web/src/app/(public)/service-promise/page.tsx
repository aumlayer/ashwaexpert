"use client";

import Link from "next/link";
import {
  Shield,
  Clock,
  Wrench,
  RefreshCw,
  Phone,
  CheckCircle2,
  ArrowRight,
  Calendar,
  Users,
  Award,
} from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";

const slaItems = [
  {
    category: "Installation",
    items: [
      { metric: "Installation Time", value: "Within 48 hours", note: "After order confirmation" },
      { metric: "Installation Duration", value: "45-60 minutes", note: "Standard installation" },
      { metric: "Demo & Training", value: "Included", note: "Usage and maintenance tips" },
    ],
  },
  {
    category: "Maintenance",
    items: [
      { metric: "Preventive Visits", value: "Every 3 months", note: "Scheduled automatically" },
      { metric: "Filter Replacement", value: "As needed", note: "Included in subscription" },
      { metric: "Water Quality Check", value: "Every visit", note: "TDS and quality testing" },
    ],
  },
  {
    category: "Support",
    items: [
      { metric: "Response Time", value: "Within 4 hours", note: "For service requests" },
      { metric: "Resolution Time", value: "Within 24 hours", note: "For standard issues" },
      { metric: "Emergency Support", value: "Same day", note: "For critical issues" },
    ],
  },
];

const ticketJourney = [
  { step: 1, title: "Raise Request", desc: "Via app, call, or WhatsApp", icon: Phone },
  { step: 2, title: "Confirmation", desc: "Instant acknowledgment with ticket ID", icon: CheckCircle2 },
  { step: 3, title: "Assignment", desc: "Technician assigned within 4 hours", icon: Users },
  { step: 4, title: "Visit Scheduled", desc: "You choose the time slot", icon: Calendar },
  { step: 5, title: "Resolution", desc: "Issue fixed, quality verified", icon: Wrench },
  { step: 6, title: "Feedback", desc: "Rate your experience", icon: Award },
];

const guarantees = [
  {
    icon: RefreshCw,
    title: "Free Replacement",
    desc: "If we can't fix it, we replace it at no extra cost",
  },
  {
    icon: Shield,
    title: "No Hidden Charges",
    desc: "All maintenance, filters, and repairs included in your subscription",
  },
  {
    icon: Clock,
    title: "SLA Guarantee",
    desc: "Miss our SLA? Get service credit on your next bill",
  },
  {
    icon: Wrench,
    title: "Certified Technicians",
    desc: "All our technicians are trained and background verified",
  },
];

export default function ServicePromisePage() {
  return (
    <main>
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-primary via-accent to-mint">
        <div className="container-custom text-center text-white">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-6">
            <Shield className="h-10 w-10" />
          </div>
          <h1 className="text-h1 font-heading font-bold">
            Our Service Promise
          </h1>
          <p className="mt-4 text-body-lg text-white/90 max-w-2xl mx-auto">
            We don't just install purifiers. We ensure you always have access to pure, 
            healthy water with industry-leading service commitments.
          </p>
        </div>
      </section>

        {/* SLA Tables */}
        <section className="py-16 bg-surface">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-h2 font-heading font-bold text-foreground">
                Service Level Agreements
              </h2>
              <p className="mt-4 text-body text-foreground-muted max-w-xl mx-auto">
                Clear commitments you can count on
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {slaItems.map((category) => (
                <Card key={category.category}>
                  <CardContent className="pt-6">
                    <h3 className="text-h4 font-heading font-bold text-foreground mb-6 text-center">
                      {category.category}
                    </h3>
                    <div className="space-y-4">
                      {category.items.map((item) => (
                        <div key={item.metric} className="p-4 bg-surface-2 rounded-card">
                          <p className="text-small text-foreground-muted">{item.metric}</p>
                          <p className="text-h4 font-heading font-bold text-primary mt-1">
                            {item.value}
                          </p>
                          <p className="text-caption text-foreground-muted mt-1">{item.note}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Ticket Journey */}
        <section className="py-16 bg-surface-2">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-h2 font-heading font-bold text-foreground">
                What Happens When You Raise a Ticket
              </h2>
              <p className="mt-4 text-body text-foreground-muted max-w-xl mx-auto">
                Transparent, trackable service from start to finish
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {ticketJourney.map((step, idx) => (
                  <div key={step.step} className="text-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <step.icon className="h-8 w-8 text-primary" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white text-small font-bold flex items-center justify-center">
                        {step.step}
                      </div>
                    </div>
                    <h4 className="text-body font-semibold text-foreground mt-4">
                      {step.title}
                    </h4>
                    <p className="text-caption text-foreground-muted mt-1">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Guarantees */}
        <section className="py-16 bg-surface">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-h2 font-heading font-bold text-foreground">
                Our Guarantees
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {guarantees.map((item) => (
                <Card key={item.title} className="text-center">
                  <CardContent className="pt-6">
                    <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                      <item.icon className="h-7 w-7 text-success" />
                    </div>
                    <h3 className="text-h4 font-heading font-bold text-foreground mt-4">
                      {item.title}
                    </h3>
                    <p className="text-small text-foreground-muted mt-2">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-r from-primary to-accent">
          <div className="container-custom text-center text-white">
            <h2 className="text-h2 font-heading font-bold">
              Subscribe with Confidence
            </h2>
            <p className="mt-4 text-body-lg text-white/90 max-w-xl mx-auto">
              Join 50,000+ families who trust us for their daily water needs.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/plans"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary font-semibold rounded-btn hover:bg-white/90 transition-colors"
              >
                View Plans
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/support"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-semibold rounded-btn hover:bg-white/20 transition-colors"
              >
                <Phone className="mr-2 h-5 w-5" />
                Talk to Us
              </Link>
            </div>
          </div>
        </section>
    </main>
  );
}
