import type React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corporate",
  description: "Corporate water purifier subscriptions for apartments, offices, and commercial spaces with bulk pricing and dedicated support.",
  alternates: {
    canonical: "/corporate",
  },
};

export default function CorporateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
