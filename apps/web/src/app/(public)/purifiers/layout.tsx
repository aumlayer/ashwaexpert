import type React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Purifiers",
  description: "Explore Ashva Experts RO, UV, Copper and Alkaline water purifiers available on subscription.",
  alternates: {
    canonical: "/purifiers",
  },
};

export default function PurifiersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
