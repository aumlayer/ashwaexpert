"use client";

import type React from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { Button } from "./button";

export function EmptyState({
  title,
  message,
  icon: Icon,
  primaryCta,
  secondaryCta,
}: {
  title: string;
  message?: string;
  icon?: React.ElementType;
  primaryCta?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryCta?: {
    label: string;
    href: string;
  };
}) {
  const IconComponent = Icon || Inbox;

  return (
    <div className="text-center py-12 px-4 animate-fade-in">
      <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center ring-1 ring-border">
        <IconComponent className="h-7 w-7 text-primary" />
      </div>

      <p className="text-h4 font-heading font-semibold text-foreground">{title}</p>
      {message ? (
        <p className="text-body text-foreground-muted mt-2 max-w-sm mx-auto">{message}</p>
      ) : null}

      {primaryCta || secondaryCta ? (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          {primaryCta ? (
            primaryCta.href ? (
              <Link href={primaryCta.href} className="inline-flex">
                <Button size="lg">{primaryCta.label}</Button>
              </Link>
            ) : (
              <Button size="lg" onClick={primaryCta.onClick}>
                {primaryCta.label}
              </Button>
            )
          ) : null}

          {secondaryCta ? (
            <a
              href={secondaryCta.href}
              target="_blank"
              rel="noreferrer"
              className="text-body text-primary font-medium hover:underline transition-colors"
            >
              {secondaryCta.label}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
