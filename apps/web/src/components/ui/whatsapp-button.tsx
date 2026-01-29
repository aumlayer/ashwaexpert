"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { track } from "@/utils/analytics";

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
  showAfterScroll?: number;
  showAfterScrollPercent?: number;
}

export function WhatsAppButton({
  phoneNumber = "919876543210",
  message = "Hi! I'm interested in your water purifier subscription.",
  showAfterScroll = 300,
  showAfterScrollPercent,
}: WhatsAppButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollMax = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const threshold =
        typeof showAfterScrollPercent === "number"
          ? scrollMax * showAfterScrollPercent
          : showAfterScroll;

      setIsVisible(window.scrollY > threshold);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    // Show tooltip after 5 seconds if visible
    const tooltipTimer = setTimeout(() => {
      if (isVisible) setShowTooltip(true);
    }, 5000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(tooltipTimer);
    };
  }, [showAfterScroll, showAfterScrollPercent, isVisible]);

  const handleClick = () => {
    track("whatsapp_clicked", {});
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, "_blank");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-16 right-0 bg-surface rounded-card shadow-lg border border-border p-3 w-64 animate-in fade-in slide-in-from-bottom-2">
          <button
            onClick={() => setShowTooltip(false)}
            className="absolute top-2 right-2 p-1 hover:bg-surface-2 rounded"
          >
            <X className="h-3 w-3 text-foreground-muted" />
          </button>
          <p className="text-small font-medium text-foreground">Need help choosing?</p>
          <p className="text-caption text-foreground-muted mt-1">
            Chat with us on WhatsApp for instant assistance
          </p>
        </div>
      )}

      {/* Button */}
      <button
        onClick={handleClick}
        className="w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
      </button>
    </div>
  );
}
