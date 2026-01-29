"use client";

import type React from "react";
import { track } from "@/utils/analytics";

export function WhatsAppLink({
  href,
  source,
  className,
  children,
}: {
  href: string;
  source: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className}
      onClick={() => track("whatsapp_clicked", { source })}
    >
      {children}
    </a>
  );
}
