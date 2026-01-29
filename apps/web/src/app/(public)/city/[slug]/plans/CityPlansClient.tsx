"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, MapPin } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input } from "@/components/ui";
import { siteConfig } from "@/data/content";
import type { Plan } from "@/types/api";
import { useCheckAvailability } from "@/hooks/use-api";
import { buildFunnelLocationQuery } from "@/utils/funnel-location";

export function CityPlansClient({
  cityName,
  citySlug,
  plans,
}: {
  cityName: string;
  citySlug: string;
  plans: Plan[];
}) {
  const router = useRouter();
  const [pincode, setPincode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const checkAvailability = useCheckAvailability();

  const topPlans = useMemo(() => {
    return [...plans]
      .filter((p) => p.isActive !== false)
      .sort((a, b) => Number(Boolean(b.isPopular)) - Number(Boolean(a.isPopular)))
      .slice(0, 6);
  }, [plans]);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6) return;

    try {
      setError(null);
      const res = await checkAvailability.mutateAsync({ pincode });

      if (!res.available) {
        router.push(
          `/check-availability${buildFunnelLocationQuery({
            pincode,
            city: res.city || cityName,
            locality: res.locality || undefined,
          })}`
        );
        return;
      }

      router.push(
        `/plans${buildFunnelLocationQuery({
          pincode,
          city: res.city || cityName,
          locality: res.locality || undefined,
        })}`
      );
    } catch {
      setError("We couldn't check availability right now. Please try again, or chat with us on WhatsApp.");
    }
  };

  return (
    <main className="py-18 lg:py-24 bg-surface-2">
      <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-small font-semibold text-accent uppercase tracking-wider">{cityName}</p>
          <h1 className="mt-2 text-h1 font-heading font-bold text-foreground">
            Water Purifier Subscription Plans in {cityName}
          </h1>
          <p className="mt-4 text-body-lg text-foreground-muted">
            Choose a plan and check availability for your pincode.
          </p>

          <form onSubmit={handleCheck} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="Enter your 6-digit pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
              className="flex-1"
            />
            <Button type="submit" size="lg" isLoading={checkAvailability.isPending}>
              Check Availability
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>

          {error ? (
            <div className="mt-4 bg-surface rounded-card border border-border p-4 text-left">
              <p className="text-small text-error">{error}</p>
              <a
                className="inline-flex mt-3 text-small font-semibold text-primary hover:underline"
                href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
                  `Hi Ashva Experts! Please help me with availability in ${cityName} for pincode ${pincode}.`
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                Chat on WhatsApp
              </a>
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-center gap-2 text-small text-foreground-muted">
            <MapPin className="h-4 w-4" />
            <span>
              Looking for another city? <Link href="/plans" className="text-primary hover:underline">View all plans</Link>
            </span>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {topPlans.map((plan) => (
            <Card key={plan.id} className={plan.isPopular ? "border-primary shadow-lg" : ""}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-h4">{plan.name}</CardTitle>
                  {plan.badge ? <Badge variant="accent">{plan.badge}</Badge> : null}
                </div>
                <p className="mt-2 text-small text-foreground-muted">Best for {plan.bestFor}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-h2 font-heading font-bold text-foreground">₹{plan.monthlyPrice}</span>
                  <span className="text-body text-foreground-muted">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.slice(0, 5).map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-small text-foreground-muted">
                      <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/checkout?plan=${encodeURIComponent(plan.id)}&city=${encodeURIComponent(cityName)}`}
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-btn hover:bg-primary/90 transition-colors"
                >
                  Subscribe Now
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
