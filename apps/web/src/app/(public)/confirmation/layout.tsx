import type React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confirmation",
  description: "Order confirmation for Ashva Experts subscription.",
  alternates: {
    canonical: "/confirmation",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ConfirmationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
