"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Droplets,
  Shield,
  Sparkles,
  Zap,
  Check,
  ArrowRight,
  Filter,
} from "lucide-react";
import { Button, Card, CardContent, Badge } from "@/components/ui";

const categories = [
  { id: "all", label: "All Purifiers" },
  { id: "ro", label: "RO" },
  { id: "ro-uv", label: "RO + UV" },
  { id: "copper", label: "Copper" },
  { id: "alkaline", label: "Alkaline" },
];

const purifiers = [
  {
    id: "basic-ro",
    name: "Basic RO",
    category: "ro",
    image: "https://images.unsplash.com/photo-1624958723474-c8fd46a9b9c5?w=400&h=400&fit=crop",
    monthlyPrice: 399,
    bestFor: "Municipal Water",
    features: ["5-stage RO", "8L tank", "LED indicator"],
    specs: { stages: 5, tank: "8L", maxTds: 1500 },
    badge: null,
  },
  {
    id: "advanced-ro-uv",
    name: "Advanced RO+UV",
    category: "ro-uv",
    image: "https://images.unsplash.com/photo-1624958723474-c8fd46a9b9c5?w=400&h=400&fit=crop",
    monthlyPrice: 549,
    bestFor: "Borewell Water",
    features: ["7-stage RO+UV", "10L tank", "TDS controller", "Smart alerts"],
    specs: { stages: 7, tank: "10L", maxTds: 2000 },
    badge: "Most Popular",
  },
  {
    id: "premium-copper",
    name: "Premium Copper+",
    category: "copper",
    image: "https://images.unsplash.com/photo-1624958723474-c8fd46a9b9c5?w=400&h=400&fit=crop",
    monthlyPrice: 749,
    bestFor: "Health Conscious",
    features: ["8-stage RO+UV+Copper", "12L tank", "Copper infusion", "Mineral boost"],
    specs: { stages: 8, tank: "12L", maxTds: 2500 },
    badge: "Best Value",
  },
  {
    id: "alkaline-pro",
    name: "Alkaline Pro",
    category: "alkaline",
    image: "https://images.unsplash.com/photo-1624958723474-c8fd46a9b9c5?w=400&h=400&fit=crop",
    monthlyPrice: 649,
    bestFor: "Wellness Focus",
    features: ["7-stage RO+Alkaline", "10L tank", "pH 8-9.5", "Antioxidant rich"],
    specs: { stages: 7, tank: "10L", maxTds: 2000 },
    badge: null,
  },
];

export default function PurifiersPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredPurifiers = purifiers.filter(
    (p) => selectedCategory === "all" || p.category === selectedCategory
  );

  return (
    <main>
      {/* Hero */}
      <section className="py-16 bg-gradient-to-br from-primary via-accent to-mint">
        <div className="container-custom text-center text-white">
          <h1 className="text-h1 font-heading font-bold">
            Our Water Purifiers
          </h1>
          <p className="mt-4 text-body-lg text-white/90 max-w-2xl mx-auto">
            Premium purifiers designed for Indian water conditions. 
            All available on subscription with free installation and maintenance.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-surface border-b border-border sticky top-16 z-20">
        <div className="container-custom">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-btn text-small font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-primary text-white"
                    : "bg-surface-2 text-foreground-muted hover:text-foreground border border-border"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Purifier Grid */}
      <section className="py-16 bg-surface-2">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPurifiers.map((purifier) => (
              <Card key={purifier.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Image */}
                <div className="relative h-48 bg-surface">
                  <Image
                    src={purifier.image}
                    alt={purifier.name}
                    fill
                    className="object-contain p-4"
                  />
                  {purifier.badge && (
                    <Badge
                      variant={purifier.badge === "Most Popular" ? "accent" : "default"}
                      className="absolute top-4 right-4"
                    >
                      {purifier.badge}
                    </Badge>
                  )}
                </div>

                <CardContent className="pt-4">
                  {/* Header */}
                  <div className="mb-4">
                    <p className="text-caption text-primary font-medium uppercase tracking-wide">
                      Best for {purifier.bestFor}
                    </p>
                    <h3 className="text-h4 font-heading font-bold text-foreground mt-1">
                      {purifier.name}
                    </h3>
                  </div>

                  {/* Specs */}
                  <div className="flex gap-4 mb-4 text-center">
                    <div className="flex-1 p-2 bg-surface-2 rounded-btn">
                      <p className="text-h4 font-heading font-bold text-foreground">
                        {purifier.specs.stages}
                      </p>
                      <p className="text-caption text-foreground-muted">Stages</p>
                    </div>
                    <div className="flex-1 p-2 bg-surface-2 rounded-btn">
                      <p className="text-h4 font-heading font-bold text-foreground">
                        {purifier.specs.tank}
                      </p>
                      <p className="text-caption text-foreground-muted">Tank</p>
                    </div>
                    <div className="flex-1 p-2 bg-surface-2 rounded-btn">
                      <p className="text-h4 font-heading font-bold text-foreground">
                        {purifier.specs.maxTds}
                      </p>
                      <p className="text-caption text-foreground-muted">Max TDS</p>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-6">
                    {purifier.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-small text-foreground-muted">
                        <Check className="h-4 w-4 text-success flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <p className="text-h3 font-heading font-bold text-primary">
                        ₹{purifier.monthlyPrice}
                      </p>
                      <p className="text-caption text-foreground-muted">/month</p>
                    </div>
                    <Link
                      href={`/checkout?plan=${purifier.id}`}
                      className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white font-semibold rounded-btn hover:bg-primary/90 transition-colors text-small"
                    >
                      Subscribe
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-surface">
        <div className="container-custom text-center">
          <h2 className="text-h2 font-heading font-bold text-foreground">
            Not Sure Which One to Choose?
          </h2>
          <p className="mt-4 text-body text-foreground-muted max-w-xl mx-auto">
            Take our quick quiz and we'll recommend the perfect purifier for your water type and family size.
          </p>
          <Link
            href="/recommend"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white font-semibold rounded-btn hover:bg-primary/90 transition-colors mt-8"
          >
            Get Personalized Recommendation
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
