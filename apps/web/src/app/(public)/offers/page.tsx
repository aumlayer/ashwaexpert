"use client";

import Link from "next/link";
import {
  Gift,
  Percent,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Calendar,
  Users,
} from "lucide-react";
import { Button, Card, CardContent, Badge } from "@/components/ui";

const offers = [
  {
    id: "prepaid-12",
    title: "Annual Prepaid - Save 20%",
    description: "Pay for 12 months upfront and save 20% on your subscription",
    discount: "20%",
    badge: "Best Value",
    validTill: "Limited time",
    terms: ["Valid on all plans", "One-time payment", "Full year coverage"],
    cta: "Get Annual Plan",
    href: "/plans?tenure=annual",
    featured: true,
  },
  {
    id: "prepaid-6",
    title: "6-Month Prepaid - Save 10%",
    description: "Pay for 6 months and enjoy 10% savings",
    discount: "10%",
    badge: null,
    validTill: "Ongoing",
    terms: ["Valid on all plans", "One-time payment", "6-month coverage"],
    cta: "Get 6-Month Plan",
    href: "/plans?tenure=6month",
    featured: false,
  },
  {
    id: "referral",
    title: "Refer & Earn ₹500",
    description: "Refer a friend and both of you get ₹500 off",
    discount: "₹500",
    badge: "Popular",
    validTill: "Ongoing",
    terms: ["Both referrer and referee get ₹500", "No limit on referrals", "Credited after installation"],
    cta: "Start Referring",
    href: "/app/referrals",
    featured: false,
  },
  {
    id: "second-unit",
    title: "Second Unit - 15% Off",
    description: "Add a second purifier to your home at 15% discount",
    discount: "15%",
    badge: null,
    validTill: "Ongoing",
    terms: ["Same address only", "Any plan combination", "Separate billing"],
    cta: "Add Second Unit",
    href: "/app/addons",
    featured: false,
  },
];

const bundles = [
  {
    name: "Family Bundle",
    description: "2 purifiers for larger homes",
    originalPrice: 1098,
    bundlePrice: 899,
    savings: 199,
    includes: ["2x Advanced RO+UV", "Free installation", "Combined billing"],
  },
  {
    name: "Office Starter",
    description: "Perfect for small offices",
    originalPrice: 1647,
    bundlePrice: 1299,
    savings: 348,
    includes: ["3x Basic RO", "Priority support", "Single invoice"],
  },
];

export default function OffersPage() {
  return (
    <main>
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-primary via-accent to-mint">
        <div className="container-custom text-center text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-btn mb-6">
            <Gift className="h-5 w-5" />
            <span className="text-small font-medium">Special Offers</span>
          </div>
          <h1 className="text-h1 font-heading font-bold">
            Save More on Pure Water
          </h1>
          <p className="mt-4 text-body-lg text-white/90 max-w-2xl mx-auto">
            Exclusive offers and bundles to help you save on your water purifier subscription.
          </p>
        </div>
      </section>

        {/* Featured Offer */}
        {offers.filter(o => o.featured).map((offer) => (
          <section key={offer.id} className="py-12 bg-surface">
            <div className="container-custom">
              <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 overflow-hidden">
                <CardContent className="py-8">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Percent className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="accent">{offer.badge}</Badge>
                          <span className="text-caption text-foreground-muted flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {offer.validTill}
                          </span>
                        </div>
                        <h2 className="text-h3 font-heading font-bold text-foreground">
                          {offer.title}
                        </h2>
                        <p className="text-body text-foreground-muted mt-1">
                          {offer.description}
                        </p>
                        <ul className="flex flex-wrap gap-4 mt-4">
                          {offer.terms.map((term) => (
                            <li key={term} className="flex items-center gap-1 text-small text-foreground-muted">
                              <CheckCircle2 className="h-4 w-4 text-success" />
                              {term}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="text-center lg:text-right">
                      <p className="text-h1 font-heading font-bold text-primary">
                        {offer.discount}
                      </p>
                      <p className="text-small text-foreground-muted">OFF</p>
                      <Link
                        href={offer.href}
                        className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-btn hover:bg-primary/90 transition-colors mt-4"
                      >
                        {offer.cta}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        ))}

        {/* All Offers */}
        <section className="py-16 bg-surface-2">
          <div className="container-custom">
            <h2 className="text-h2 font-heading font-bold text-foreground text-center mb-12">
              All Offers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.filter(o => !o.featured).map((offer) => (
                <Card key={offer.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-accent" />
                      </div>
                      {offer.badge && <Badge>{offer.badge}</Badge>}
                    </div>
                    <h3 className="text-h4 font-heading font-bold text-foreground">
                      {offer.title}
                    </h3>
                    <p className="text-body text-foreground-muted mt-2">
                      {offer.description}
                    </p>
                    <ul className="mt-4 space-y-2">
                      {offer.terms.map((term) => (
                        <li key={term} className="flex items-center gap-2 text-small text-foreground-muted">
                          <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                          {term}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={offer.href}
                      className="inline-flex items-center justify-center w-full px-4 py-3 bg-primary text-white font-semibold rounded-btn hover:bg-primary/90 transition-colors mt-6"
                    >
                      {offer.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Bundles */}
        <section className="py-16 bg-surface">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-h2 font-heading font-bold text-foreground">
                Value Bundles
              </h2>
              <p className="mt-4 text-body text-foreground-muted">
                Save more with our curated bundles
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {bundles.map((bundle) => (
                <Card key={bundle.name} className="border-2 border-accent/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="h-5 w-5 text-accent" />
                      <Badge variant="accent">Bundle</Badge>
                    </div>
                    <h3 className="text-h3 font-heading font-bold text-foreground">
                      {bundle.name}
                    </h3>
                    <p className="text-body text-foreground-muted mt-1">
                      {bundle.description}
                    </p>

                    <div className="mt-6 p-4 bg-surface-2 rounded-card">
                      <div className="flex items-baseline gap-2">
                        <span className="text-h2 font-heading font-bold text-primary">
                          ₹{bundle.bundlePrice}
                        </span>
                        <span className="text-body text-foreground-muted line-through">
                          ₹{bundle.originalPrice}
                        </span>
                        <span className="text-small text-foreground-muted">/month</span>
                      </div>
                      <p className="text-small text-success font-medium mt-1">
                        Save ₹{bundle.savings}/month
                      </p>
                    </div>

                    <ul className="mt-4 space-y-2">
                      {bundle.includes.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-small text-foreground-muted">
                          <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/corporate"
                      className="inline-flex items-center justify-center w-full px-4 py-3 border-2 border-primary text-primary font-semibold rounded-btn hover:bg-primary/5 transition-colors mt-6"
                    >
                      Get This Bundle
                    </Link>
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
            Have Questions About Our Offers?
          </h2>
          <p className="mt-4 text-body-lg text-white/90">
            Our team is here to help you find the best deal.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/plans"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary font-semibold rounded-btn hover:bg-white/90 transition-colors"
            >
              View All Plans
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-semibold rounded-btn hover:bg-white/20 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
