"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Shield, Wrench, RefreshCw, Clock } from "lucide-react";
import { Button, Input, AnimatedStat } from "@/components/ui";
import { track } from "@/utils/analytics";
import { heroContent, images, siteConfig } from "@/data/content";
import { useCheckAvailability } from "@/hooks/use-api";
import { buildFunnelLocationQuery } from "@/utils/funnel-location";

const trustIcons: Record<string, React.ElementType> = {
  "shield-check": Shield,
  "wrench": Wrench,
  "refresh-cw": RefreshCw,
  "clock": Clock,
};

export function HeroSection() {
  const router = useRouter();
  const [pincode, setPincode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAvailabilityMutation = useCheckAvailability();

  const handleCheckAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6) return;

    track("pincode_check_started", { pincode });
    setIsLoading(true);

    try {
      setError(null);
      const res = await checkAvailabilityMutation.mutateAsync({ pincode });
      track("pincode_check_success", { pincode, available: res.available });

      if (!res.available) {
        setError("We don't serve your area yet. Please chat with us on WhatsApp and we'll notify you when we launch.");
        router.push(
          `/check-availability${buildFunnelLocationQuery({
            pincode,
            city: res.city || undefined,
            locality: res.locality || undefined,
          })}`
        );
        return;
      }

      router.push(
        `/plans${buildFunnelLocationQuery({
          pincode,
          city: res.city || undefined,
          locality: res.locality || undefined,
        })}`
      );
    } catch {
      setError("We couldn't check availability right now. Please try again, or chat with us on WhatsApp.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-accent to-mint min-h-[90vh] flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={images.hero.main}
          alt="Pure clean water"
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-accent/80 to-mint/70" />
      </div>

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,white_1px,transparent_1px)] bg-[length:40px_40px]" />
      </div>

      <div className="relative mx-auto max-w-container px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-mint"></span>
              </span>
              <span className="text-small text-white font-medium">Serving 100+ cities across India</span>
            </div>

            {/* Headline */}
            <h1 className="text-h1 lg:text-display text-white font-heading font-bold text-balance leading-tight">
              {heroContent.headline.split(".")[0]}.{" "}
              <span className="text-mint">{heroContent.headline.split(".")[1]}</span>
            </h1>

            {/* Subtext */}
            <p className="mt-6 text-body-lg text-white/90 max-w-xl leading-relaxed">
              {heroContent.subheadline}
            </p>

            {/* Pincode Form */}
            <form
              onSubmit={handleCheckAvailability}
              className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md"
            >
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="Enter your 6-digit pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                className="flex-1 bg-white border-0 text-foreground placeholder:text-foreground-muted h-14 text-body"
              />
              <Button
                type="submit"
                size="lg"
                isLoading={isLoading}
                className="whitespace-nowrap h-14 px-8"
              >
                {heroContent.ctaPrimary}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>

            {error ? (
              <div className="mt-4 bg-white/15 border border-white/20 rounded-card p-4">
                <p className="text-small text-white/90">{error}</p>
                <a
                  className="inline-flex mt-3 text-small font-semibold text-mint hover:underline"
                  href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
                    `Hi Ashva Experts! Please help me with availability for pincode ${pincode}.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Chat on WhatsApp
                </a>
              </div>
            ) : null}

            {/* Trust Badges */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              {heroContent.trustBadges.map((badge) => {
                const IconComponent = trustIcons[badge.icon] || CheckCircle2;
                return (
                  <div
                    key={badge.text}
                    className="flex items-center gap-2 text-small text-white/90"
                  >
                    <IconComponent className="h-5 w-5 text-mint flex-shrink-0" />
                    <span>{badge.text}</span>
                  </div>
                );
              })}
            </div>

            {/* Price anchor */}
            <div className="mt-10 inline-flex items-baseline gap-2 bg-white/15 backdrop-blur-sm rounded-card px-6 py-3">
              <span className="text-body text-white/80">Plans starting at just</span>
              <span className="text-h2 font-heading font-bold text-white">₹399</span>
              <span className="text-body text-white/80">/month</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {heroContent.stats.map((stat, index) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur-sm rounded-card p-6 text-center border border-white/20 animate-fade-in-up hover:bg-white/15 transition-colors"
                style={{ animationDelay: `${300 + index * 100}ms`, animationFillMode: "both" }}
              >
                <p className="text-h2 font-heading font-bold text-white">
                  <AnimatedStat value={stat.value} />
                </p>
                <p className="text-small text-white/80 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-white/60 rounded-full" />
        </div>
      </div>
    </section>
  );
}
