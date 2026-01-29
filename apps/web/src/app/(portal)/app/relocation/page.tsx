"use client";

import { useState } from "react";
import {
  MapPin,
  Truck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";
import { track } from "@/utils/analytics";
import { useRequestRelocation } from "@/hooks/use-subscription";

export default function RelocationPage() {
  const [step, setStep] = useState<"form" | "schedule" | "success">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    newAddress: "",
    newPincode: "",
    newCity: "",
    reason: "",
    preferredDate: "",
    preferredSlot: "",
  });

  const requestRelocationMutation = useRequestRelocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "form") {
      setStep("schedule");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    track("service_request_started", { type: "relocation" });

    try {
      await requestRelocationMutation.mutateAsync({
        newAddress: {
          line1: formData.newAddress,
          line2: undefined,
          city: formData.newCity,
          state: "",
          pincode: formData.newPincode,
        },
        preferredDate: formData.preferredDate,
      });
      setStep("success");
    } catch {
      setSubmitError("Couldn't submit your relocation request right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 3; i <= 10; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  };

  if (step === "success") {
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h2 className="text-h3 font-heading font-bold text-foreground">
              Relocation Request Submitted
            </h2>
            <p className="text-body text-foreground-muted mt-2">
              Our team will contact you within 24 hours to confirm the relocation details.
            </p>
            <div className="mt-6 p-4 bg-surface-2 rounded-card text-left">
              <p className="text-small text-foreground-muted">New Address</p>
              <p className="text-body font-medium text-foreground">{formData.newAddress}</p>
              <p className="text-body text-foreground-muted">{formData.newCity} - {formData.newPincode}</p>
            </div>
            <Button className="mt-6" onClick={() => window.location.href = "/app"}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-h3 font-heading font-bold text-foreground">
          Request Relocation
        </h1>
        <p className="text-body text-foreground-muted mt-1">
          Moving to a new place? We'll relocate your purifier for you.
        </p>
      </div>

      {/* Info Banner */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Truck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-body font-medium text-foreground">Free Relocation</p>
              <p className="text-small text-foreground-muted">
                One free relocation per year is included in your subscription. 
                Additional relocations are charged at ₹500.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-small font-semibold ${
            step === "form" ? "bg-primary text-white" : "bg-success text-white"
          }`}>
            {step === "schedule" ? <CheckCircle2 className="h-4 w-4" /> : "1"}
          </div>
          <span className="text-small font-medium text-foreground">New Address</span>
        </div>
        <div className="w-12 h-0.5 bg-border" />
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-small font-semibold ${
            step === "schedule" ? "bg-primary text-white" : "bg-border text-foreground-muted"
          }`}>
            2
          </div>
          <span className="text-small text-foreground-muted">Schedule</span>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {step === "form" ? (
              <>
                <MapPin className="h-5 w-5 text-primary" />
                New Address Details
              </>
            ) : (
              <>
                <Calendar className="h-5 w-5 text-primary" />
                Schedule Relocation
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === "form" ? (
              <>
                <Input
                  label="New Address"
                  placeholder="Enter your new address"
                  value={formData.newAddress}
                  onChange={(e) => setFormData({ ...formData, newAddress: e.target.value })}
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Pincode"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit pincode"
                    value={formData.newPincode}
                    onChange={(e) => setFormData({ ...formData, newPincode: e.target.value.replace(/\D/g, "") })}
                    required
                  />
                  <Input
                    label="City"
                    placeholder="City name"
                    value={formData.newCity}
                    onChange={(e) => setFormData({ ...formData, newCity: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-small font-medium text-foreground mb-1.5">
                    Reason for Relocation
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-4 py-3 rounded-btn border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-body"
                    required
                  >
                    <option value="">Select reason</option>
                    <option value="moving">Moving to new home</option>
                    <option value="renovation">Home renovation</option>
                    <option value="kitchen_change">Kitchen layout change</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <Button type="submit" className="w-full">
                  Continue to Schedule
                </Button>
              </>
            ) : (
              <>
                <div>
                  <p className="text-small font-medium text-foreground mb-3">Select Date</p>
                  <div className="grid grid-cols-4 gap-2">
                    {getAvailableDates().map((date) => (
                      <button
                        key={date}
                        type="button"
                        onClick={() => setFormData({ ...formData, preferredDate: date })}
                        className={`p-3 rounded-btn border text-center transition-colors ${
                          formData.preferredDate === date
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <p className="text-caption text-foreground-muted">
                          {new Date(date).toLocaleDateString("en-IN", { weekday: "short" })}
                        </p>
                        <p className="text-body font-semibold">
                          {new Date(date).getDate()}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-small font-medium text-foreground mb-3">Select Time Slot</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "morning", label: "Morning", time: "9 AM - 12 PM" },
                      { id: "afternoon", label: "Afternoon", time: "12 PM - 4 PM" },
                      { id: "evening", label: "Evening", time: "4 PM - 7 PM" },
                    ].map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, preferredSlot: slot.id })}
                        className={`p-4 rounded-btn border text-center transition-colors ${
                          formData.preferredSlot === slot.id
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Clock className="h-5 w-5 mx-auto mb-1" />
                        <p className="text-body font-semibold">{slot.label}</p>
                        <p className="text-caption text-foreground-muted">{slot.time}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => setStep("form")}>
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    isLoading={isSubmitting}
                    disabled={!formData.preferredDate || !formData.preferredSlot}
                  >
                    Submit Request
                  </Button>
                </div>

                {submitError ? (
                  <p className="text-small text-error">{submitError}</p>
                ) : null}
              </>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Note */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-foreground-muted flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-body font-medium text-foreground">Important Note</p>
              <p className="text-small text-foreground-muted">
                Relocation typically takes 2-3 hours. Please ensure someone is available 
                at both locations during the scheduled time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
