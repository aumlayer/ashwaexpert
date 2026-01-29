"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { track } from "@/utils/analytics";
import { siteConfig } from "@/data/content";

export function CTASection() {
  const router = useRouter();
  const [pincode, setPincode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6) return;

    track("pincode_check_started", { pincode, source: "footer_cta" });
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    track("pincode_check_success", { pincode });
    router.push(`/check-availability?pincode=${pincode}`);
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
