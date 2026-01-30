"use client";

import type React from "react";
import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Shield, Wrench, RefreshCw, Clock, Droplets } from "lucide-react";
import { Input, AnimatedStat } from "@/components/ui";
import { AnimatedButton } from "@/components/ui/animated-button";
import { track } from "@/utils/analytics";
import { heroContent, siteConfig } from "@/data/content";
import { useCheckAvailability } from "@/hooks/use-api";
import { buildFunnelLocationQuery } from "@/utils/funnel-location";

const WaterBackground = dynamic(
  () => import("@/components/three/WaterBackground").then((mod) => mod.WaterBackground),
  { ssr: false }
);

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
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-accent to-primary min-h-[90vh] flex items-center">
      {/* Three.js Water Background */}
      <Suspense fallback={null}>
        <WaterBackground />
      </Suspense>

      {/* Animated water droplets overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{ y: -100, x: Math.random() * 100 + "%", opacity: 0 }}
            animate={{
              y: ["0vh", "100vh"],
              opacity: [0, 0.6, 0.6, 0],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: i * 1.5,
              ease: "linear",
            }}
          >
            <Droplets className="w-6 h-6 text-white/20" />
          </motion.div>
        ))}
      </div>

      <div className="relative mx-auto max-w-container px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 border border-white/10"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-mint"></span>
              </span>
              <span className="text-small text-white font-medium">Serving 100+ cities across India</span>
            </motion.div>

            {/* Headline with typewriter effect */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-h1 lg:text-display text-white font-heading font-bold text-balance leading-tight"
            >
              {heroContent.headline.split(".")[0]}.{" "}
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="text-mint inline-block"
              >
                {heroContent.headline.split(".")[1]}
              </motion.span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 text-body-lg text-white/90 max-w-xl leading-relaxed"
            >
              {heroContent.subheadline}
            </motion.p>

            {/* Pincode Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              onSubmit={handleCheckAvailability}
              className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md"
            >
              <div className="flex-1 relative group">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="Enter your 6-digit pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 bg-white border-0 text-foreground placeholder:text-foreground-muted h-14 text-body shadow-xl"
                />
                <div className="absolute inset-0 -z-10 bg-white/30 blur-xl rounded-btn opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <AnimatedButton
                type="submit"
                size="lg"
                isLoading={isLoading}
                className="whitespace-nowrap h-14 px-8 shadow-xl"
              >
                {heroContent.ctaPrimary}
                <ArrowRight className="ml-2 h-5 w-5" />
              </AnimatedButton>
            </motion.form>

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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-8 grid grid-cols-2 gap-3"
            >
              {heroContent.trustBadges.map((badge, index) => {
                const IconComponent = trustIcons[badge.icon] || CheckCircle2;
                return (
                  <motion.div
                    key={badge.text}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                    className="flex items-center gap-2 text-small text-white/90 hover:text-white transition-colors group cursor-default"
                  >
                    <IconComponent className="h-5 w-5 text-mint flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span>{badge.text}</span>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Price anchor */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="mt-10 inline-flex items-baseline gap-2 bg-white/15 backdrop-blur-sm rounded-card px-6 py-3 border border-white/20 hover:bg-white/20 transition-colors cursor-default"
            >
              <span className="text-body text-white/80">Plans starting at just</span>
              <span className="text-h2 font-heading font-bold text-white animate-pulse-slow">₹399</span>
              <span className="text-body text-white/80">/month</span>
            </motion.div>
          </div>

          {/* Stats Grid */}
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {heroContent.stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.15 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white/10 backdrop-blur-md rounded-card p-6 text-center border border-white/20 cursor-default group"
              >
                <p className="text-h2 font-heading font-bold text-white group-hover:text-mint transition-colors">
                  <AnimatedStat value={stat.value} />
                </p>
                <p className="text-small text-white/80 mt-1">{stat.label}</p>
                {/* Glow effect */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-mint/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-card" />
              </motion.div>
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
