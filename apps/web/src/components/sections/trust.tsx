import { Shield, Clock, Users, RefreshCw, Award, Heart } from "lucide-react";
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
    <section className="py-18 lg:py-24 bg-surface">
      <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block text-accent font-semibold text-small uppercase tracking-wider mb-2">
            Why Choose Us
          </span>
          <h2 className="text-h2 font-heading font-bold text-foreground">
            The Ashva Experts Service Promise
          </h2>
          <p className="mt-4 text-body-lg text-foreground-muted">
            We don't just install water purifiers—we deliver peace of mind with
            industry-leading service guarantees that put your family's health first.
          </p>
        </div>

        {/* Trust Points Grid */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {trustPoints.map((point) => {
            const IconComponent = iconMap[point.icon] || Shield;
            return (
              <div
                key={point.title}
                className="bg-surface-2 rounded-card p-6 hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 mb-4">
                  <IconComponent className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-h4 font-heading font-semibold text-foreground">
                  {point.title}
                </h3>
                <p className="mt-2 text-body text-foreground-muted leading-relaxed">
                  {point.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA Banner */}
        <div className="mt-16 bg-gradient-to-r from-primary to-accent rounded-card p-8 md:p-12 text-center">
          <h3 className="text-h3 font-heading font-bold text-white">
            Ready to Experience the Difference?
          </h3>
          <p className="mt-2 text-body-lg text-white/90 max-w-xl mx-auto">
            Join 50,000+ families who trust Ashva Experts for their daily drinking water.
          </p>
          <a
            href="/plans"
            className="inline-flex items-center justify-center mt-6 px-8 py-3 bg-white text-primary font-semibold rounded-btn hover:bg-white/90 transition-colors"
          >
            View Our Plans
          </a>
        </div>
      </div>
    </section>
  );
}
