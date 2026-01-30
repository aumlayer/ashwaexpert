"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Phone, Shield, ArrowLeft, RefreshCw } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useSendOTP, useVerifyOTP } from "@/hooks/use-auth";
import { track } from "@/utils/analytics";

function LoginPageContent() {
  const searchParams = useSearchParams();
  searchParams.get("returnTo") || "/app";

  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const sendOTP = useSendOTP();
  const verifyOTP = useVerifyOTP();

  const identifierTrimmed = identifier.trim();
  const isEmail = identifierTrimmed.includes("@");
  const isAshvaAdminEmail =
    isEmail && identifierTrimmed.toLowerCase().endsWith("@ashvaexperts.com");
  const isValidPhone = /^\d{10}$/.test(identifierTrimmed);
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifierTrimmed);
  const isValidIdentifier = isEmail ? isValidEmail : isValidPhone;

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidIdentifier) return;

    setError(null);
    track("login_otp_requested", { identifier: identifierTrimmed.slice(0, 4) + "******" });

    try {
      const response = await sendOTP.mutateAsync({ identifier: identifierTrimmed, type: "login" });
      if (response.success) {
        setStep("otp");
        setCountdown(response.retryAfter || 30);
        track("login_otp_sent", {});
      } else {
        setError(response.message || "Failed to send OTP");
      }
    } catch (err) {
      // For demo, proceed to OTP step even if API fails
      setStep("otp");
      setCountdown(30);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setError(null);
    track("login_otp_verify_started", {});

    try {
      const response = await verifyOTP.mutateAsync({ identifier: identifierTrimmed, otp, type: "login" });
      if (response.success) {
        track("login_success", {});
        // Redirect is handled centrally in the auth hook (admin -> /admin, others -> /app).
        return;
      } else {
        setError(response.message || "Invalid OTP");
        track("login_otp_invalid", {});
      }
    } catch (err) {
      // Let the auth hook handle redirects on success.
      return;
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setOtp("");
    setError(null);

    try {
      const response = await sendOTP.mutateAsync({ identifier: identifierTrimmed, type: "login" });
      if (response.success) {
        setCountdown(response.retryAfter || 30);
        track("login_otp_resent", {});
      }
    } catch {
      setCountdown(30);
    }
  };

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
            {step === "phone" ? (
              <Phone className="h-8 w-8 text-primary" />
            ) : (
              <Shield className="h-8 w-8 text-primary" />
            )}
          </div>
          <CardTitle className="text-h3">
            {step === "phone" ? "Welcome Back" : "Verify OTP"}
          </CardTitle>
          <p className="text-body text-foreground-muted mt-2">
            {step === "phone"
              ? "Sign in to manage your subscription"
              : isEmail
                ? `Enter the 6-digit code sent to ${identifierTrimmed}`
                : `Enter the 6-digit code sent to +91 ${identifierTrimmed}`}
          </p>
        </CardHeader>

        <CardContent className="pt-4">
          {error && (
            <div className="mb-4 p-3 rounded-btn bg-error/10 border border-error/20">
              <p className="text-small text-error text-center">{error}</p>
            </div>
          )}

          {step === "phone" ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-small font-medium text-foreground mb-1.5">
                  Phone or Email
                </label>
                <input
                  type="text"
                  inputMode={isEmail ? "email" : "text"}
                  placeholder="10-digit phone or work email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-3 rounded-btn border border-border bg-surface text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-body"
                />
                {isAshvaAdminEmail && (
                  <p className="mt-2 text-caption text-foreground-muted">
                    Admin sign-in will be verified via email OTP.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={sendOTP.isPending}
                disabled={!isValidIdentifier}
              >
                Send OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
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
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-4 rounded-btn border border-border bg-surface text-foreground text-center text-h3 tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={verifyOTP.isPending}
                disabled={otp.length !== 6}
              >
                Verify & Login
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
                  setStep("phone");
                  setOtp("");
                  setError(null);
                }}
                className="w-full inline-flex items-center justify-center gap-2 text-small text-foreground-muted hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Change phone/email
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
          <div className="space-y-3">
            <Link
              href="/signup"
              className="w-full inline-flex items-center justify-center px-4 py-3 border border-border rounded-btn text-body font-medium text-foreground hover:bg-surface-2 transition-colors"
            >
              Create New Account
            </Link>
          </div>

          {/* Footer links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-small text-foreground-muted">
              Don't have a subscription?{" "}
              <Link href="/plans" className="text-primary font-medium hover:underline">
                View Plans
              </Link>
            </p>
            <p className="text-caption text-foreground-muted">
              By continuing, you agree to our{" "}
              <Link href="/legal/terms" className="underline hover:text-foreground">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/legal/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Trust badges */}
      <div className="mt-6 flex items-center justify-center gap-4 text-caption text-foreground-muted">
        <div className="flex items-center gap-1">
          <Shield className="h-4 w-4" />
          <span>Secure Login</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-foreground-muted" />
        <span>256-bit SSL</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full flex items-center justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
