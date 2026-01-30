"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Droplets } from "lucide-react";
import { Input } from "@/components/ui";
import { AnimatedButton } from "@/components/ui/animated-button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { track } from "@/utils/analytics";
import { siteConfig } from "@/data/content";
import { useCheckAvailability } from "@/hooks/use-api";
import { buildFunnelLocationQuery } from "@/utils/funnel-location";

export function CTASection() {
  const router = useRouter();
  const [pincode, setPincode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAvailabilityMutation = useCheckAvailability();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6) return;

    track("pincode_check_started", { pincode, source: "footer_cta" });
    setIsLoading(true);

    try {
      setError(null);
      const res = await checkAvailabilityMutation.mutateAsync({ pincode });
      track("pincode_check_success", { pincode, available: res.available, source: "footer_cta" });

      if (!res.available) {
        setError("We don't serve your area yet. You can leave your details and we'll notify you when we launch.");
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
    <section className="py-18 lg:py-24 bg-gradient-to-br from-primary via-accent to-primary relative overflow-hidden">
      {/* Decorative floating elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + (i % 3) * 30}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          >
            <Droplets className="w-8 h-8 text-white/20" />
          </motion.div>
        ))}
      </div>

      {/* Background circles */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />

      <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <ScrollReveal animation="fadeUp">
          <motion.h2
            className="text-h2 font-heading font-bold text-white"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Ready for Pure Water?
          </motion.h2>
          <motion.p
            className="mt-4 text-body-lg text-white/80 max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Check if we serve your area and get started with your subscription
            today.
          </motion.p>
        </ScrollReveal>

        <motion.form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex-1 relative group">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="Enter your pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
              className="flex-1 bg-white border-0 shadow-lg"
            />
            <div className="absolute inset-0 -z-10 bg-white/30 blur-xl rounded-btn opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <AnimatedButton
            type="submit"
            variant="secondary"
            size="lg"
            isLoading={isLoading}
            className="shadow-lg"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </AnimatedButton>
        </motion.form>

        {error ? (
          <div className="mt-4 max-w-md mx-auto bg-white/10 border border-white/15 rounded-card p-4 text-left">
            <p className="text-small text-white/90">{error}</p>
            <a
              className="inline-flex mt-3 text-small font-semibold text-white hover:underline"
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

        <p className="mt-6 text-small text-white/60">
          Or call us at{" "}
          <a
            href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
            className="underline hover:text-white"
          >
            {siteConfig.phone}
          </a>
        </p>
      </div>
    </section>
  );
}
