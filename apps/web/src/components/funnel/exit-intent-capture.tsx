"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button, Card, CardContent, Input } from "@/components/ui";
import { siteConfig } from "@/data/content";
import { track } from "@/utils/analytics";
import { useCreateLead } from "@/hooks/use-api";

export function ExitIntentCapture({
  planId,
  tenureMonths,
  pincode,
}: {
  planId: string;
  tenureMonths: number;
  pincode: string;
}) {
  const createLead = useCreateLead();
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  const storageKey = "exit_intent_checkout_dismissed";

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(storageKey) === "1";
      setIsDismissed(dismissed);
    } catch {
      setIsDismissed(false);
    }
  }, []);

  useEffect(() => {
    if (isDismissed || submitted) return;

    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setIsOpen(true);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setIsOpen(true);
      }
    };

    window.addEventListener("mouseout", onMouseLeave);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("mouseout", onMouseLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isDismissed, submitted]);

  const whatsappHref = useMemo(() => {
    const msg = `Hi Ashva Experts! I was checking out plan ${planId} (${tenureMonths} month(s)). Can you help me complete my booking?`;
    return `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(msg)}`;
  }, [planId, tenureMonths]);

  const close = () => {
    setIsOpen(false);
  };

  const dismissPermanently = () => {
    setIsDismissed(true);
    setIsOpen(false);
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.phone || form.phone.replace(/\D/g, "").length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    try {
      await createLead.mutateAsync({
        name: form.name || undefined,
        phone: form.phone.replace(/\D/g, ""),
        email: form.email || undefined,
        pincode,
        source: "exit_intent",
        message: `Checkout help request. planId=${planId}, tenureMonths=${tenureMonths}`,
      });

      track("lead_captured", { source: "exit_intent_checkout", plan_id: planId, tenure_months: tenureMonths });
      track("callback_requested", { source: "exit_intent_checkout", plan_id: planId, tenure_months: tenureMonths });
      setSubmitted(true);
    } catch {
      setError("Couldn't submit right now. Please try WhatsApp.");
    }
  };

  if (isDismissed || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-foreground/40" onClick={close}>
      <div className="absolute inset-0 flex items-end sm:items-center justify-center p-4">
        <div
          className="w-full max-w-xl"
          role="dialog"
          aria-modal="true"
          aria-label="Need help completing checkout"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-h4 font-heading font-bold text-foreground">Need help completing your booking?</p>
                  <p className="mt-2 text-body text-foreground-muted">
                    Share your number and we’ll call you back, or chat with us on WhatsApp.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={dismissPermanently}
                  className="p-2 rounded-btn hover:bg-surface-2"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-foreground-muted" />
                </button>
              </div>

              <div className="mt-5">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-[#25D366] text-white font-semibold rounded-btn hover:opacity-95 transition-opacity"
                  onClick={() => track("whatsapp_clicked", { source: "exit_intent_checkout" })}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Chat on WhatsApp
                </a>
              </div>

              <div className="mt-6">
                {submitted ? (
                  <div className="bg-success/10 border border-success/20 rounded-card p-4">
                    <p className="text-body font-semibold text-foreground">Request received</p>
                    <p className="mt-1 text-small text-foreground-muted">
                      We’ll reach out shortly.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      label="Name (optional)"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    <Input
                      label="Phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                    />
                    <Input
                      label="Email (optional)"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />

                    {error ? <p className="text-small text-error">{error}</p> : null}

                    <Button type="submit" className="w-full" isLoading={createLead.isPending}>
                      Request a Callback
                    </Button>
                  </form>
                )}
              </div>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={close}
                  className="text-small text-foreground-muted hover:text-foreground"
                >
                  Continue checkout
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
