"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, MapPin, ArrowRight } from "lucide-react";
import { Button, Input, Card, CardContent } from "@/components/ui";
import { track } from "@/utils/analytics";
import { useCheckAvailability, useCreateLead } from "@/hooks/use-api";

type AvailabilityStatus = "idle" | "checking" | "available" | "unavailable";

export default function CheckAvailabilityPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialPincode = searchParams.get("pincode") || "";

  const checkAvailabilityMutation = useCheckAvailability();
  const createLeadMutation = useCreateLead();

  const [pincode, setPincode] = useState(initialPincode);
  const [status, setStatus] = useState<AvailabilityStatus>("idle");
  const [city, setCity] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [notifyPhone, setNotifyPhone] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySubmitted, setNotifySubmitted] = useState(false);

  useEffect(() => {
    if (initialPincode && initialPincode.length === 6) {
      checkAvailability(initialPincode);
    }
  }, [initialPincode]);

  const checkAvailability = async (code: string) => {
    if (code.length !== 6) return;

    setStatus("checking");
    setApiError(null);
    setNotifySubmitted(false);
    track("pincode_check_started", { pincode: code });
    try {
      const res = await checkAvailabilityMutation.mutateAsync({ pincode: code });
      if (res.available) {
        setStatus("available");
        setCity(res.city);
        track("pincode_check_success", { pincode: code, available: true });
      } else {
        setStatus("unavailable");
        setCity(res.city || "");
        track("pincode_check_success", { pincode: code, available: false });
      }
    } catch (err) {
      setStatus("idle");
      setApiError("We couldn't reach our serviceability checker. Please try again in a moment.");
    }
  };

  const handleNotify = async () => {
    if (!notifyPhone || notifyPhone.length !== 10) {
      setApiError("Please enter a valid 10-digit phone number.");
      return;
    }

    try {
      await createLeadMutation.mutateAsync({
        phone: notifyPhone,
        email: notifyEmail || undefined,
        pincode,
        source: "website",
        message: "Notify me when service becomes available for my pincode.",
      });
      track("lead_captured", { source: "availability_notify", pincode });
      track("callback_requested", { source: "availability_notify", pincode });
      setNotifySubmitted(true);
      setApiError(null);
    } catch (err) {
      setApiError("Couldn't submit your request right now. Please try WhatsApp or call us.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkAvailability(pincode);
  };

  const handleContinue = () => {
    router.push(`/plans?pincode=${pincode}`);
  };

  return (
    <section className="py-18 lg:py-24 bg-surface-2 min-h-[calc(100vh-64px)]">
      <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-h2 font-heading font-bold text-foreground">
              Check Service Availability
            </h1>
            <p className="mt-2 text-body-lg text-foreground-muted">
              Enter your pincode to see if we deliver to your area
            </p>
          </div>

          {/* Form */}
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="Enter 6-digit pincode"
                  value={pincode}
                  onChange={(e) => {
                    setPincode(e.target.value.replace(/\D/g, ""));
                    setStatus("idle");
                  }}
                  className="text-center text-h3 font-heading"
                />
                {apiError && (
                  <p className="text-small text-warning text-center">{apiError}</p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={status === "checking"}
                  disabled={pincode.length !== 6}
                >
                  Check Availability
                </Button>
              </form>

              {/* Results */}
              {status === "available" && (
                <div className="mt-6 p-4 rounded-card bg-success/10 border border-success/20">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-body font-semibold text-foreground">
                        Great news! We serve your area.
                      </p>
                      <p className="text-small text-foreground-muted mt-1">
                        {city} - {pincode}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleContinue}
                    className="w-full mt-4"
                  >
                    View Plans
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              )}

              {status === "unavailable" && (
                <div className="mt-6 p-4 rounded-card bg-warning/10 border border-warning/20">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-6 w-6 text-warning flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-body font-semibold text-foreground">
                        We're not in your area yet.
                      </p>
                      <p className="text-small text-foreground-muted mt-1">
                        But we're expanding fast! Leave your details and we'll
                        notify you when we launch in your area.
                      </p>
                    </div>
                  </div>
                  {notifySubmitted ? (
                    <div className="mt-4 p-3 rounded-btn bg-success/10 border border-success/20">
                      <p className="text-small text-success font-medium">
                        Thanks! We'll notify you when we launch in your area.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <Input
                        label="Phone"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={notifyPhone}
                        onChange={(e) => setNotifyPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="10-digit mobile number"
                      />
                      <Input
                        label="Email (optional)"
                        type="email"
                        value={notifyEmail}
                        onChange={(e) => setNotifyEmail(e.target.value)}
                        placeholder="you@example.com"
                      />
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleNotify}
                        isLoading={createLeadMutation.isPending}
                      >
                        Notify Me When Available
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trust indicators */}
          <div className="mt-8 text-center">
            <p className="text-small text-foreground-muted">
              Currently serving 50+ pincodes across Bangalore, Hyderabad, and Mumbai
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
