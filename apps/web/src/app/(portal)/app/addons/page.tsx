"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Plus, Sparkles, Shield, Droplets, Thermometer } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { track } from "@/utils/analytics";

const addons = [
  {
    id: "copper-cartridge",
    name: "Copper Cartridge",
    description: "Add copper-infused water benefits to your existing purifier. Boosts immunity and aids digestion.",
    price: 149,
    priceType: "month",
    icon: Sparkles,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    benefits: [
      "Antimicrobial properties",
      "Aids digestion",
      "Boosts immunity",
      "Improves skin health",
    ],
    isPopular: true,
  },
  {
    id: "alkaline-filter",
    name: "Alkaline Filter",
    description: "Enhance your water with alkaline minerals for better hydration and pH balance.",
    price: 99,
    priceType: "month",
    icon: Droplets,
    image: "https://images.unsplash.com/photo-1559839914-17aae19cec71?w=400&h=300&fit=crop",
    benefits: [
      "pH balance (8-9.5)",
      "Better hydration",
      "Antioxidant properties",
      "Mineral enrichment",
    ],
    isPopular: false,
  },
  {
    id: "hot-water",
    name: "Hot Water Dispenser",
    description: "Get instant hot water for tea, coffee, and cooking. Temperature adjustable.",
    price: 199,
    priceType: "month",
    icon: Thermometer,
    image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop",
    benefits: [
      "Instant hot water",
      "Temperature control",
      "Energy efficient",
      "Child lock safety",
    ],
    isPopular: false,
  },
  {
    id: "extended-warranty",
    name: "Extended Warranty",
    description: "Extend your device warranty by an additional year with priority support.",
    price: 49,
    priceType: "month",
    icon: Shield,
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop",
    benefits: [
      "Extended coverage",
      "Priority support",
      "Free replacements",
      "No deductibles",
    ],
    isPopular: false,
  },
];

const activeAddons = ["copper-cartridge"];

export default function AddonsPage() {
  const [selectedAddon, setSelectedAddon] = useState<string | null>(null);

  const handleAddAddon = (addonId: string) => {
    track("addon_added", { addon_id: addonId });
    // TODO: Implement add addon API call
    alert(`Adding ${addonId} to your subscription`);
  };

  const handleViewDetails = (addonId: string) => {
    track("addon_viewed", { addon_id: addonId });
    setSelectedAddon(addonId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-h3 font-heading font-bold text-foreground">
          Enhance Your Experience
        </h1>
        <p className="text-body text-foreground-muted mt-1">
          Add premium features to your water purifier subscription
        </p>
      </div>

      {/* Active Add-ons */}
      {activeAddons.length > 0 && (
        <Card className="bg-success/5 border-success/20">
          <CardHeader>
            <CardTitle className="text-h4 flex items-center gap-2">
              <Check className="h-5 w-5 text-success" />
              Your Active Add-ons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {activeAddons.map((addonId) => {
                const addon = addons.find((a) => a.id === addonId);
                if (!addon) return null;
                return (
                  <div
                    key={addonId}
                    className="flex items-center gap-2 px-4 py-2 bg-surface rounded-btn border border-success/30"
                  >
                    <addon.icon className="h-5 w-5 text-success" />
                    <span className="text-body font-medium text-foreground">{addon.name}</span>
                    <span className="text-small text-foreground-muted">₹{addon.price}/mo</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Add-ons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addons.map((addon) => {
          const isActive = activeAddons.includes(addon.id);
          return (
            <Card
              key={addon.id}
              className={`relative overflow-hidden ${isActive ? "border-success" : ""}`}
            >
              {addon.isPopular && !isActive && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge variant="accent">Popular</Badge>
                </div>
              )}
              {isActive && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge variant="success">Active</Badge>
                </div>
              )}

              {/* Image */}
              <div className="relative h-40 bg-surface-2">
                <Image
                  src={addon.image}
                  alt={addon.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
              </div>

              <CardContent className="pt-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <addon.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-h4 font-heading font-bold text-foreground">
                      {addon.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-h4 font-heading font-bold text-primary">
                        ₹{addon.price}
                      </span>
                      <span className="text-small text-foreground-muted">/{addon.priceType}</span>
                    </div>
                  </div>
                </div>

                <p className="text-body text-foreground-muted mb-4">{addon.description}</p>

                {/* Benefits */}
                <ul className="space-y-2 mb-4">
                  {addon.benefits.slice(0, 3).map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2 text-small text-foreground-muted">
                      <Check className="h-4 w-4 text-success flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>

                {/* Actions */}
                {isActive ? (
                  <Button variant="outline" className="w-full" disabled>
                    <Check className="h-4 w-4 mr-2" />
                    Already Added
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => handleAddAddon(addon.id)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Plan
                    </Button>
                    <Button variant="outline" onClick={() => handleViewDetails(addon.id)}>
                      Details
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Second Purifier Promo */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-h4 font-heading font-bold text-foreground">
                🏠 Need a Second Purifier?
              </h3>
              <p className="text-body text-foreground-muted mt-1">
                Get 20% off on a second purifier for your bedroom, office, or another location.
              </p>
            </div>
            <Button>
              Add Second Purifier
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prepaid Savings */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-h4 font-heading font-bold text-foreground">
                💰 Save with Prepaid
              </h3>
              <p className="text-body text-foreground-muted mt-1">
                Switch to annual prepaid and save up to 15% on your total subscription including add-ons.
              </p>
            </div>
            <Button variant="outline">
              View Prepaid Options
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
