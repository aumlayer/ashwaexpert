"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { track } from "@/utils/analytics";
import { siteConfig } from "@/data/content";
import { useCheckAvailability } from "@/hooks/use-api";
import { buildFunnelLocationQuery } from "@/utils/funnel-location";

export function CTASection() {
  const router = useRouter();
  const [pincode, setPincode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAvailabilityMutation = useCheckAvailability();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6) return;

    track("pincode_check_started", { pincode, source: "footer_cta" });
    setIsLoading(true);

    try {
      setError(null);
      const res = await checkAvailabilityMutation.mutateAsync({ pincode });
      track("pincode_check_success", { pincode, available: res.available, source: "footer_cta" });

      if (!res.available) {
        setError("We don't serve your area yet. You can leave your details and we'll notify you when we launch.");
        router.push(
          `/check-availability${buildFunnelLocationQuery({
            pincode,
            city: res.city || undefined,
            locality: res.locality || undefined,
          })}`
        );
        return;
      }

      router.push(
        `/plans${buildFunnelLocationQuery({
          pincode,
          city: res.city || undefined,
          locality: res.locality || undefined,
        })}`
      );
    } catch {
      setError("We couldn't check availability right now. Please try again, or chat with us on WhatsApp.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-18 lg:py-24 bg-primary">
      <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-h2 font-heading font-bold text-white">
          Ready for Pure Water?
        </h2>
        <p className="mt-4 text-body-lg text-white/80 max-w-xl mx-auto">
          Check if we serve your area and get started with your subscription
          today.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        >
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="Enter your pincode"
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
            className="flex-1 bg-white border-0"
          />
          <Button
            type="submit"
            variant="secondary"
            size="lg"
            isLoading={isLoading}
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </form>

        {error ? (
          <div className="mt-4 max-w-md mx-auto bg-white/10 border border-white/15 rounded-card p-4 text-left">
            <p className="text-small text-white/90">{error}</p>
            <a
              className="inline-flex mt-3 text-small font-semibold text-white hover:underline"
              href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
                `Hi Ashva Experts! Please help me with availability for pincode ${pincode}.`
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              Chat on WhatsApp
            </a>
          </div>
        ) : null}

        <p className="mt-6 text-small text-white/60">
          Or call us at{" "}
          <a
            href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
            className="underline hover:text-white"
          >
            {siteConfig.phone}
          </a>
        </p>
      </div>
    </section>
  );
}
