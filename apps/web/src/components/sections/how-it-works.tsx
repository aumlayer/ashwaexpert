"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, ListChecks, Droplets, ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { AnimatedButton } from "@/components/ui/animated-button";
import { howItWorksSteps } from "@/data/content";

const iconMap: Record<string, React.ElementType> = {
  "map-pin": MapPin,
  "list-checks": ListChecks,
  "droplets": Droplets,
};

export function HowItWorksSection() {
  return (
    <section className="py-18 lg:py-24 bg-surface overflow-hidden">
      <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal animation="fadeUp">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-block text-accent font-semibold text-small uppercase tracking-wider mb-2">
              Simple Process
            </span>
            <h2 className="text-h2 font-heading font-bold text-foreground">
              Get Pure Water in 3 Easy Steps
            </h2>
            <p className="mt-4 text-body-lg text-foreground-muted">
              From checking availability to enjoying pure water—we make the entire
              process seamless and hassle-free. No complicated setup, no hidden fees.
            </p>
          </div>
        </ScrollReveal>

        {/* Steps */}
        <div className="mt-16 space-y-16 lg:space-y-24">
          {howItWorksSteps.map((step, index) => {
            const IconComponent = iconMap[step.icon] || MapPin;
            const isEven = index % 2 === 1;

            return (
              <ScrollReveal
                key={step.step}
                animation={isEven ? "fadeRight" : "fadeLeft"}
                delay={index * 0.1}
              >
                <div
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
                    isEven ? "lg:flex-row-reverse" : ""
                  }`}
                >
                  {/* Image */}
                  <motion.div
                    className={`relative ${isEven ? "lg:order-2" : ""}`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="relative aspect-[4/3] rounded-card overflow-hidden shadow-lg group">
                      <Image
                        src={step.image}
                        alt={step.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {/* Step Badge */}
                    <motion.div
                      className="absolute -top-4 -left-4 w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <span className="text-h3 font-heading font-bold">{step.step}</span>
                    </motion.div>
                  </motion.div>

                  {/* Content */}
                  <div className={isEven ? "lg:order-1" : ""}>
                    <motion.div
                      className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4"
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(10, 77, 140, 0.2)" }}
                    >
                      <IconComponent className="h-7 w-7 text-primary" />
                    </motion.div>
                    <h3 className="text-h3 font-heading font-bold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-4 text-body-lg text-foreground-muted leading-relaxed">
                      {step.description}
                    </p>

                    {/* Step-specific CTA */}
                    {step.step === 1 && (
                      <Link href="/check-availability" className="inline-block mt-6">
                        <AnimatedButton size="lg">
                          Check Your Pincode
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </AnimatedButton>
                      </Link>
                    )}
                    {step.step === 2 && (
                      <Link href="/plans" className="inline-block mt-6">
                        <AnimatedButton variant="outline" size="lg">
                          Browse Plans
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </AnimatedButton>
                      </Link>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <ScrollReveal animation="fadeUp" delay={0.3}>
          <div className="mt-20 text-center">
            <p className="text-body-lg text-foreground-muted mb-4">
              Ready to get started? It takes less than 2 minutes.
            </p>
            <Link href="/check-availability" className="inline-block">
              <AnimatedButton size="lg" className="text-body-lg px-8 py-4">
                Check Availability Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </AnimatedButton>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
