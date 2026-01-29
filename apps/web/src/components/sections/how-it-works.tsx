import Image from "next/image";
import Link from "next/link";
import { MapPin, ListChecks, Droplets, ArrowRight } from "lucide-react";
import { howItWorksSteps } from "@/data/content";

const iconMap: Record<string, React.ElementType> = {
  "map-pin": MapPin,
  "list-checks": ListChecks,
  "droplets": Droplets,
};

export function HowItWorksSection() {
  return (
    <section className="py-18 lg:py-24 bg-surface">
      <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
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

        {/* Steps */}
        <div className="mt-16 space-y-16 lg:space-y-24">
          {howItWorksSteps.map((step, index) => {
            const IconComponent = iconMap[step.icon] || MapPin;
            const isEven = index % 2 === 1;

            return (
              <div
                key={step.step}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
                  isEven ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Image */}
                <div className={`relative ${isEven ? "lg:order-2" : ""}`}>
                  <div className="relative aspect-[4/3] rounded-card overflow-hidden shadow-lg">
                    <Image
                      src={step.image}
                      alt={step.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {/* Step Badge */}
                  <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                    <span className="text-h3 font-heading font-bold">{step.step}</span>
                  </div>
                </div>

                {/* Content */}
                <div className={isEven ? "lg:order-1" : ""}>
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                    <IconComponent className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-h3 font-heading font-bold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-body-lg text-foreground-muted leading-relaxed">
                    {step.description}
                  </p>

                  {/* Step-specific CTA */}
                  {step.step === 1 && (
                    <Link
                      href="/check-availability"
                      className="inline-flex items-center justify-center mt-6 px-6 py-3 bg-primary text-white font-semibold rounded-btn hover:bg-primary/90 transition-colors"
                    >
                      Check Your Pincode
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  )}
                  {step.step === 2 && (
                    <Link
                      href="/plans"
                      className="inline-flex items-center justify-center mt-6 px-6 py-3 border border-primary text-primary font-semibold rounded-btn hover:bg-primary/5 transition-colors"
                    >
                      Browse Plans
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <p className="text-body-lg text-foreground-muted mb-4">
            Ready to get started? It takes less than 2 minutes.
          </p>
          <Link
            href="/check-availability"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white font-semibold rounded-btn hover:bg-primary/90 transition-colors text-body-lg"
          >
            Check Availability Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
