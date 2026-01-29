import type { Metadata } from "next";
import { StickyCTA, WhatsAppButton } from "@/components/ui";
import { HeroSection } from "@/components/sections/hero";
import { HowItWorksSection } from "@/components/sections/how-it-works";
import { TopPlansSection } from "@/components/sections/top-plans";
import { TrustSection } from "@/components/sections/trust";
import { TestimonialsSection } from "@/components/sections/testimonials";
import { CTASection } from "@/components/sections/cta";
import { siteConfig } from "@/data/content";

export const metadata: Metadata = {
  title: "Home",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <TopPlansSection />
      <TrustSection />
      <TestimonialsSection />
      <CTASection />
      <StickyCTA showAfterScrollPercent={0.2} />
      <WhatsAppButton
        showAfterScrollPercent={0.4}
        phoneNumber={siteConfig.whatsapp}
        message="Hi Ashva Experts! I need help picking the right plan."
      />
    </>
  );
}
