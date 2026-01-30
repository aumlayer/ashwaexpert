"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, HelpCircle, ArrowRight, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import { TiltCard } from "@/components/ui/tilt-card";
import { AnimatedButton } from "@/components/ui/animated-button";
import { track } from "@/utils/analytics";
import { usePlans } from "@/hooks/use-api";
import { plans as plansData, comparisonData } from "@/data/content";
import { applyFunnelLocationParams, readFunnelLocation } from "@/utils/funnel-location";

const categories = [
  { id: "all", label: "All Plans" },
  { id: "ro", label: "RO Only" },
  { id: "ro-uv", label: "RO + UV" },
  { id: "ro-uv-copper", label: "RO + UV + Copper" },
  { id: "ro-alkaline", label: "RO + Alkaline" },
];

const personas = [
  { id: "home", label: "Home" },
  { id: "pg", label: "PG" },
  { id: "office", label: "Office" },
  { id: "apartment", label: "Apartment" },
];

const personaPlanIds: Record<string, string[] | "all"> = {
  home: "all",
  pg: ["basic-ro", "advanced-ro-uv"],
  office: ["advanced-ro-uv", "alkaline-pro"],
  apartment: ["premium-copper", "advanced-ro-uv"],
};

type BillingMode = "monthly" | "prepaid";
const prepaidTenures = [3, 6, 12] as const;

function PlansPageContent() {
  const searchParams = useSearchParams();
  const funnelLocation = readFunnelLocation(searchParams);
  const pincode = funnelLocation.pincode || "";
  const city = funnelLocation.city || "";
  const locality = funnelLocation.locality || "";
  const plansQuery = usePlans();
  const [selectedPersona, setSelectedPersona] = useState<(typeof personas)[number]["id"]>("home");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [billingMode, setBillingMode] = useState<BillingMode>("monthly");
  const [prepaidMonths, setPrepaidMonths] = useState<(typeof prepaidTenures)[number]>(12);
  const [comparePlanIds, setComparePlanIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const buildCheckoutHref = (planId: string) => {
    const params = new URLSearchParams({
      plan: planId,
      tenure: String(getTenureMonths()),
    });
    applyFunnelLocationParams(params, funnelLocation);
    return `/checkout?${params.toString()}`;
  };

  const allPlans = plansQuery.data && plansQuery.data.length > 0 ? plansQuery.data : plansData;

  const personaFilteredPlans =
    personaPlanIds[selectedPersona] === "all"
      ? allPlans
      : allPlans.filter((p) => (personaPlanIds[selectedPersona] as string[]).includes(p.id));

  const filteredPlans =
    selectedCategory === "all"
      ? personaFilteredPlans
      : personaFilteredPlans.filter((p) => p.purifierType === selectedCategory);

  const handlePlanClick = (planId: string) => {
    track("plan_viewed", { plan_id: planId, pincode });
  };

  const toggleCompare = (planId: string) => {
    setComparePlanIds((prev) => {
      if (prev.includes(planId)) return prev.filter((id) => id !== planId);
      if (prev.length >= 2) return prev;
      return [...prev, planId];
    });
  };

  const comparePlans = comparePlanIds
    .map((id) => allPlans.find((p) => p.id === id))
    .filter(Boolean);

  useEffect(() => {
    if (!isCompareOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsCompareOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isCompareOpen]);

  const getTenureMonths = () => (billingMode === "prepaid" ? prepaidMonths : 1);

  const getPricingForPlan = (plan: (typeof allPlans)[number]) => {
    if (billingMode === "prepaid") {
      const option = plan.prepaidOptions?.find((o) => o.months === prepaidMonths);
      const totalPrice = option?.totalPrice ?? plan.monthlyPrice * prepaidMonths;
      const effectiveMonthly = Math.round(totalPrice / prepaidMonths);
      return {
        displayMonthly: effectiveMonthly,
        strikeMonthly: plan.monthlyPrice,
        subtitle: option ? `Save ₹${option.savingsAmount} (${option.discountPercent}%)` : `Prepaid for ${prepaidMonths} months`,
        tenureLabel: `${prepaidMonths} months prepaid`,
      };
    }

    return {
      displayMonthly: plan.monthlyPrice,
      strikeMonthly: plan.originalPrice ?? null,
      subtitle: plan.bestFor,
      tenureLabel: "Monthly",
    };
  };

  return (
    <section className="py-18 lg:py-24 bg-surface-2">
      <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal animation="fadeUp">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <motion.h1
              className="text-h1 font-heading font-bold text-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Choose Your Plan
            </motion.h1>
            <motion.p
              className="mt-4 text-body-lg text-foreground-muted"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              All plans include free installation, maintenance, and filter
              replacement. No hidden costs.
            </motion.p>
            {pincode && (
              <motion.p
                className="mt-2 text-small text-accent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Showing plans available for{locality ? ` ${locality},` : ""}{city ? ` ${city}` : ""}: {pincode}
              </motion.p>
            )}
          </div>
        </ScrollReveal>

        <motion.div
          className="flex flex-col gap-6 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex flex-wrap justify-center gap-2">
            {personas.map((persona, index) => (
              <motion.button
                key={persona.id}
                onClick={() => setSelectedPersona(persona.id)}
                className={`px-4 py-2 rounded-btn text-small font-medium transition-all duration-300 ${
                  selectedPersona === persona.id
                    ? "bg-primary text-white shadow-md scale-105"
                    : "bg-surface text-foreground-muted hover:bg-surface-2 border border-border hover:scale-105"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {persona.label}
              </motion.button>
            ))}
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-2 bg-surface border border-border rounded-full p-1">
              <button
                onClick={() => setBillingMode("monthly")}
                className={`px-4 py-2 rounded-full text-small font-medium transition-colors ${
                  billingMode === "monthly"
                    ? "bg-primary text-white"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingMode("prepaid")}
                className={`px-4 py-2 rounded-full text-small font-medium transition-colors ${
                  billingMode === "prepaid"
                    ? "bg-primary text-white"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                Prepaid
              </button>
            </div>

            <AnimatePresence>
            {billingMode === "prepaid" && (
              <motion.div
                className="flex flex-wrap justify-center gap-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {prepaidTenures.map((m, index) => (
                  <motion.button
                    key={m}
                    onClick={() => setPrepaidMonths(m)}
                    className={`px-4 py-2 rounded-btn text-small font-medium transition-all duration-300 ${
                      prepaidMonths === m
                        ? "bg-accent text-white shadow-md"
                        : "bg-surface text-foreground-muted hover:bg-surface-2 border border-border"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {m} months
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {categories.map((cat, index) => (
            <motion.button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-btn text-small font-medium transition-all duration-300 ${
                selectedCategory === cat.id
                  ? "bg-primary text-white shadow-md"
                  : "bg-surface text-foreground-muted hover:bg-surface-2 border border-border"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
            >
              {cat.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Plans Grid */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6" staggerDelay={0.1}>
          {filteredPlans.map((plan, index) => (
            (() => {
              const pricing = getPricingForPlan(plan);
              const isSelectedForCompare = comparePlanIds.includes(plan.id);
              const isCompareDisabled = !isSelectedForCompare && comparePlanIds.length >= 2;

              return (
            <StaggerItem key={plan.id}>
              <TiltCard
                className={`h-full ${
                  plan.badge === "Most Popular"
                    ? "ring-2 ring-primary/30"
                    : ""
                }`}
                glareEnabled={plan.badge === "Most Popular"}
              >
                <Card
                  className={`relative flex flex-col h-full overflow-visible ${
                    plan.badge === "Most Popular"
                      ? "border-primary shadow-lg"
                      : ""
                  }`}
                  onClick={() => handlePlanClick(plan.id)}
                >
              {plan.badge && (
                  <div className={`text-center py-2 text-small font-semibold rounded-t-card -mx-px -mt-px ${
                    plan.badge === "Most Popular" 
                      ? "bg-primary text-white" 
                      : "bg-accent text-white"
                  }`}>
                    {plan.badge}
                  </div>
                )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-h4">{plan.name}</CardTitle>
                <div className="mt-3 flex items-baseline justify-center gap-1">
                  {pricing.strikeMonthly ? (
                    <span className="text-body text-foreground-muted line-through mr-1">
                      ₹{pricing.strikeMonthly}
                    </span>
                  ) : null}
                  <span className="text-h2 font-heading font-bold text-foreground">
                    ₹{pricing.displayMonthly}
                  </span>
                  <span className="text-body text-foreground-muted">/month</span>
                </div>
                <p className="text-caption text-foreground-muted mt-2">
                  {pricing.subtitle}
                </p>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col pt-0">
                {/* Specs */}
                <div className="grid grid-cols-2 gap-2 py-4 border-y border-border mb-4">
                  <div className="text-center">
                    <p className="text-caption text-foreground-muted">Stages</p>
                    <p className="text-small font-semibold">{plan.specs.stages}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-caption text-foreground-muted">Tank</p>
                    <p className="text-small font-semibold">{plan.specs.tankCapacity}</p>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2 flex-1 mb-4">
                  {plan.features.slice(0, 5).map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-small text-foreground-muted">
                        {feature}
                      </span>
                    </li>
                  ))}
                  {plan.features.length > 5 && (
                    <li className="text-small text-primary font-medium">
                      +{plan.features.length - 5} more features
                    </li>
                  )}
                </ul>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCompare(plan.id);
                  }}
                  disabled={isCompareDisabled}
                  className={`w-full inline-flex items-center justify-center px-6 py-3 font-semibold rounded-btn transition-colors mb-3 ${
                    isSelectedForCompare
                      ? "bg-accent text-white hover:bg-accent/90"
                      : isCompareDisabled
                      ? "bg-border text-foreground-muted cursor-not-allowed"
                      : "border border-accent text-accent hover:bg-accent/5"
                  }`}
                >
                  {isSelectedForCompare ? "Selected" : "Compare"}
                </button>

                <Link
                  onClick={() => {
                    track("plan_selected", {
                      plan_id: plan.id,
                      pincode,
                      tenure_months: getTenureMonths(),
                      billing_mode: billingMode,
                    });
                  }}
                  href={buildCheckoutHref(plan.id)}
                  className="w-full"
                >
                  <AnimatedButton
                    variant={plan.badge === "Most Popular" ? "primary" : "outline"}
                    className="w-full"
                  >
                    Subscribe Now
                  </AnimatedButton>
                </Link>
              </CardContent>
            </Card>
              </TiltCard>
            </StaggerItem>
              );
            })()
          ))}
        </StaggerContainer>

        {/* Help Section */}
        <ScrollReveal animation="fadeUp" delay={0.2}>
          <div className="mt-16 text-center">
            <motion.div
              className="inline-flex items-center gap-2 text-foreground-muted"
              whileHover={{ scale: 1.02 }}
            >
              <HelpCircle className="h-5 w-5" />
              <span>Not sure which plan is right for you?</span>
            </motion.div>
            <div className="mt-4">
              <Link href="/recommend">
                <AnimatedButton variant="outline" size="lg">
                  Take Our Quiz
                  <ArrowRight className="ml-2 h-5 w-5" />
                </AnimatedButton>
              </Link>
            </div>
          </div>
        </ScrollReveal>

        <AnimatePresence>
          {comparePlanIds.length === 2 && (
          <motion.div
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(720px,calc(100vw-2rem))]"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="bg-surface border border-border shadow-xl rounded-card p-4 flex flex-col sm:flex-row gap-3 items-center justify-between backdrop-blur-sm">
              <div className="text-small text-foreground-muted text-center sm:text-left">
                Comparing:
                <span className="text-foreground font-semibold"> {comparePlanIds[0]}</span>
                <span className="text-foreground-muted"> vs</span>
                <span className="text-foreground font-semibold"> {comparePlanIds[1]}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCompareOpen(true)}
                  className="inline-flex items-center justify-center px-5 py-3 bg-primary text-white font-semibold rounded-btn hover:bg-primary/90 transition-colors"
                >
                  Compare
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
                <motion.button
                  type="button"
                  onClick={() => {
                    setComparePlanIds([]);
                    setIsCompareOpen(false);
                  }}
                  className="inline-flex items-center justify-center px-5 py-3 border border-border text-foreground font-semibold rounded-btn hover:bg-surface-2 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Clear
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        {isCompareOpen && comparePlans.length === 2 && (
          <div
            className="fixed inset-0 z-[60] bg-foreground/40 animate-fade-in"
            onClick={() => setIsCompareOpen(false)}
          >
            <div className="absolute inset-0 flex items-end sm:items-center justify-center p-4">
              <div
                className="w-full max-w-4xl bg-surface rounded-card shadow-lg border border-border overflow-hidden animate-slide-up"
                role="dialog"
                aria-modal="true"
                aria-label="Compare plans"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div>
                    <p className="text-h4 font-heading font-bold text-foreground">
                      Compare Plans
                    </p>
                    <p className="text-small text-foreground-muted">
                      {billingMode === "prepaid" ? `${prepaidMonths} months prepaid` : "Monthly"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCompareOpen(false)}
                    className="p-2 rounded-btn hover:bg-surface-2"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5 text-foreground-muted" />
                  </button>
                </div>

                <div className="p-4 overflow-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {comparePlans.map((plan) => {
                      if (!plan) return null;
                      const pricing = getPricingForPlan(plan);
                      return (
                        <div key={plan.id} className="border border-border rounded-card p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-h4 font-heading font-bold text-foreground">
                                {plan.name}
                              </p>
                              <p className="text-small text-foreground-muted mt-1">{pricing.subtitle}</p>
                            </div>
                            <div className="text-right">
                              {pricing.strikeMonthly ? (
                                <p className="text-small text-foreground-muted line-through">₹{pricing.strikeMonthly}/mo</p>
                              ) : null}
                              <p className="text-h3 font-heading font-bold text-foreground">₹{pricing.displayMonthly}/mo</p>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="bg-surface-2 rounded-btn p-3">
                              <p className="text-caption text-foreground-muted">Stages</p>
                              <p className="text-small font-semibold text-foreground">{plan.specs.stages}</p>
                            </div>
                            <div className="bg-surface-2 rounded-btn p-3">
                              <p className="text-caption text-foreground-muted">Tank</p>
                              <p className="text-small font-semibold text-foreground">{plan.specs.tankCapacity}</p>
                            </div>
                            <div className="bg-surface-2 rounded-btn p-3">
                              <p className="text-caption text-foreground-muted">Max TDS</p>
                              <p className="text-small font-semibold text-foreground">{plan.specs.maxTds}</p>
                            </div>
                            <div className="bg-surface-2 rounded-btn p-3">
                              <p className="text-caption text-foreground-muted">Lock-in</p>
                              <p className="text-small font-semibold text-foreground">{plan.lockInMonths} months</p>
                            </div>
                          </div>

                          <div className="mt-4">
                            <p className="text-small font-semibold text-foreground">Top features</p>
                            <ul className="mt-2 space-y-2">
                              {plan.features.slice(0, 6).map((f) => (
                                <li key={f} className="flex items-start gap-2 text-small text-foreground-muted">
                                  <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="mt-5">
                            <Link
                              href={buildCheckoutHref(plan.id)}
                              onClick={() => {
                                track("plan_selected", {
                                  plan_id: plan.id,
                                  pincode,
                                  tenure_months: getTenureMonths(),
                                  billing_mode: billingMode,
                                  source: "compare_drawer",
                                });
                              }}
                              className="w-full inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-btn hover:bg-primary/90 transition-colors"
                            >
                              Subscribe
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-8 bg-surface-2 rounded-card p-6">
                    <p className="text-h4 font-heading font-bold text-foreground">
                      {comparisonData.subscription.title}
                    </p>
                    <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {comparisonData.subscription.points.slice(0, 6).map((p) => (
                        <li key={p.text} className="flex items-start gap-2 text-small text-foreground-muted">
                          <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                          {p.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default function PlansPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <PlansPageContent />
    </Suspense>
  );
}
