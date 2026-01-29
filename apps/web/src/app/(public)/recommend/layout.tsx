import type React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recommendation Quiz",
  description: "Take the Ashva Experts quiz to get a recommended water purifier plan based on your water source and preferences.",
  alternates: {
    canonical: "/recommend",
  },
};

export default function RecommendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
