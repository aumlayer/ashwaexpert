import type React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plans",
  description: "Compare Ashva Experts water purifier subscription plans and choose the best RO/UV/Copper/Alkaline option for your home.",
  alternates: {
    canonical: "/plans",
  },
};

export default function PlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
