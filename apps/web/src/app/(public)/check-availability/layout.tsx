import type React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check Availability",
  description: "Check if Ashva Experts water purifier subscriptions are available in your area by entering your pincode.",
  alternates: {
    canonical: "/check-availability",
  },
};

export default function CheckAvailabilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
