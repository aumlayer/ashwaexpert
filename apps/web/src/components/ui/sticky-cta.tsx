"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";

interface StickyCTAProps {
  text?: string;
  href?: string;
  showAfterScroll?: number;
  showAfterScrollPercent?: number;
}

export function StickyCTA({
  text = "Check Availability",
  href = "/check-availability",
  showAfterScroll = 500,
  showAfterScrollPercent,
}: StickyCTAProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!isDismissed) {
        const scrollMax = Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight
        );
        const threshold =
          typeof showAfterScrollPercent === "number"
            ? scrollMax * showAfterScrollPercent
            : showAfterScroll;

        setIsVisible(window.scrollY > threshold);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [showAfterScroll, showAfterScrollPercent, isDismissed]);

  if (!isVisible || isDismissed) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-surface via-surface to-transparent pointer-events-none lg:hidden">
        <div className="flex items-center gap-2 pointer-events-auto">
          <Link
            href={href}
            className="flex-1 inline-flex items-center justify-center px-6 py-4 bg-primary text-white font-semibold rounded-btn hover:bg-primary/90 transition-colors shadow-lg"
          >
            {text}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-3 bg-surface border border-border rounded-btn shadow-lg hover:bg-surface-2"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5 text-foreground-muted" />
          </button>
        </div>
      </div>

      <div className="hidden lg:block fixed bottom-6 left-6 z-40 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <Link
            href={href}
            className="inline-flex items-center justify-center px-5 py-3 bg-primary text-white font-semibold rounded-full hover:bg-primary/90 transition-colors shadow-lg"
          >
            {text}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-3 bg-surface border border-border rounded-full shadow-lg hover:bg-surface-2"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5 text-foreground-muted" />
          </button>
        </div>
      </div>
    </>
  );
}
