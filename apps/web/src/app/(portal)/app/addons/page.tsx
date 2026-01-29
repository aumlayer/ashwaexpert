"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Plus, Shield } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, EmptyState, Skeleton } from "@/components/ui";
import { track } from "@/utils/analytics";
import { siteConfig } from "@/data/content";
import { ApiError } from "@/utils/api";
import { useAddons, useAddSubscriptionAddon, useRemoveSubscriptionAddon } from "@/hooks/use-api";
import { useSubscription } from "@/hooks/use-subscription";

export default function AddonsPage() {
  const [selectedAddon, setSelectedAddon] = useState<string | null>(null);
  const [pendingRemoveAddonId, setPendingRemoveAddonId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const subscriptionQuery = useSubscription();
  const subscription = subscriptionQuery.data;

  const addonsQuery = useAddons();
  const addAddonMutation = useAddSubscriptionAddon(subscription?.id);
  const removeAddonMutation = useRemoveSubscriptionAddon(subscription?.id);

  const addonsApiError = addonsQuery.error instanceof ApiError ? addonsQuery.error : null;
  const isNotImplemented = addonsApiError?.status === 404;

  const addons = addonsQuery.data || [];
  const activeAddonIds = new Set((subscription?.addons || []).map((a) => a.id));

  const handleAddAddon = async (addonId: string) => {
    setActionError(null);
    track("addon_added", { addon_id: addonId });
    try {
      await addAddonMutation.mutateAsync({ addonId });
    } catch {
      setActionError("Couldn't add this add-on right now. Please try again, or chat with support.");
    }
  };

  const handleRemoveAddon = async (addonId: string) => {
    setActionError(null);
    try {
      await removeAddonMutation.mutateAsync({ addonId });
      setPendingRemoveAddonId(null);
    } catch {
      setActionError("Couldn't remove this add-on right now. Please try again, or chat with support.");
    }
  };

  const handleViewDetails = (addonId: string) => {
    track("addon_viewed", { addon_id: addonId });
    setSelectedAddon(addonId);
  };

  if (!subscriptionQuery.isLoading && !subscription) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={Shield}
            title="No active subscription"
            message="Add-ons are available after you start a subscription."
            primaryCta={{ label: "View Plans", href: "/plans" }}
            secondaryCta={{
              label: "Chat on WhatsApp",
              href: `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
                "Hi Ashva Experts! I want help choosing a plan and add-ons."
              )}`,
            }}
          />
        </CardContent>
      </Card>
    );
  }

  if (addonsQuery.isError && isNotImplemented) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={Shield}
            title="Add-ons coming soon"
            message="We're rolling out add-ons in your portal soon. Chat with support to add upgrades to your plan." 
            primaryCta={{
              label: "Chat on WhatsApp",
              href: `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
                "Hi Ashva Experts! I want to add an add-on to my subscription."
              )}`,
            }}
            secondaryCta={{ label: "View Plans", href: "/plans" }}
          />
        </CardContent>
      </Card>
    );
  }

  if (addonsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-80 mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-11 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-11 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
      {subscription?.addons && subscription.addons.length > 0 && (
        <Card className="bg-success/5 border-success/20">
          <CardHeader>
            <CardTitle className="text-h4 flex items-center gap-2">
              <Check className="h-5 w-5 text-success" />
              Your Active Add-ons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {subscription.addons.map((addon) => (
                <div
                  key={addon.id}
                  className="flex items-center gap-2 px-4 py-2 bg-surface rounded-btn border border-success/30"
                >
                  <Check className="h-5 w-5 text-success" />
                  <span className="text-body font-medium text-foreground">{addon.name}</span>
                  <span className="text-small text-foreground-muted">₹{addon.monthlyPrice}/mo</span>
                  {pendingRemoveAddonId === addon.id ? (
                    <div className="ml-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleRemoveAddon(addon.id)}
                        isLoading={removeAddonMutation.isPending}
                      >
                        Remove
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setPendingRemoveAddonId(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setPendingRemoveAddonId(addon.id)}>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Add-ons */}
      {actionError ? (
        <Card className="border-error/30 bg-error/5">
          <CardContent className="pt-6">
            <p className="text-small text-error">{actionError}</p>
            <a
              className="inline-flex mt-3 text-small font-medium text-primary hover:underline"
              href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
                "Hi Ashva Experts! I'm facing an issue managing add-ons in the portal."
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              Chat on WhatsApp
            </a>
          </CardContent>
        </Card>
      ) : null}

      {/* Available Add-ons */}
      {addons.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Shield}
              title="No add-ons available"
              message="We don't have add-ons available for your account yet."
              primaryCta={{ label: "Chat on WhatsApp", href: `https://wa.me/${siteConfig.whatsapp}` }}
              secondaryCta={{ label: "View Plans", href: "/plans" }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addons.map((addon) => {
          const isActive = activeAddonIds.has(addon.id);
          return (
            <Card
              key={addon.id}
              className={`relative overflow-hidden ${isActive ? "border-success" : ""}`}
            >
              {(addon.isPopular || addon.badge === "Popular") && !isActive && (
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
                {addon.imageUrl ? (
                  <Image
                    src={addon.imageUrl}
                    alt={addon.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
              </div>

              <CardContent className="pt-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-h4 font-heading font-bold text-foreground">
                      {addon.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-h4 font-heading font-bold text-primary">
                        ₹{addon.monthlyPrice}
                      </span>
                      <span className="text-small text-foreground-muted">/month</span>
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
                    <Button
                      className="flex-1"
                      onClick={() => handleAddAddon(addon.id)}
                      isLoading={addAddonMutation.isPending}
                    >
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
      )}

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
            <Link href="/plans" className="inline-flex">
              <Button>Add Second Purifier</Button>
            </Link>
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
