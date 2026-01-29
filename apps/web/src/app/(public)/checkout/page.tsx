"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, CreditCard, Shield, Check } from "lucide-react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { track } from "@/utils/analytics";
import { useCheckout, usePlans } from "@/hooks/use-api";
import { plans as plansData } from "@/data/content";
import { ExitIntentCapture } from "@/components/funnel/exit-intent-capture";

const timeSlots = [
  { id: "morning", label: "Morning", time: "9 AM - 12 PM" },
  { id: "afternoon", label: "Afternoon", time: "12 PM - 3 PM" },
  { id: "evening", label: "Evening", time: "3 PM - 6 PM" },
];

type CheckoutStep = "details" | "schedule" | "payment" | "confirm";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get("plan") || "advanced-ro-uv";
  const pincode = searchParams.get("pincode") || "";

  const tenureMonthsRaw = Number(searchParams.get("tenure") || "1");
  const tenureMonths = Number.isFinite(tenureMonthsRaw) && tenureMonthsRaw > 0 ? tenureMonthsRaw : 1;

  const checkoutMutation = useCheckout();

  const plansQuery = usePlans();
  const allPlans = plansQuery.data && plansQuery.data.length > 0 ? plansQuery.data : plansData;

  const selectedPlan =
    allPlans.find((p) => p.id === planId) || allPlans.find((p) => p.id === "advanced-ro-uv");
  const planName = selectedPlan?.name || "Selected Plan";
  const planPrice = selectedPlan?.monthlyPrice ?? 0;

  const persistKey = useMemo(() => {
    return `checkout_state_v1:${planId}:${tenureMonths}`;
  }, [planId, tenureMonths]);

  const [step, setStep] = useState<CheckoutStep>("details");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    pincode: pincode,
    city: "",
    installDate: "",
    timeSlot: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(persistKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        savedAt: number;
        expiresAt: number;
        step: CheckoutStep;
        formData: typeof formData;
      };
      if (!parsed || typeof parsed.expiresAt !== "number") return;
      if (Date.now() > parsed.expiresAt) {
        localStorage.removeItem(persistKey);
        return;
      }

      setFormData((prev) => ({ ...prev, ...parsed.formData }));
      setStep(parsed.step);
      setRestored(true);
    } catch {
      setRestored(false);
    }
  }, [persistKey]);

  useEffect(() => {
    try {
      const now = Date.now();
      const payload = {
        savedAt: now,
        expiresAt: now + 24 * 60 * 60 * 1000,
        step,
        formData,
      };
      localStorage.setItem(persistKey, JSON.stringify(payload));
    } catch {}
  }, [persistKey, step, formData]);

  const validateDetails = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.phone || formData.phone.length !== 10) newErrors.phone = "Valid 10-digit phone required";
    if (!formData.email || !formData.email.includes("@")) newErrors.email = "Valid email required";
    if (!formData.address) newErrors.address = "Address is required";
    if (!formData.pincode || formData.pincode.length !== 6) newErrors.pincode = "Valid pincode required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateDetails()) {
      track("checkout_started", { plan_id: planId });
      setStep("schedule");
    }
  };

  const handleScheduleSubmit = () => {
    if (!formData.installDate || !formData.timeSlot) {
      setErrors({ schedule: "Please select date and time" });
      return;
    }
    track("slot_selected", { date: formData.installDate, slot: formData.timeSlot });
    setStep("payment");
  };

  const handlePayment = async () => {
    setSubmitError(null);
    track("payment_initiated", { plan_id: planId, amount: planPrice });

    try {
      const res = await checkoutMutation.mutateAsync({
        planId,
        tenureMonths,
        customer: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
        },
        address: {
          line1: formData.address,
          city: formData.city || "",
          state: "",
          pincode: formData.pincode,
        },
        installationSlot: {
          date: formData.installDate,
          timeSlot: formData.timeSlot as "morning" | "afternoon" | "evening",
        },
      });

      track("payment_success", { plan_id: planId, order_id: res.orderId });

      if (res.paymentUrl) {
        try {
          localStorage.removeItem(persistKey);
        } catch {}
        window.location.href = res.paymentUrl;
        return;
      }

      try {
        localStorage.removeItem(persistKey);
      } catch {}
      router.push(`/confirmation?order=${encodeURIComponent(res.orderId)}`);
    } catch (err) {
      track("payment_failed", { plan_id: planId });
      setSubmitError("Payment couldn't be initiated. Please try again in a moment.");
    }
  };

  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 2; i <= 8; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  };

  return (
    <section className="py-18 lg:py-24 bg-surface-2 min-h-[calc(100vh-64px)]">
      <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
        {restored ? (
          <div className="mb-6 bg-accent/10 border border-accent/20 rounded-card p-4">
            <p className="text-small text-foreground">
              We restored your checkout details so you can continue where you left off.
            </p>
          </div>
        ) : null}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {/* Progress Steps */}
            <div className="flex items-center gap-4 mb-8">
              {(["details", "schedule", "payment"] as CheckoutStep[]).map((s, i) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-small font-semibold ${
                      step === s
                        ? "bg-primary text-white"
                        : i < ["details", "schedule", "payment"].indexOf(step)
                        ? "bg-success text-white"
                        : "bg-border text-foreground-muted"
                    }`}
                  >
                    {i < ["details", "schedule", "payment"].indexOf(step) ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  {i < 2 && (
                    <div className="w-12 h-0.5 bg-border mx-2" />
                  )}
                </div>
              ))}
            </div>

            {/* Step: Details */}
            {step === "details" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Your Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleDetailsSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        error={errors.name}
                      />
                      <Input
                        label="Phone Number"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
                        error={errors.phone}
                      />
                    </div>
                    <Input
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      error={errors.email}
                    />
                    <Input
                      label="Installation Address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      error={errors.address}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Pincode"
                        inputMode="numeric"
                        maxLength={6}
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, "") })}
                        error={errors.pincode}
                      />
                      <Input
                        label="City"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Continue to Schedule
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Step: Schedule */}
            {step === "schedule" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Schedule Installation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-small font-medium text-foreground mb-3">Select Date</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {getAvailableDates().map((date) => (
                        <button
                          key={date}
                          onClick={() => setFormData({ ...formData, installDate: date })}
                          className={`p-3 rounded-btn border text-center transition-colors ${
                            formData.installDate === date
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => setFormData({ ...formData, timeSlot: slot.id })}
                          className={`p-4 rounded-btn border text-center transition-colors ${
                            formData.timeSlot === slot.id
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

                  {errors.schedule && (
                    <p className="text-small text-error">{errors.schedule}</p>
                  )}

                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setStep("details")}>
                      Back
                    </Button>
                    <Button className="flex-1" onClick={handleScheduleSubmit}>
                      Continue to Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step: Payment */}
            {step === "payment" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-surface-2 rounded-card">
                    <div className="flex items-center gap-3 mb-4">
                      <Shield className="h-5 w-5 text-success" />
                      <span className="text-small text-foreground-muted">
                        Secure payment powered by Razorpay
                      </span>
                    </div>
                    <p className="text-body text-foreground">
                      You'll be charged <strong>₹{planPrice}</strong> monthly. First payment
                      will be collected after successful installation.
                    </p>
                  </div>

                  {submitError && (
                    <p className="text-small text-error">{submitError}</p>
                  )}

                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setStep("schedule")}>
                      Back
                    </Button>
                    <Button className="flex-1" onClick={handlePayment} isLoading={checkoutMutation.isPending}>
                      Confirm & Pay ₹{planPrice}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-body font-semibold text-foreground">{planName}</p>
                    <p className="text-small text-foreground-muted">Monthly subscription</p>
                  </div>
                  <Badge variant="accent">Selected</Badge>
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-small">
                    <span className="text-foreground-muted">Monthly fee</span>
                    <span className="text-foreground">₹{planPrice}</span>
                  </div>
                  <div className="flex justify-between text-small">
                    <span className="text-foreground-muted">Installation</span>
                    <span className="text-success">FREE</span>
                  </div>
                  <div className="flex justify-between text-small">
                    <span className="text-foreground-muted">Security deposit</span>
                    <span className="text-foreground">₹0</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span className="text-body font-semibold">Due Today</span>
                    <span className="text-h4 font-heading font-bold text-primary">₹0</span>
                  </div>
                  <p className="text-caption text-foreground-muted mt-1">
                    First payment after installation
                  </p>
                </div>

                <div className="bg-success/10 p-3 rounded-btn">
                  <p className="text-small text-success font-medium">
                    ✓ 30-day satisfaction guarantee
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ExitIntentCapture
        planId={planId}
        tenureMonths={tenureMonths}
        pincode={formData.pincode || pincode}
      />
    </section>
  );
}
