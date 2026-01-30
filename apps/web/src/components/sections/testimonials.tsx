"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Star, Quote, BadgeCheck } from "lucide-react";
import { Card, CardContent, AnimatedStat } from "@/components/ui";
import { Carousel, CarouselItem } from "@/components/ui/carousel";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { testimonials } from "@/data/content";
import { useTestimonials } from "@/hooks/use-api";

export function TestimonialsSection() {
  const testimonialsQuery = useTestimonials();
  const testimonialsForUi =
    testimonialsQuery.data && testimonialsQuery.data.length > 0 ? testimonialsQuery.data : testimonials;

  return (
    <section className="py-18 lg:py-24 bg-surface-2 overflow-hidden">
      <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal animation="fadeUp">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-block text-accent font-semibold text-small uppercase tracking-wider mb-2">
              Customer Stories
            </span>
            <h2 className="text-h2 font-heading font-bold text-foreground">
              Trusted by 50,000+ Happy Families Across India
            </h2>
            <p className="mt-4 text-body-lg text-foreground-muted">
              Real stories from real customers who made the switch to Ashva Experts
              and never looked back.
            </p>
          </div>
        </ScrollReveal>

        {/* Testimonials Carousel */}
        <div className="mt-12">
          <Carousel autoplayDelay={5000}>
            {testimonialsForUi.map((testimonial) => (
              <CarouselItem key={testimonial.id}>
                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="h-full"
                >
                  <Card className="relative overflow-hidden h-full">
                    <CardContent className="pt-6">
                      {/* Quote Icon */}
                      <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10" />

                      {/* Rating */}
                      <div className="flex gap-1 mb-4">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star
                            key={i}
                            className="h-5 w-5 fill-warning text-warning"
                          />
                        ))}
                      </div>

                      {/* Quote */}
                      <p className="text-body text-foreground-muted mb-6 leading-relaxed">
                        &ldquo;{testimonial.quote}&rdquo;
                      </p>

                      {/* Author */}
                      <div className="flex items-center gap-3">
                        {testimonial.avatarUrl && (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden">
                            <Image
                              src={testimonial.avatarUrl}
                              alt={testimonial.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <p className="text-body font-semibold text-foreground">
                              {testimonial.name}
                            </p>
                            {testimonial.verifiedCustomer && (
                              <BadgeCheck className="h-4 w-4 text-accent" />
                            )}
                          </div>
                          <p className="text-small text-foreground-muted">
                            {testimonial.location}
                          </p>
                          {testimonial.planName && (
                            <p className="text-caption text-primary mt-0.5">
                              {testimonial.planName} subscriber
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </CarouselItem>
            ))}
          </Carousel>
        </div>

        {/* Trust Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-h2 font-heading font-bold text-primary">
              <AnimatedStat value="4.8★" />
            </p>
            <p className="text-small text-foreground-muted mt-1">Average Rating</p>
          </div>
          <div>
            <p className="text-h2 font-heading font-bold text-primary">
              <AnimatedStat value="50000+" />
            </p>
            <p className="text-small text-foreground-muted mt-1">Happy Customers</p>
          </div>
          <div>
            <p className="text-h2 font-heading font-bold text-primary">
              <AnimatedStat value="100+" />
            </p>
            <p className="text-small text-foreground-muted mt-1">Cities Served</p>
          </div>
          <div>
            <p className="text-h2 font-heading font-bold text-primary">
              <AnimatedStat value="98%" />
            </p>
            <p className="text-small text-foreground-muted mt-1">Renewal Rate</p>
          </div>
        </div>
      </div>
    </section>
  );
}
