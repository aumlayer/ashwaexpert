import type { Metadata } from "next";
import Link from "next/link";
import type React from "react";
import { ArrowRight, MapPin, ListChecks, Droplets, CreditCard, Calendar, Wrench, ShieldCheck, Filter, Clock, RefreshCw, XCircle, Check, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { howItWorksDetailed, subscriptionBenefits, comparisonData } from "@/data/content";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "See how Ashva Experts water purifier subscription works: check availability, choose a plan, and get installed in 48 hours.",
  alternates: {
    canonical: "/how-it-works",
  },
};

const icons: Record<string, React.ElementType> = {
  "map-pin": MapPin,
  "list-checks": ListChecks,
  "droplets": Droplets,
  "credit-card": CreditCard,
  "calendar": Calendar,
  "wrench": Wrench,
  "shield-check": ShieldCheck,
  "filter": Filter,
  "clock": Clock,
  "refresh-cw": RefreshCw,
  "x-circle": XCircle,
};

export default function HowItWorksPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-primary/5 via-surface-2 to-accent/5">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-small font-semibold rounded-full mb-4">
              Simple 6-Step Process
            </span>
            <h1 className="text-h1 font-heading font-bold text-foreground">
              Pure Water in 3 Easy Steps
            </h1>
            <p className="mt-4 text-body-lg text-foreground-muted">
              No upfront cost. No maintenance hassle. Just pure, healthy drinking water delivered to your home in 48 hours.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/check-availability"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white font-semibold rounded-btn hover:bg-primary/90 transition-colors"
              >
                Get Started Now
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
              <Link
                href="/plans"
                className="inline-flex items-center justify-center px-8 py-4 border border-primary text-primary font-semibold rounded-btn hover:bg-primary/5 transition-colors"
              >
                View All Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Steps Timeline */}
      <section className="py-16 lg:py-20 bg-surface">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-h2 font-heading font-bold text-foreground">
              Your Journey to Pure Water
            </h2>
            <p className="mt-3 text-body-lg text-foreground-muted max-w-2xl mx-auto">
              From signup to sipping pure water - here's exactly what happens
            </p>
          </div>

          <div className="relative">
            {/* Timeline connector for desktop */}
            <div className="hidden lg:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary rounded-full" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {howItWorksDetailed.map((step, index) => {
                const Icon = icons[step.icon] || Droplets;
                return (
                  <div key={step.step} className="relative">
                    {/* Step number badge */}
                    <div className="flex justify-center lg:justify-center mb-6">
                      <div className="relative z-10 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg shadow-lg">
                        {step.step}
                      </div>
                    </div>
                    
                    <Card className="h-full hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <h3 className="text-h4 font-heading font-bold text-foreground">
                            {step.title}
                          </h3>
                        </div>
                        <p className="text-body text-foreground-muted mb-4">
                          {step.description}
                        </p>
                        <ul className="space-y-2">
                          {step.details.map((detail, i) => (
                            <li key={i} className="flex items-start gap-2 text-small text-foreground-muted">
                              <Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Why Subscription Section */}
      <section className="py-16 lg:py-20 bg-surface-2">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-h2 font-heading font-bold text-foreground">
              Why Subscribe Instead of Buy?
            </h2>
            <p className="mt-3 text-body-lg text-foreground-muted max-w-2xl mx-auto">
              Owning a purifier may seem attractive, but the total cost tells a different story
            </p>
          </div>

          {/* Comparison Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Subscription Column */}
            <Card className="border-2 border-primary relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
              <CardContent className="pt-8">
                <div className="text-center mb-6">
                  <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-small font-semibold rounded-full mb-2">
                    Recommended
                  </span>
                  <h3 className="text-h3 font-heading font-bold text-foreground">
                    {comparisonData.subscription.title}
                  </h3>
                </div>
                <ul className="space-y-4">
                  {comparisonData.subscription.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-body text-foreground">{point.text}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link
                    href="/plans"
                    className="block w-full text-center px-6 py-3 bg-primary text-white font-semibold rounded-btn hover:bg-primary/90 transition-colors"
                  >
                    View Plans
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Buying Column */}
            <Card className="bg-surface-2 border border-border">
              <CardContent className="pt-8">
                <div className="text-center mb-6">
                  <h3 className="text-h3 font-heading font-bold text-foreground-muted">
                    {comparisonData.buying.title}
                  </h3>
                </div>
                <ul className="space-y-4">
                  {comparisonData.buying.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
                      <span className="text-body text-foreground-muted">{point.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-16 lg:py-20 bg-surface">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-h2 font-heading font-bold text-foreground">
              Everything Included in Your Subscription
            </h2>
            <p className="mt-3 text-body-lg text-foreground-muted max-w-2xl mx-auto">
              One monthly payment covers everything. No surprises, no hidden costs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptionBenefits.map((benefit, index) => {
              const Icon = icons[benefit.icon] || ShieldCheck;
              return (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="text-h4 font-heading font-bold text-foreground">
                      {benefit.title}
                    </h3>
                    <p className="mt-2 text-body text-foreground-muted">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 lg:py-20 bg-gradient-to-r from-primary to-accent">
        <div className="container-custom">
          <div className="text-center text-white">
            <h2 className="text-h2 font-heading font-bold">
              Ready to Start Your Pure Water Journey?
            </h2>
            <p className="mt-4 text-body-lg opacity-90 max-w-2xl mx-auto">
              Join 50,000+ families who've switched to smarter water purification. Get installed in 48 hours.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/check-availability"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary font-semibold rounded-btn hover:bg-white/90 transition-colors"
              >
                Check Availability
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
              <a
                href="tel:+919876543210"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-btn hover:bg-white/10 transition-colors"
              >
                Call Us: +91 98765 43210
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
