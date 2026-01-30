"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

interface RippleEffect {
  x: number;
  y: number;
  id: number;
}

export interface AnimatedButtonProps {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export function AnimatedButton({
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  children,
  onClick,
  type = "button",
}: AnimatedButtonProps) {
    const [ripples, setRipples] = useState<RippleEffect[]>([]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();

      setRipples((prev) => [...prev, { x, y, id }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);

      onClick?.();
    };

    const variants = {
      primary: "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25",
      secondary: "bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/25",
      outline: "border-2 border-primary text-primary bg-transparent hover:bg-primary/5",
      ghost: "text-foreground hover:bg-surface-2",
    };

    const sizes = {
      sm: "h-9 px-4 text-small rounded-btn",
      md: "h-11 px-6 text-body rounded-btn",
      lg: "h-14 px-8 text-body-lg rounded-btn",
    };

  return (
    <motion.button
      type={type}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={cn(
        "relative inline-flex items-center justify-center font-semibold overflow-hidden",
        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        "transition-colors duration-200",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      onClick={handleClick}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full animate-ripple pointer-events-none"
          style={{
            left: ripple.x - 50,
            top: ripple.y - 50,
            width: 100,
            height: 100,
          }}
        />
      ))}
      {isLoading && (
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
