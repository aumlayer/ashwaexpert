"use client";

import { useEffect, useMemo, useState } from "react";
import { User, Phone, Mail, MapPin, Bell, Shield, Save } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Skeleton, EmptyState } from "@/components/ui";
import { useSubscriberMe, useUpdateSubscriberMe } from "@/hooks/use-api";
import { track } from "@/utils/analytics";
import { siteConfig } from "@/data/content";

export default function ProfilePage() {
  const subscriberMeQuery = useSubscriberMe();
  const updateSubscriberMe = useUpdateSubscriberMe();

  const [isEditing, setIsEditing] = useState(false);

  const subscriber = subscriberMeQuery.data;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const displayName = useMemo(() => {
    const full = `${formData.firstName} ${formData.lastName}`.trim();
    return full || "Profile";
  }, [formData.firstName, formData.lastName]);

  useEffect(() => {
    if (!subscriber) return;
    setFormData({
      firstName: subscriber.first_name || "",
      lastName: subscriber.last_name || "",
      email: subscriber.email || "",
      phone: (subscriber.phone || "").replace(/^\+?91/, "").trim(),
    });
  }, [subscriber]);

  const handleSave = async () => {
    track("profile_updated", {});
    await updateSubscriberMe.mutateAsync({
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone: formData.phone ? `+91${formData.phone}` : undefined,
    });
    setIsEditing(false);
  };

  if (subscriberMeQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-56" />
              </div>
              <Skeleton className="h-11 w-40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-56" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (subscriberMeQuery.isError || !subscriber) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={User}
            title="Profile not available"
            message="We couldn't load your profile right now. Please retry or chat with support."
            primaryCta={{ label: "Retry", onClick: () => subscriberMeQuery.refetch() }}
            secondaryCta={{
              label: "Chat on WhatsApp",
              href: `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
                "Hi Ashva Experts! I can't load my profile in the portal. Please help."
              )}`,
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-10 w-10 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-h3 font-heading font-bold text-foreground">
                {displayName}
              </h2>
              <p className="text-body text-foreground-muted">
                Customer since January 2024
              </p>
            </div>
            <Button
              variant={isEditing ? "primary" : "outline"}
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              isLoading={updateSubscriberMe.isPending}
            >
              {isEditing ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              ) : (
                "Edit Profile"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-h4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-small font-medium text-foreground mb-1.5">
                Full Name
              </label>
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                  <Input
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              ) : (
                <p className="text-body text-foreground py-3">{displayName}</p>
              )}
            </div>

            <div>
              <label className="block text-small font-medium text-foreground mb-1.5">
                Phone Number
              </label>
              {isEditing ? (
                <Input
                  label="Phone"
                  inputMode="numeric"
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
                />
              ) : (
                <div className="flex items-center gap-2 py-3">
                  <Phone className="h-4 w-4 text-foreground-muted" />
                  <p className="text-body text-foreground">{formData.phone ? `+91 ${formData.phone}` : "—"}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-small font-medium text-foreground mb-1.5">
                Email Address
              </label>
              <div className="flex items-center gap-2 py-3">
                <Mail className="h-4 w-4 text-foreground-muted" />
                <p className="text-body text-foreground">{formData.email || "—"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="text-h4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Installation Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body text-foreground">
            Your installation address is used from your latest checkout and service requests.
          </p>
          <p className="text-small text-foreground-muted mt-1">
            If you need to update your address, please chat with support.
          </p>
          <a
            className="inline-flex mt-4 text-small font-medium text-primary hover:underline"
            href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
              "Hi Ashva Experts! I want to update my installation address."
            )}`}
            target="_blank"
            rel="noreferrer"
          >
            Chat on WhatsApp
          </a>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-h4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body text-foreground">
            Notification preferences will be available soon.
          </p>
          <p className="text-small text-foreground-muted mt-1">
            For urgent changes, please contact support.
          </p>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-h4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body font-medium text-foreground">Two-Factor Authentication</p>
              <p className="text-small text-foreground-muted">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant="outline">Enable</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
