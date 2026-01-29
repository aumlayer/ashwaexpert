"use client";

import { useState } from "react";
import { User, Phone, Mail, MapPin, Bell, Shield, Save } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { track } from "@/utils/analytics";

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "John Doe",
    email: user?.email || "john@example.com",
    phone: user?.phone || "9876543210",
    address: {
      line1: "123, Green Valley Apartments",
      line2: "HSR Layout, Sector 2",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560102",
    },
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: true,
    whatsappNotifications: true,
    marketingEmails: false,
  });

  const handleSave = async () => {
    setIsSaving(true);
    track("profile_updated", {});
    // TODO: Call API to update profile
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setIsEditing(false);
  };

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
                {formData.name}
              </h2>
              <p className="text-body text-foreground-muted">
                Customer since January 2024
              </p>
            </div>
            <Button
              variant={isEditing ? "primary" : "outline"}
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              isLoading={isSaving}
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
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-btn border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-body"
                />
              ) : (
                <p className="text-body text-foreground py-3">{formData.name}</p>
              )}
            </div>

            <div>
              <label className="block text-small font-medium text-foreground mb-1.5">
                Phone Number
              </label>
              <div className="flex items-center gap-2 py-3">
                <Phone className="h-4 w-4 text-foreground-muted" />
                <p className="text-body text-foreground">+91 {formData.phone}</p>
                <span className="text-caption text-success bg-success/10 px-2 py-0.5 rounded">
                  Verified
                </span>
              </div>
            </div>

            <div>
              <label className="block text-small font-medium text-foreground mb-1.5">
                Email Address
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-btn border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-body"
                />
              ) : (
                <div className="flex items-center gap-2 py-3">
                  <Mail className="h-4 w-4 text-foreground-muted" />
                  <p className="text-body text-foreground">{formData.email}</p>
                </div>
              )}
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
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-small font-medium text-foreground mb-1.5">
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={formData.address.line1}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, line1: e.target.value },
                    })
                  }
                  className="w-full px-4 py-3 rounded-btn border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-body"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-small font-medium text-foreground mb-1.5">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={formData.address.line2}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, line2: e.target.value },
                    })
                  }
                  className="w-full px-4 py-3 rounded-btn border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-body"
                />
              </div>
              <div>
                <label className="block text-small font-medium text-foreground mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value },
                    })
                  }
                  className="w-full px-4 py-3 rounded-btn border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-body"
                />
              </div>
              <div>
                <label className="block text-small font-medium text-foreground mb-1.5">
                  Pincode
                </label>
                <input
                  type="text"
                  value={formData.address.pincode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, pincode: e.target.value },
                    })
                  }
                  className="w-full px-4 py-3 rounded-btn border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-body"
                />
              </div>
            </div>
          ) : (
            <div>
              <p className="text-body text-foreground">
                {formData.address.line1}
                {formData.address.line2 && <>, {formData.address.line2}</>}
              </p>
              <p className="text-body text-foreground-muted">
                {formData.address.city}, {formData.address.state} - {formData.address.pincode}
              </p>
            </div>
          )}
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
          <div className="space-y-4">
            {[
              { key: "emailNotifications", label: "Email Notifications", desc: "Receive updates via email" },
              { key: "smsNotifications", label: "SMS Notifications", desc: "Receive updates via SMS" },
              { key: "whatsappNotifications", label: "WhatsApp Notifications", desc: "Receive updates on WhatsApp" },
              { key: "marketingEmails", label: "Marketing Emails", desc: "Receive offers and promotions" },
            ].map((pref) => (
              <div key={pref.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-body font-medium text-foreground">{pref.label}</p>
                  <p className="text-small text-foreground-muted">{pref.desc}</p>
                </div>
                <button
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      [pref.key]: !preferences[pref.key as keyof typeof preferences],
                    })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    preferences[pref.key as keyof typeof preferences]
                      ? "bg-primary"
                      : "bg-foreground-muted/30"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      preferences[pref.key as keyof typeof preferences]
                        ? "translate-x-7"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
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
