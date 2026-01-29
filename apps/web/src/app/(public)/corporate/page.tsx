"use client";

import { useState } from "react";
import type React from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Shield,
  FileText,
  CheckCircle2,
  Phone,
  Mail,
  ArrowRight,
} from "lucide-react";
import { Button, Card, CardContent, Input } from "@/components/ui";
import { track } from "@/utils/analytics";
import { siteConfig } from "@/data/content";
import { useCreateLead } from "@/hooks/use-api";

const benefits = [
  {
    icon: Building2,
    title: "Bulk Pricing",
    desc: "Special rates for 5+ units with volume discounts up to 25%",
  },
  {
    icon: Shield,
    title: "Dedicated SLA",
    desc: "Priority support with 2-hour response time guarantee",
  },
  {
    icon: FileText,
    title: "Centralized Billing",
    desc: "Single invoice for all units with GST compliance",
  },
  {
    icon: Users,
    title: "Account Manager",
    desc: "Dedicated point of contact for all your needs",
  },
];

const useCases = [
  {
    title: "Apartment Complexes",
    desc: "Serve all residents with centralized management and billing",
    units: "50-500+ units",
  },
  {
    title: "Corporate Offices",
    desc: "Ensure employee wellness with pure drinking water",
    units: "10-100+ units",
  },
  {
    title: "Co-working Spaces",
    desc: "Flexible plans that scale with your membership",
    units: "5-50 units",
  },
  {
    title: "Hotels & Hospitality",
    desc: "Premium water quality for guest satisfaction",
    units: "20-200+ units",
  },
];

export default function CorporatePage() {
  const createLeadMutation = useCreateLead();
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    unitCount: "",
    locations: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    track("corporate_inquiry_submitted", { units: formData.unitCount });
    
    const pincodeMatch = formData.locations.match(/\b\d{6}\b/);
    const pincode = pincodeMatch ? pincodeMatch[0] : "000000";

    try {
      await createLeadMutation.mutateAsync({
        name: formData.contactName || undefined,
        phone: formData.phone.replace(/\D/g, ""),
        email: formData.email || undefined,
        pincode,
        source: "corporate",
        message: `Corporate inquiry. company=${formData.companyName}; units=${formData.unitCount}; locations=${formData.locations}; message=${formData.message}`,
      });
      setSubmitted(true);
    } catch {
      setSubmitError("Couldn't submit your request right now. Please call or WhatsApp us.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-primary via-accent to-mint">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-btn mb-6">
                <Building2 className="h-5 w-5" />
                <span className="text-small font-medium">Enterprise Solutions</span>
              </div>
              <h1 className="text-h1 font-heading font-bold">
                Water Solutions for Businesses
              </h1>
              <p className="mt-4 text-body-lg text-white/90">
                Bulk pricing, dedicated support, and centralized management for 
                apartments, offices, and commercial spaces.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#inquiry-form"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary font-semibold rounded-btn hover:bg-white/90 transition-colors"
                >
                  Request Proposal
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
                <a
                  href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                  className="inline-flex items-center justify-center px-6 py-3 bg-white/10 text-white font-semibold rounded-btn hover:bg-white/20 transition-colors"
                >
                  <Phone className="mr-2 h-5 w-5" />
                  {siteConfig.phone}
                </a>
              </div>
              <div className="mt-10 grid grid-cols-2 gap-4">
                {[
                  { value: "2hr", label: "Response SLA" },
                  { value: "99.9%", label: "Uptime" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-card p-6 text-center text-white">
                    <p className="text-h2 font-heading font-bold">{stat.value}</p>
                    <p className="text-small text-white/80">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* Benefits */}
        <section className="py-16 bg-surface">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-h2 font-heading font-bold text-foreground">
                Why Businesses Choose Us
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((item) => (
                <Card key={item.title}>
                  <CardContent className="pt-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <item.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-h4 font-heading font-bold text-foreground mt-4">
                      {item.title}
                    </h3>
                    <p className="text-small text-foreground-muted mt-2">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 bg-surface-2">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-h2 font-heading font-bold text-foreground">
                Solutions for Every Business
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {useCases.map((item) => (
                <Card key={item.title}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-h4 font-heading font-bold text-foreground">
                          {item.title}
                        </h3>
                        <p className="text-body text-foreground-muted mt-1">
                          {item.desc}
                        </p>
                        <p className="text-small text-primary font-medium mt-2">
                          Typical: {item.units}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Inquiry Form */}
        <section id="inquiry-form" className="py-16 bg-surface">
          <div className="container-custom">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-h2 font-heading font-bold text-foreground">
                  Request a Proposal
                </h2>
                <p className="mt-4 text-body text-foreground-muted">
                  Tell us about your requirements and we'll get back within 24 hours
                </p>
              </div>

              {submitted ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-8 w-8 text-success" />
                    </div>
                    <h3 className="text-h3 font-heading font-bold text-foreground">
                      Thank You!
                    </h3>
                    <p className="text-body text-foreground-muted mt-2">
                      Our corporate team will contact you within 24 hours.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Company Name"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          required
                        />
                        <Input
                          label="Contact Person"
                          value={formData.contactName}
                          onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                        <Input
                          label="Phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-small font-medium text-foreground mb-1.5">
                            Number of Units
                          </label>
                          <select
                            value={formData.unitCount}
                            onChange={(e) => setFormData({ ...formData, unitCount: e.target.value })}
                            className="w-full px-4 py-3 rounded-btn border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-body"
                            required
                          >
                            <option value="">Select</option>
                            <option value="5-10">5-10 units</option>
                            <option value="11-25">11-25 units</option>
                            <option value="26-50">26-50 units</option>
                            <option value="51-100">51-100 units</option>
                            <option value="100+">100+ units</option>
                          </select>
                        </div>
                        <Input
                          label="Number of Locations"
                          type="number"
                          value={formData.locations}
                          onChange={(e) => setFormData({ ...formData, locations: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-small font-medium text-foreground mb-1.5">
                          Additional Requirements
                        </label>
                        <textarea
                          rows={3}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          className="w-full px-4 py-3 rounded-btn border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-body resize-none"
                          placeholder="Tell us about your specific needs..."
                        />
                      </div>
                      {submitError ? (
                        <p className="text-small text-error">{submitError}</p>
                      ) : null}
                      <Button type="submit" className="w-full" isLoading={isSubmitting}>
                        Submit Inquiry
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
    </main>
  );
}
