"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { TiltCard } from "@/components/ui/tilt-card";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import { usePlans } from "@/hooks/use-api";
import { plans as plansData } from "@/data/content";

export function TopPlansSection() {
  const plansQuery = usePlans();
  const allPlans = plansQuery.data && plansQuery.data.length > 0 ? plansQuery.data : plansData;
  const topPlans = [...allPlans]
    .filter((p) => p.isActive !== false)
    .sort((a, b) => Number(Boolean(b.isPopular)) - Number(Boolean(a.isPopular)))
    .slice(0, 3);

  return (
    <section className="py-18 lg:py-24 bg-surface-2">
      <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal animation="fadeUp">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-block text-primary font-semibold text-small uppercase tracking-wider mb-2">
              Subscription Plans
            </span>
            <h2 className="text-h2 font-heading font-bold text-foreground">
              Choose Your Plan
            </h2>
            <p className="mt-4 text-body-lg text-foreground-muted">
              All plans include installation, maintenance, and filter replacement.
              No hidden costs.
            </p>
          </div>
        </ScrollReveal>

        {/* Plans Grid */}
        <StaggerContainer className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8" staggerDelay={0.15}>
          {topPlans.map((plan) => (
            <StaggerItem key={plan.id}>
              <TiltCard
                className={`relative h-full ${
                  plan.badge === "Most Popular"
                    ? "border-primary shadow-lg ring-2 ring-primary/20"
                    : ""
                }`}
                tiltMaxAngle={10}
              >
              {plan.badge && (
                <div className={`text-center py-2 text-small font-semibold rounded-t-card ${
                  plan.badge === "Most Popular" 
                    ? "bg-primary text-white" 
                    : "bg-accent text-white"
                }`}>
                  {plan.badge}
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <p className="text-small text-foreground-muted mb-1">
                  Best for {plan.bestFor}
                </p>
                <CardTitle className="text-h3">{plan.name}</CardTitle>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-h2 font-heading font-bold text-foreground">
                    ₹{plan.monthlyPrice}
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
              </TiltCard>
            </StaggerItem>
          ))}
        </StaggerContainer>

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
