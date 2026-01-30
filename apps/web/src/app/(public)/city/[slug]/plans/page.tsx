import type { Metadata } from "next";
import Script from "next/script";
import { cityData } from "../page";
import { CityPlansClient } from "./CityPlansClient";
import { api } from "@/utils/api";
import type { Plan } from "@/types/api";
import { plans as plansData } from "@/data/content";

export async function generateStaticParams() {
  return Object.keys(cityData).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const city = cityData[params.slug];
  if (!city) return { title: "City Not Found" };

  return {
    title: `Plans in ${city.name} | Ashva Experts`,
    description: `Explore water purifier subscription plans in ${city.name}. Free installation, maintenance included. Starting at ₹399/month.`,
    alternates: {
      canonical: `/city/${params.slug}/plans`,
    },
  };
}

export default async function CityPlansPage({ params }: { params: { slug: string } }) {
  const city = cityData[params.slug];
  if (!city) {
    return (
      <main className="py-18 lg:py-24 bg-surface-2 min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-h2 font-heading font-bold text-foreground">City Not Found</h1>
            <p className="mt-2 text-body text-foreground-muted">We don't have plan pages for this city yet.</p>
          </div>
        </div>
      </main>
    );
  }

  let plans: Plan[] = plansData as unknown as Plan[];
  try {
    const apiPlans = await api.get<Plan[]>("/plans");
    if (apiPlans && apiPlans.length > 0) {
      plans = apiPlans;
    }
  } catch {
    // keep static fallback
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Water Purifier Subscription Plans in ${city.name}`,
    description: `Explore water purifier subscription plans in ${city.name}.`,
    url: `${"https://www.ashvaexperts.com"}/city/${params.slug}/plans`,
  };

  return (
    <>
      <Script
        id="city-plans-jsonld"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CityPlansClient cityName={city.name} citySlug={params.slug} plans={plans} />
    </>
  );
}
