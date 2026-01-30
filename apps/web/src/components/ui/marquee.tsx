"use client";

import Marquee from "react-fast-marquee";
import { cn } from "@/utils/cn";

interface TrustMarqueeProps {
  className?: string;
}

const trustItems = [
  { icon: "🏆", text: "50,000+ Happy Customers" },
  { icon: "⭐", text: "4.8/5 Average Rating" },
  { icon: "🏙️", text: "100+ Cities Served" },
  { icon: "🔧", text: "48hr Installation" },
  { icon: "💧", text: "Pure Water Guaranteed" },
  { icon: "🛡️", text: "No Hidden Costs" },
  { icon: "📞", text: "24/7 Support" },
  { icon: "♻️", text: "Eco-Friendly Filters" },
];

export function TrustMarquee({ className }: TrustMarqueeProps) {
  return (
    <div className={cn("py-4 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5", className)}>
      <Marquee
        gradient
        gradientColor="white"
        gradientWidth={100}
        speed={40}
        pauseOnHover
      >
        {trustItems.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-2 mx-8 px-6 py-3 bg-white rounded-full shadow-sm border border-border hover:shadow-md hover:scale-105 transition-all duration-300 cursor-default"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-sm font-medium text-foreground whitespace-nowrap">
              {item.text}
            </span>
          </div>
        ))}
      </Marquee>
    </div>
  );
}

interface LogoMarqueeProps {
  className?: string;
}

const partnerLogos = [
  { name: "ISO 9001", badge: "Certified" },
  { name: "BIS", badge: "Approved" },
  { name: "NSF", badge: "Certified" },
  { name: "WQA", badge: "Gold Seal" },
  { name: "EPA", badge: "Compliant" },
];

export function LogoMarquee({ className }: LogoMarqueeProps) {
  return (
    <div className={cn("py-6 bg-surface-2", className)}>
      <Marquee
        gradient
        gradientColor="#f8fafc"
        gradientWidth={80}
        speed={30}
        direction="right"
      >
        {partnerLogos.map((logo, index) => (
          <div
            key={index}
            className="flex flex-col items-center mx-12 opacity-60 hover:opacity-100 transition-opacity duration-300"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <span className="text-xs font-bold text-primary">{logo.name}</span>
            </div>
            <span className="text-xs text-foreground-muted">{logo.badge}</span>
          </div>
        ))}
      </Marquee>
    </div>
  );
}
