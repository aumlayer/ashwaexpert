"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";

const plans = [
  {
    id: "basic",
    name: "Basic RO",
    price: 399,
    badge: null,
    features: [
      "5-stage RO purification",
      "8L storage tank",
      "Free installation",
      "Quarterly maintenance",
      "Filter replacement included",
    ],
    bestFor: "Municipal water",
  },
  {
    id: "advanced",
    name: "Advanced RO+UV",
    price: 549,
    badge: "Most Popular",
    features: [
      "7-stage RO+UV purification",
      "10L storage tank",
      "Free installation",
      "Monthly maintenance",
      "Filter replacement included",
      "TDS controller",
    ],
    bestFor: "Borewell water",
  },
  {
    id: "premium",
    name: "Premium Copper",
    price: 749,
    badge: "Best Value",
    features: [
      "8-stage RO+UV+Copper",
      "12L storage tank",
      "Free installation",
      "Monthly maintenance",
      "Filter replacement included",
      "TDS controller",
      "Copper infusion",
      "Alkaline boost",
    ],
    bestFor: "Health conscious",
  },
];

export function TopPlansSection() {
  return (
    <section className="py-18 lg:py-24 bg-surface-2">
      <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-h2 font-heading font-bold text-foreground">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-body-lg text-foreground-muted">
            All plans include installation, maintenance, and filter replacement.
            No hidden costs.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                plan.badge === "Most Popular"
                  ? "border-primary shadow-lg scale-[1.02]"
                  : ""
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="accent">{plan.badge}</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <p className="text-small text-foreground-muted mb-1">
                  Best for {plan.bestFor}
                </p>
                <CardTitle className="text-h3">{plan.name}</CardTitle>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-h2 font-heading font-bold text-foreground">
                    ₹{plan.price}
                  </span>
                  <span className="text-body text-foreground-muted">/month</span>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-body text-foreground-muted">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/checkout?plan=${plan.id}`}
                  className={`w-full inline-flex items-center justify-center px-6 py-3 font-semibold rounded-btn transition-colors ${
                    plan.badge === "Most Popular"
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "border border-primary text-primary hover:bg-primary/5"
                  }`}
                >
                  Subscribe Now
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Plans Link */}
        <div className="mt-10 text-center">
          <Link
            href="/plans"
            className="text-body font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View all plans and compare →
          </Link>
        </div>
      </div>
    </section>
  );
}
