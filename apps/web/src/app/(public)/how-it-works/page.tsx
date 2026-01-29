import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import type React from "react";
import { ArrowRight, MapPin, ListChecks, Droplets } from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { howItWorksSteps } from "@/data/content";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "See how Ashva Experts water purifier subscription works: check availability, choose a plan, and get installed in 48 hours.",
  alternates: {
    canonical: "/how-it-works",
  },
};

const icons: Record<string, React.ElementType> = {
  "map-pin": MapPin,
  "list-checks": ListChecks,
  droplets: Droplets,
};

export default function HowItWorksPage() {
  return (
    <div className="pt-4">
      <section className="py-16 bg-surface-2">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-h1 font-heading font-bold text-foreground">
              How It Works
            </h1>
            <p className="mt-4 text-body-lg text-foreground-muted">
              Pure water, without the upfront cost. A simple 3-step subscription journey.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-surface">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {howItWorksSteps.map((step) => {
              const Icon = icons[step.icon] || Droplets;
              return (
                <Card key={step.step} className="overflow-hidden">
                  <div className="relative h-48 bg-surface-2">
                    <Image
                      src={step.image}
                      alt={step.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
                    <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                      {step.step}
                    </div>
                  </div>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <h2 className="text-h4 font-heading font-bold text-foreground">
                        {step.title}
                      </h2>
                    </div>
                    <p className="mt-3 text-body text-foreground-muted">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/check-availability"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white font-semibold rounded-btn hover:bg-primary/90 transition-colors"
            >
              Check Availability
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
            <Link
              href="/plans"
              className="inline-flex items-center justify-center px-8 py-4 border border-primary text-primary font-semibold rounded-btn hover:bg-primary/5 transition-colors"
            >
              View Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
