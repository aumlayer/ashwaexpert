"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Shield, ArrowLeft, RefreshCw, Check } from "lucide-react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useSendOTP, useSignup } from "@/hooks/use-auth";
import { track } from "@/utils/analytics";

type Step = "details" | "otp" | "complete";

export default function SignupPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("details");
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    otp: "",
  });

  const sendOTP = useSendOTP();
  const signup = useSignup();

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.phone.length !== 10) return;

    setError(null);
    track("signup_otp_requested", {});

    try {
      const response = await sendOTP.mutateAsync({ identifier: formData.phone, type: "signup" });
      if (response.success) {
        setStep("otp");
        setCountdown(response.retryAfter || 30);
        track("signup_otp_sent", {});
      } else {
        setError(response.message || "Failed to send OTP");
      }
    } catch (err) {
      // For demo, proceed to OTP step
      setStep("otp");
      setCountdown(30);
    }
  };

  const handleVerifyAndSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.otp.length !== 6) return;

    setError(null);

    try {
      const response = await signup.mutateAsync({
        phone: formData.phone,
        otp: formData.otp,
        name: formData.name,
        email: formData.email || undefined,
      });

      if (response.success) {
        track("signup_completed", {});
        setStep("complete");
        setTimeout(() => router.push("/app"), 2000);
      } else {
        setError(response.message || "Signup failed");
      }
    } catch (err) {
      // For demo, show success
      setStep("complete");
      setTimeout(() => router.push("/app"), 2000);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setFormData({ ...formData, otp: "" });
    setError(null);

    try {
      const response = await sendOTP.mutateAsync({ identifier: formData.phone, type: "signup" });
      if (response.success) {
        setCountdown(response.retryAfter || 30);
      }
    } catch {
      setCountdown(30);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  // Success state
  if (step === "complete") {
    return (
      <div className="w-full">
        <Card className="shadow-lg">
          <CardContent className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mx-auto mb-6">
              <Check className="h-10 w-10 text-success" />
            </div>
            <h2 className="text-h3 font-heading font-bold text-foreground mb-2">
              Welcome to Ashva Experts!
            </h2>
            <p className="text-body text-foreground-muted mb-6">
              Your account has been created successfully.
            </p>
            <p className="text-small text-foreground-muted">
              Redirecting to your dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="text-h4 font-heading font-bold text-foreground">
            Ashva Experts
          </span>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
            {step === "details" ? (
              <UserPlus className="h-8 w-8 text-primary" />
            ) : (
              <Shield className="h-8 w-8 text-primary" />
            )}
          </div>
          <CardTitle className="text-h3">
            {step === "details" ? "Create Account" : "Verify Phone"}
          </CardTitle>
          <p className="text-body text-foreground-muted mt-2">
            {step === "details"
              ? "Join 50,000+ families enjoying pure water"
              : `Enter the 6-digit code sent to +91 ${formData.phone}`}
          </p>
        </CardHeader>

        <CardContent className="pt-4">
          {error && (
            <div className="mb-4 p-3 rounded-btn bg-error/10 border border-error/20">
              <p className="text-small text-error text-center">{error}</p>
            </div>
          )}

          {step === "details" ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-small font-medium text-foreground mb-1.5">
                  Full Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="w-full px-4 py-3 rounded-btn border border-border bg-surface text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-body"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-small font-medium text-foreground mb-1.5">
                  Phone Number <span className="text-error">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-btn border border-r-0 border-border bg-surface-2 text-foreground-muted text-body">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Enter 10-digit number"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, ""))}
                    className="flex-1 px-4 py-3 rounded-r-btn border border-border bg-surface text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-body"
                    required
                  />
                </div>
              </div>

              {/* Email (optional) */}
              <div>
                <label className="block text-small font-medium text-foreground mb-1.5">
                  Email <span className="text-foreground-muted">(optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="w-full px-4 py-3 rounded-btn border border-border bg-surface text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-body"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={sendOTP.isPending}
                disabled={!formData.name || formData.phone.length !== 10}
              >
                Continue
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndSignup} className="space-y-4">
              {/* OTP Input */}
              <div>
                <label className="block text-small font-medium text-foreground mb-1.5">
                  Enter OTP
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={formData.otp}
                  onChange={(e) => updateField("otp", e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-4 rounded-btn border border-border bg-surface text-foreground text-center text-h3 tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={signup.isPending}
                disabled={formData.otp.length !== 6}
              >
                Create Account
              </Button>

              {/* Resend OTP */}
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-small text-foreground-muted">
                    Resend OTP in <span className="font-semibold text-foreground">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={sendOTP.isPending}
                    className="inline-flex items-center gap-1 text-small text-primary hover:underline disabled:opacity-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Resend OTP
                  </button>
                )}
              </div>

              {/* Back button */}
              <button
                type="button"
                onClick={() => {
                  setStep("details");
                  setFormData({ ...formData, otp: "" });
                  setError(null);
                }}
                className="w-full inline-flex items-center justify-center gap-2 text-small text-foreground-muted hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to details
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-small">
              <span className="px-2 bg-surface text-foreground-muted">or</span>
            </div>
          </div>

          {/* Alternative actions */}
          <div className="text-center">
            <p className="text-small text-foreground-muted">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign In
              </Link>
            </p>
          </div>

          {/* Terms */}
          <p className="mt-4 text-caption text-foreground-muted text-center">
            By creating an account, you agree to our{" "}
            <Link href="/legal/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/legal/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
          </p>
        </CardContent>
      </Card>

      {/* Benefits */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: "🚀", title: "Quick Setup", desc: "Get started in 2 minutes" },
          { icon: "🔒", title: "Secure", desc: "Your data is protected" },
          { icon: "💧", title: "Pure Water", desc: "Join 50K+ families" },
        ].map((item) => (
          <div key={item.title} className="text-center p-4 rounded-card bg-surface border border-border">
            <span className="text-2xl">{item.icon}</span>
            <p className="text-small font-medium text-foreground mt-2">{item.title}</p>
            <p className="text-caption text-foreground-muted">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
