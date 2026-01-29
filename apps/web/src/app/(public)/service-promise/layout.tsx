import type React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Service Promise",
  description: "Learn about Ashva Experts service promise, SLAs, maintenance, and support commitments for your purifier subscription.",
  alternates: {
    canonical: "/service-promise",
  },
};

export default function ServicePromiseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
