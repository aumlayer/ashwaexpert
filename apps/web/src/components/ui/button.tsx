"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold transition-all duration-standard ease-out-expo focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
      primary:
        "bg-primary text-white hover:bg-primary/90 active:scale-[0.98] shadow-sm hover:shadow-md",
      secondary:
        "bg-accent text-white hover:bg-accent/90 active:scale-[0.98] shadow-sm hover:shadow-md",
      outline:
        "border-2 border-primary text-primary bg-transparent hover:bg-primary/5 active:scale-[0.98]",
      ghost:
        "text-foreground hover:bg-surface-2 active:scale-[0.98]",
    };

    const sizes = {
      sm: "h-9 px-4 text-small rounded-btn",
      md: "h-11 px-6 text-body rounded-btn",
      lg: "h-14 px-8 text-body-lg rounded-btn",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
