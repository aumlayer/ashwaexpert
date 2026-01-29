import type React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offers",
  description: "Browse Ashva Experts offers, bundles, and savings on water purifier subscriptions.",
  alternates: {
    canonical: "/offers",
  },
};

export default function OffersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
