"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Clock, Users, RefreshCw, Award, Heart, ArrowRight } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import { AnimatedButton } from "@/components/ui/animated-button";
import { trustPoints } from "@/data/content";

const iconMap: Record<string, React.ElementType> = {
  "shield-check": Shield,
  "users": Users,
  "clock": Clock,
  "refresh-cw": RefreshCw,
  "award": Award,
  "heart": Heart,
};

export function TrustSection() {
  return (
    <section className="py-18 lg:py-24 bg-surface overflow-hidden">
      <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal animation="fadeUp">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-block text-accent font-semibold text-small uppercase tracking-wider mb-2">
              Why Choose Us
            </span>
            <h2 className="text-h2 font-heading font-bold text-foreground">
              The Ashva Experts Service Promise
            </h2>
            <p className="mt-4 text-body-lg text-foreground-muted">
              We don&apos;t just install water purifiers—we deliver peace of mind with
              industry-leading service guarantees that put your family&apos;s health first.
            </p>
          </div>
        </ScrollReveal>

        {/* Trust Points Grid */}
        <StaggerContainer className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" staggerDelay={0.1}>
          {trustPoints.map((point) => {
            const IconComponent = iconMap[point.icon] || Shield;
            return (
              <StaggerItem key={point.title}>
                <motion.div
                  className="bg-surface-2 rounded-card p-6 h-full border border-transparent hover:border-accent/20 hover:shadow-lg transition-all duration-300 group"
                  whileHover={{ y: -5 }}
                >
                  <motion.div
                    className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 mb-4 group-hover:bg-accent/20 transition-colors"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <IconComponent className="h-7 w-7 text-accent" />
                  </motion.div>
                  <h3 className="text-h4 font-heading font-semibold text-foreground group-hover:text-accent transition-colors">
                    {point.title}
                  </h3>
                  <p className="mt-2 text-body text-foreground-muted leading-relaxed">
                    {point.description}
                  </p>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* CTA Banner */}
        <ScrollReveal animation="scale" delay={0.2}>
          <motion.div
            className="mt-16 bg-gradient-to-r from-primary to-accent rounded-card p-8 md:p-12 text-center relative overflow-hidden"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/4 translate-y-1/4" />
            
            <div className="relative z-10">
              <h3 className="text-h3 font-heading font-bold text-white">
                Ready to Experience the Difference?
              </h3>
              <p className="mt-2 text-body-lg text-white/90 max-w-xl mx-auto">
                Join 50,000+ families who trust Ashva Experts for their daily drinking water.
              </p>
              <Link href="/plans" className="inline-block mt-6">
                <AnimatedButton variant="secondary" size="lg" className="bg-white text-primary hover:bg-white/90">
                  View Our Plans
                  <ArrowRight className="ml-2 h-5 w-5" />
                </AnimatedButton>
              </Link>
            </div>
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  );
}
