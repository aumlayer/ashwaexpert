import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Droplets,
  Shield,
  Clock,
  Phone,
  CheckCircle2,
  Star,
  Users,
  ArrowRight,
} from "lucide-react";
import { siteConfig } from "@/data/content";

// City data - would come from CMS/API in production
export const cityData: Record<string, {
  name: string;
  state: string;
  heroImage: string;
  waterQuality: {
    tds: string;
    hardness: string;
    issues: string[];
  };
  stats: {
    customers: number;
    installations: number;
    rating: number;
  };
  areas: string[];
  testimonial: {
    name: string;
    area: string;
    quote: string;
    rating: number;
  };
}> = {
  bangalore: {
    name: "Bangalore",
    state: "Karnataka",
    heroImage: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=1200&h=600&fit=crop",
    waterQuality: {
      tds: "300-800 ppm",
      hardness: "High",
      issues: ["High TDS", "Chlorine taste", "Hard water deposits", "Borewell contamination"],
    },
    stats: {
      customers: 12500,
      installations: 15000,
      rating: 4.8,
    },
    areas: ["HSR Layout", "Whitefield", "Koramangala", "Indiranagar", "Electronic City", "Marathahalli", "JP Nagar", "Bannerghatta Road"],
    testimonial: {
      name: "Priya Sharma",
      area: "HSR Layout",
      quote: "The water quality in HSR was terrible. After installing Ashva's RO, we can finally drink water without worrying. The service is excellent!",
      rating: 5,
    },
  },
  hyderabad: {
    name: "Hyderabad",
    state: "Telangana",
    heroImage: "https://images.unsplash.com/photo-1572445271230-a78b5944a659?w=1200&h=600&fit=crop",
    waterQuality: {
      tds: "400-1000 ppm",
      hardness: "Very High",
      issues: ["Very high TDS", "Fluoride content", "Hard water", "Bacterial contamination"],
    },
    stats: {
      customers: 8500,
      installations: 10000,
      rating: 4.7,
    },
    areas: ["Gachibowli", "HITEC City", "Madhapur", "Kondapur", "Kukatpally", "Banjara Hills", "Jubilee Hills", "Secunderabad"],
    testimonial: {
      name: "Rajesh Kumar",
      area: "Gachibowli",
      quote: "Hyderabad's water has very high TDS. Ashva Experts solved our water problems completely. Highly recommended!",
      rating: 5,
    },
  },
  mumbai: {
    name: "Mumbai",
    state: "Maharashtra",
    heroImage: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1200&h=600&fit=crop",
    waterQuality: {
      tds: "100-400 ppm",
      hardness: "Moderate",
      issues: ["Pipeline contamination", "Chlorine", "Seasonal quality variation", "Old infrastructure"],
    },
    stats: {
      customers: 6200,
      installations: 7500,
      rating: 4.8,
    },
    areas: ["Andheri", "Bandra", "Powai", "Thane", "Navi Mumbai", "Goregaon", "Malad", "Borivali"],
    testimonial: {
      name: "Anita Patel",
      area: "Powai",
      quote: "Even though Mumbai water is relatively better, the old pipelines in our building caused issues. Ashva's purifier gives us peace of mind.",
      rating: 5,
    },
  },
  chennai: {
    name: "Chennai",
    state: "Tamil Nadu",
    heroImage: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200&h=600&fit=crop",
    waterQuality: {
      tds: "500-1500 ppm",
      hardness: "Very High",
      issues: ["Extremely high TDS", "Salinity", "Hard water", "Groundwater depletion"],
    },
    stats: {
      customers: 5800,
      installations: 7000,
      rating: 4.7,
    },
    areas: ["OMR", "Velachery", "Adyar", "T Nagar", "Anna Nagar", "Porur", "Tambaram", "Sholinganallur"],
    testimonial: {
      name: "Meera Krishnan",
      area: "OMR",
      quote: "Chennai's water is notoriously hard. Ashva's copper purifier not only purifies but adds health benefits. Best decision ever!",
      rating: 5,
    },
  },
  delhi: {
    name: "Delhi NCR",
    state: "Delhi",
    heroImage: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1200&h=600&fit=crop",
    waterQuality: {
      tds: "300-900 ppm",
      hardness: "High",
      issues: ["High TDS", "Heavy metals", "Seasonal contamination", "Industrial pollution"],
    },
    stats: {
      customers: 4500,
      installations: 5500,
      rating: 4.6,
    },
    areas: ["Gurgaon", "Noida", "Greater Noida", "Dwarka", "Rohini", "Faridabad", "Ghaziabad", "South Delhi"],
    testimonial: {
      name: "Vikram Singh",
      area: "Gurgaon",
      quote: "Water quality in Gurgaon varies a lot. Ashva's TDS controller ensures we always get the right mineral balance.",
      rating: 5,
    },
  },
};

export async function generateStaticParams() {
  return Object.keys(cityData).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const city = cityData[params.slug];
  if (!city) {
    return { title: "City Not Found" };
  }

  return {
    title: `Water Purifier Subscription in ${city.name} | Ashva Experts`,
    description: `Get the best RO water purifier on subscription in ${city.name}. Starting at ₹399/month. Free installation, maintenance included. ${city.stats.customers.toLocaleString()}+ happy customers.`,
    alternates: {
      canonical: `/city/${params.slug}`,
    },
    openGraph: {
      title: `Water Purifier Subscription in ${city.name}`,
      description: `Pure water for ${city.name} homes. ${city.waterQuality.tds} TDS water? We've got you covered.`,
      images: [city.heroImage],
    },
  };
}

export default function CityPage({ params }: { params: { slug: string } }) {
  const city = cityData[params.slug];

  if (!city) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-h2 font-heading font-bold">City Not Found</h1>
          <p className="text-body text-foreground-muted mt-2">
            We don't have information for this city yet.
          </p>
          <Link href="/plans" className="text-primary hover:underline mt-4 inline-block">
            View our plans →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
        {/* Hero Section */}
        <section className="relative min-h-[60vh] flex items-center">
          <div className="absolute inset-0">
            <Image
              src={city.heroImage}
              alt={city.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 to-foreground/50" />
          </div>

          <div className="relative z-10 container-custom py-20">
            <div className="max-w-2xl text-white">
              <div className="flex items-center gap-2 text-white/80 mb-4">
                <MapPin className="h-5 w-5" />
                <span className="text-body">{city.name}, {city.state}</span>
              </div>

              <h1 className="text-h1 font-heading font-bold leading-tight">
                Water Purifier Subscription in {city.name}
              </h1>

              <p className="mt-4 text-body-lg text-white/90">
                {city.name}'s water has {city.waterQuality.tds} TDS. Get pure, healthy water 
                with our subscription plans starting at just ₹399/month.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/plans"
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-btn hover:bg-primary/90 transition-colors"
                >
                  View Plans
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <a
                  href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                  className="inline-flex items-center justify-center px-6 py-3 bg-white/10 text-white font-semibold rounded-btn hover:bg-white/20 transition-colors"
                >
                  <Phone className="mr-2 h-5 w-5" />
                  Call Now
                </a>
              </div>

              {/* Stats */}
              <div className="mt-10 flex flex-wrap gap-8">
                <div>
                  <p className="text-h3 font-heading font-bold">{city.stats.customers.toLocaleString()}+</p>
                  <p className="text-small text-white/70">Happy Customers</p>
                </div>
                <div>
                  <p className="text-h3 font-heading font-bold">{city.stats.installations.toLocaleString()}+</p>
                  <p className="text-small text-white/70">Installations</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  <p className="text-h3 font-heading font-bold">{city.stats.rating}</p>
                  <p className="text-small text-white/70 ml-1">Rating</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Water Quality Section */}
        <section className="py-16 bg-surface">
          <div className="container-custom">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-h2 font-heading font-bold text-foreground">
                Water Quality in {city.name}
              </h2>
              <p className="mt-4 text-body text-foreground-muted">
                Understanding your local water quality helps choose the right purifier
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-surface-2 rounded-card p-6 text-center">
                <Droplets className="h-10 w-10 text-primary mx-auto" />
                <p className="text-h3 font-heading font-bold text-foreground mt-4">
                  {city.waterQuality.tds}
                </p>
                <p className="text-small text-foreground-muted">Average TDS Level</p>
              </div>

              <div className="bg-surface-2 rounded-card p-6 text-center">
                <Shield className="h-10 w-10 text-accent mx-auto" />
                <p className="text-h3 font-heading font-bold text-foreground mt-4">
                  {city.waterQuality.hardness}
                </p>
                <p className="text-small text-foreground-muted">Water Hardness</p>
              </div>

              <div className="bg-surface-2 rounded-card p-6 text-center col-span-1 md:col-span-2">
                <h3 className="text-h4 font-heading font-bold text-foreground mb-4">
                  Common Water Issues
                </h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {city.waterQuality.issues.map((issue) => (
                    <span
                      key={issue}
                      className="px-3 py-1.5 bg-error/10 text-error rounded-btn text-small"
                    >
                      {issue}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Service Areas */}
        <section className="py-16 bg-surface-2">
          <div className="container-custom">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-h2 font-heading font-bold text-foreground">
                We Serve All of {city.name}
              </h2>
              <p className="mt-4 text-body text-foreground-muted">
                Free installation and same-day service in these areas
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {city.areas.map((area) => (
                <div
                  key={area}
                  className="flex items-center gap-2 px-4 py-2 bg-surface rounded-btn border border-border"
                >
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-body text-foreground">{area}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-btn border border-primary/30">
                <span className="text-body text-primary font-medium">+ Many more areas</span>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-16 bg-surface">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto text-center">
              <div className="flex justify-center gap-1 mb-6">
                {[...Array(city.testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                ))}
              </div>

              <blockquote className="text-h4 font-heading text-foreground italic">
                "{city.testimonial.quote}"
              </blockquote>

              <div className="mt-6">
                <p className="text-body font-semibold text-foreground">
                  {city.testimonial.name}
                </p>
                <p className="text-small text-foreground-muted">
                  {city.testimonial.area}, {city.name}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 bg-surface-2">
          <div className="container-custom">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-h2 font-heading font-bold text-foreground">
                Why {city.name} Trusts Ashva Experts
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Clock, title: "48-Hour Installation", desc: "Quick setup in your home" },
                { icon: Shield, title: "Free Maintenance", desc: "Monthly service included" },
                { icon: Droplets, title: "Right for {city.name}", desc: "Purifiers suited for local water" },
                { icon: Users, title: "Local Support", desc: "Dedicated {city.name} team" },
              ].map((item) => (
                <div key={item.title} className="bg-surface rounded-card p-6 text-center">
                  <item.icon className="h-10 w-10 text-primary mx-auto" />
                  <h3 className="text-h4 font-heading font-bold text-foreground mt-4">
                    {item.title.replace("{city.name}", city.name)}
                  </h3>
                  <p className="text-small text-foreground-muted mt-2">
                    {item.desc.replace("{city.name}", city.name)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-r from-primary to-accent">
          <div className="container-custom text-center">
            <h2 className="text-h2 font-heading font-bold text-white">
              Get Pure Water in {city.name} Today
            </h2>
            <p className="mt-4 text-body-lg text-white/90 max-w-2xl mx-auto">
              Join {city.stats.customers.toLocaleString()}+ happy customers in {city.name}. 
              Free installation, maintenance included.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/plans"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary font-semibold rounded-btn hover:bg-white/90 transition-colors"
              >
                View Plans
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <a
                href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-semibold rounded-btn hover:bg-white/20 transition-colors"
              >
                <Phone className="mr-2 h-5 w-5" />
                {siteConfig.phone}
              </a>
            </div>
          </div>
        </section>
    </main>
  );
}
