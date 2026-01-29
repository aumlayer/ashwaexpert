"use client";

import type React from "react";
import Link from "next/link";
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
  const content = (
    <div className="text-center py-10">
      {Icon ? (
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center">
          <Icon className="h-6 w-6 text-foreground-muted" />
        </div>
      ) : null}

      <p className="text-body font-medium text-foreground">{title}</p>
      {message ? <p className="text-small text-foreground-muted mt-1">{message}</p> : null}

      {primaryCta || secondaryCta ? (
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
          {primaryCta ? (
            primaryCta.href ? (
              <Link href={primaryCta.href} className="inline-flex">
                <Button>{primaryCta.label}</Button>
              </Link>
            ) : (
              <Button onClick={primaryCta.onClick}>{primaryCta.label}</Button>
            )
          ) : null}

          {secondaryCta ? (
            <a
              href={secondaryCta.href}
              target="_blank"
              rel="noreferrer"
              className="text-small text-primary font-medium hover:underline"
            >
              {secondaryCta.label}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  return content;
}
