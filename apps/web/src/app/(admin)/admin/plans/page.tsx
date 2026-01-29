"use client";

import { useState } from "react";
import {
  Plus,
  MoreVertical,
  Droplets,
  Check,
  Edit,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button, Badge, Skeleton } from "@/components/ui";
import { usePlans } from "@/hooks/use-api";

type PlanForUi = {
  id: string;
  name: string;
  slug: string;
  monthlyPrice: number;
  originalPrice: number;
  category: string;
  purifierType: string;
  isActive: boolean;
  isPopular: boolean;
  subscriberCount: number;
  features: string[];
  specs: { stages: number; tankCapacity: string; maxTds: number };
};

// Mock data
const plans = [
  {
    id: "basic-ro",
    name: "Basic RO",
    slug: "basic-ro",
    monthlyPrice: 399,
    originalPrice: 499,
    category: "home",
    purifierType: "ro",
    isActive: true,
    isPopular: false,
    subscriberCount: 892,
    features: [
      "5-stage RO purification",
      "8L storage tank",
      "Free installation",
      "Quarterly maintenance",
    ],
    specs: { stages: 5, tankCapacity: "8L", maxTds: 1500 },
  },
  {
    id: "advanced-ro-uv",
    name: "Advanced RO+UV",
    slug: "advanced-ro-uv",
    monthlyPrice: 549,
    originalPrice: 699,
    category: "home",
    purifierType: "ro-uv",
    isActive: true,
    isPopular: true,
    subscriberCount: 1456,
    features: [
      "7-stage RO+UV purification",
      "10L storage tank",
      "Free installation",
      "Monthly maintenance",
      "TDS controller",
    ],
    specs: { stages: 7, tankCapacity: "10L", maxTds: 2000 },
  },
  {
    id: "premium-copper",
    name: "Premium Copper+",
    slug: "premium-copper",
    monthlyPrice: 749,
    originalPrice: 899,
    category: "home",
    purifierType: "ro-uv-copper",
    isActive: true,
    isPopular: false,
    subscriberCount: 654,
    features: [
      "8-stage RO+UV+Copper",
      "12L storage tank",
      "Free installation",
      "Monthly maintenance",
      "TDS controller",
      "Copper infusion",
    ],
    specs: { stages: 8, tankCapacity: "12L", maxTds: 2500 },
  },
  {
    id: "alkaline-pro",
    name: "Alkaline Pro",
    slug: "alkaline-pro",
    monthlyPrice: 649,
    originalPrice: 799,
    category: "home",
    purifierType: "ro-alkaline",
    isActive: false,
    isPopular: false,
    subscriberCount: 234,
    features: [
      "7-stage RO+Alkaline",
      "10L storage tank",
      "Free installation",
      "Monthly maintenance",
      "pH balance (8-9.5)",
    ],
    specs: { stages: 7, tankCapacity: "10L", maxTds: 2000 },
  },
];

export default function PlansPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plansQuery = usePlans();

  const plansForUi: PlanForUi[] = plansQuery.data && plansQuery.data.length > 0
    ? plansQuery.data.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        monthlyPrice: p.monthlyPrice,
        originalPrice: p.originalPrice ?? p.monthlyPrice,
        category: p.category,
        purifierType: p.purifierType,
        isActive: p.isActive,
        isPopular: p.isPopular,
        subscriberCount: 0,
        features: p.features,
        specs: {
          stages: p.specs.stages,
          tankCapacity: p.specs.tankCapacity,
          maxTds: p.specs.maxTds,
        },
      }))
    : plans;

  const totalSubscribers = plansForUi.reduce((sum, p) => sum + (p.subscriberCount || 0), 0);
  const activePlans = plansForUi.filter((p) => p.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h2 font-heading font-bold">Plans & Pricing</h1>
          <p className="text-body text-gray-400">
            Manage subscription plans and pricing
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Plan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1E293B] rounded-lg p-4 border border-[#334155]">
          <p className="text-small text-gray-400">Total Plans</p>
          {plansQuery.isLoading ? (
            <Skeleton className="h-7 w-14 mt-2 bg-white/10" />
          ) : (
            <p className="text-h3 font-heading font-bold mt-2">{plansForUi.length}</p>
          )}
        </div>
        <div className="bg-[#1E293B] rounded-lg p-4 border border-[#334155]">
          <p className="text-small text-gray-400">Active Plans</p>
          {plansQuery.isLoading ? (
            <Skeleton className="h-7 w-14 mt-2 bg-white/10" />
          ) : (
            <p className="text-h3 font-heading font-bold text-green-400 mt-2">{activePlans}</p>
          )}
        </div>
        <div className="bg-[#1E293B] rounded-lg p-4 border border-[#334155]">
          <p className="text-small text-gray-400">Total Subscribers</p>
          {plansQuery.isLoading ? (
            <Skeleton className="h-7 w-28 mt-2 bg-white/10" />
          ) : (
            <p className="text-h3 font-heading font-bold text-primary mt-2">{totalSubscribers.toLocaleString()}</p>
          )}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plansQuery.isLoading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
                <div className="p-4 border-b border-[#334155]">
                  <Skeleton className="h-6 w-40 bg-white/10" />
                  <Skeleton className="h-4 w-24 mt-2 bg-white/10" />
                </div>
                <div className="p-4 border-b border-[#334155]">
                  <Skeleton className="h-8 w-28 bg-white/10" />
                  <Skeleton className="h-4 w-40 mt-2 bg-white/10" />
                </div>
                <div className="p-4 border-b border-[#334155]">
                  <Skeleton className="h-16 w-full bg-white/10" />
                </div>
                <div className="p-4">
                  <Skeleton className="h-9 w-full bg-white/10" />
                </div>
              </div>
            ))
          : plansForUi.map((plan) => (
          <div
            key={plan.id}
            className={`bg-[#1E293B] rounded-xl border ${
              plan.isPopular ? "border-primary" : "border-[#334155]"
            } overflow-hidden`}
          >
            {/* Header */}
            <div className="p-4 border-b border-[#334155]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Droplets className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-body font-semibold">{plan.name}</h3>
                      {plan.isPopular && <Badge variant="accent">Popular</Badge>}
                    </div>
                    <p className="text-caption text-gray-400">{plan.purifierType.toUpperCase()}</p>
                  </div>
                </div>
                <button className="p-2 hover:bg-[#334155] rounded-lg">
                  <MoreVertical className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Pricing */}
            <div className="p-4 border-b border-[#334155]">
              <div className="flex items-baseline gap-2">
                <span className="text-h3 font-heading font-bold">₹{plan.monthlyPrice}</span>
                <span className="text-small text-gray-400">/month</span>
                {plan.originalPrice > plan.monthlyPrice && (
                  <span className="text-small text-gray-500 line-through">₹{plan.originalPrice}</span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-4 text-small text-gray-400">
                <span>{plan.subscriberCount} subscribers</span>
                <span className={plan.isActive ? "text-green-400" : "text-red-400"}>
                  {plan.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {/* Specs */}
            <div className="p-4 border-b border-[#334155]">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-h4 font-heading font-bold">{plan.specs.stages}</p>
                  <p className="text-caption text-gray-400">Stages</p>
                </div>
                <div>
                  <p className="text-h4 font-heading font-bold">{plan.specs.tankCapacity}</p>
                  <p className="text-caption text-gray-400">Tank</p>
                </div>
                <div>
                  <p className="text-h4 font-heading font-bold">{plan.specs.maxTds}</p>
                  <p className="text-caption text-gray-400">Max TDS</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="p-4 border-b border-[#334155]">
              <ul className="space-y-2">
                {plan.features.slice(0, 4).map((feature: string) => (
                  <li key={feature} className="flex items-center gap-2 text-small text-gray-300">
                    <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
                {plan.features.length > 4 && (
                  <li className="text-small text-primary">+{plan.features.length - 4} more</li>
                )}
              </ul>
            </div>

            {/* Actions */}
            <div className="p-4 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 border-[#334155] text-gray-300 hover:bg-[#334155]">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <button className="p-2 rounded-lg border border-[#334155] hover:bg-[#334155]">
                {plan.isActive ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
              <button className="p-2 rounded-lg border border-[#334155] hover:bg-red-500/20 hover:border-red-500/50">
                <Trash2 className="h-4 w-4 text-red-400" />
              </button>
            </div>
          </div>
        ))}

        {/* Add New Plan Card */}
        <div className="bg-[#1E293B] rounded-xl border border-dashed border-[#334155] flex items-center justify-center min-h-[400px] hover:border-primary transition-colors cursor-pointer">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-[#334155] flex items-center justify-center mx-auto mb-3">
              <Plus className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-body font-medium text-gray-400">Add New Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
