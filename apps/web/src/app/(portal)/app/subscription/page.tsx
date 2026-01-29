"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Droplets,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Shield,
  Wrench,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Skeleton } from "@/components/ui";
import { track } from "@/utils/analytics";
import { useCancelSubscription, useSubscription, useUpgradeSubscription } from "@/hooks/use-subscription";

// Mock subscription data - will be replaced with API
const subscription = {
  id: "sub_123",
  plan: {
    id: "advanced-ro-uv",
    name: "Advanced RO+UV",
    monthlyPrice: 549,
    features: [
      "7-stage RO+UV purification",
      "10L storage tank",
      "Monthly maintenance",
      "Filter replacement included",
      "TDS controller",
      "24/7 priority support",
    ],
  },
  status: "active" as const,
  startDate: "2024-01-10",
  nextBillingDate: "2024-02-15",
  lockInEndsAt: "2024-07-10",
  device: {
    serialNumber: "ASH-2024-00123",
    model: "Aqua Pro 7000",
    installedDate: "2024-01-10",
  },
  address: {
    line1: "123, Green Valley Apartments",
    line2: "HSR Layout, Sector 2",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560102",
  },
};

const prepaidOptions = [
  { months: 3, discount: 5, savings: 82 },
  { months: 6, discount: 10, savings: 329 },
  { months: 12, discount: 15, savings: 988 },
];

const inclusions = [
  { icon: Wrench, title: "Free Maintenance", desc: "Monthly preventive visits" },
  { icon: Filter, title: "Filter Replacement", desc: "All filters included" },
  { icon: RefreshCw, title: "Free Repairs", desc: "No repair charges ever" },
  { icon: Shield, title: "Service Guarantee", desc: "48-hour resolution" },
];

export default function SubscriptionPage() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const subscriptionQuery = useSubscription();
  const upgradeMutation = useUpgradeSubscription();
  const cancelMutation = useCancelSubscription();

  const apiSubscription = subscriptionQuery.data;

  const subscriptionForUi = apiSubscription ?? subscription;
  const planForUi = apiSubscription?.plan ?? subscription.plan;
  const addressForUi = apiSubscription?.address ?? subscription.address;
  const deviceForUi = apiSubscription?.device ?? subscription.device;

  const lockInEndsAt = apiSubscription
    ? (() => {
        const base = new Date(apiSubscription.startDate);
        const months = apiSubscription.plan?.lockInMonths ?? 0;
        if (!Number.isFinite(months) || months <= 0) return apiSubscription.startDate;
        base.setMonth(base.getMonth() + months);
        return base.toISOString();
      })()
    : subscription.lockInEndsAt;

  const handleUpgradeClick = () => {
    track("subscription_viewed", {});
    setShowUpgradeModal(true);
  };

  const handleQuickUpgrade = async () => {
    track("plan_selected", { source: "portal_upgrade" });
    try {
      await upgradeMutation.mutateAsync({ planId: "premium-copper" });
      setShowUpgradeModal(false);
    } catch {}
  };

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync({ reason: "User requested cancellation from portal" });
    } catch {}
  };

  const daysUntilBilling = Math.ceil(
    (new Date(subscriptionForUi.nextBillingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      {/* Subscription Status Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Droplets className="h-8 w-8 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-h3 font-heading font-bold text-foreground">
                    {subscriptionQuery.isLoading ? (
                      <Skeleton className="h-8 w-56" />
                    ) : (
                      planForUi.name
                    )}
                  </h2>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="text-body text-foreground-muted mt-1">
                  Device: {deviceForUi.model} ({deviceForUi.serialNumber})
                </p>
                <p className="text-small text-foreground-muted mt-1">
                  Installed on {new Date(deviceForUi.installedDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={handleUpgradeClick}>
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
              <Button variant="ghost" className="text-foreground-muted">
                <ArrowDownRight className="h-4 w-4 mr-2" />
                Downgrade
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showUpgradeModal && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-body font-semibold text-foreground">Upgrade Recommendation</p>
                <p className="text-small text-foreground-muted mt-1">
                  Upgrade to Premium Copper+ for copper infusion and VIP support.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>
                  Not now
                </Button>
                <Button onClick={handleQuickUpgrade} isLoading={upgradeMutation.isPending}>
                  Upgrade
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-h4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Next Billing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-h2 font-heading font-bold text-foreground">
                ₹{planForUi.monthlyPrice}
              </span>
              <span className="text-body text-foreground-muted">/month</span>
            </div>
            <p className="text-body text-foreground-muted mt-2">
              Due on{" "}
              <span className="font-medium text-foreground">
                {new Date(subscriptionForUi.nextBillingDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </p>
            <div className="mt-4 flex items-center gap-2 text-small">
              <Clock className="h-4 w-4 text-foreground-muted" />
              <span className="text-foreground-muted">
                {daysUntilBilling} days until next payment
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-h4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              Lock-in Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-body text-foreground-muted">
              Your 6-month lock-in period ends on
            </p>
            <p className="text-h4 font-heading font-bold text-foreground mt-1">
              {new Date(lockInEndsAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="text-small text-foreground-muted mt-3">
              After this date, you can cancel anytime with 30 days notice.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Save with Prepaid */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-h4">💰 Save with Prepaid Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body text-foreground-muted mb-4">
            Switch to a prepaid plan and save up to 15% on your subscription.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {prepaidOptions.map((option) => (
              <div
                key={option.months}
                className="bg-surface rounded-card p-4 border border-border hover:border-primary transition-colors cursor-pointer"
              >
                <p className="text-h4 font-heading font-bold text-foreground">
                  {option.months} Months
                </p>
                <p className="text-small text-foreground-muted mt-1">
                  Save {option.discount}%
                </p>
                <p className="text-body font-semibold text-success mt-2">
                  ₹{option.savings} savings
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Plan Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-h4">What's Included</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {inclusions.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-body font-medium text-foreground">{item.title}</p>
                  <p className="text-small text-foreground-muted">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-small font-medium text-foreground mb-3">Plan Features:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {subscription.plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-small text-foreground-muted">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Installation Address */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-h4">Installation Address</CardTitle>
          <Link
            href="/app/relocation"
            className="text-small text-primary font-medium hover:underline"
          >
            Request Relocation
          </Link>
        </CardHeader>
        <CardContent>
          <p className="text-body text-foreground">
            {addressForUi.line1}
            {addressForUi.line2 && <>, {addressForUi.line2}</>}
          </p>
          <p className="text-body text-foreground-muted">
            {addressForUi.city}, {addressForUi.state} - {addressForUi.pincode}
          </p>
        </CardContent>
      </Card>

      {/* Cancel Subscription */}
      <Card className="border-error/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-body font-medium text-foreground">Cancel Subscription</p>
                <p className="text-small text-foreground-muted">
                  You can cancel after the lock-in period with 30 days notice.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="text-error hover:text-error hover:bg-error/10"
              onClick={handleCancel}
              isLoading={cancelMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
