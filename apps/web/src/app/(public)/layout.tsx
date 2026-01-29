import { Navbar, Footer } from "@/components/layout";
import type React from "react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-16">{children}</div>
      <Footer />
    </>
  );
}
