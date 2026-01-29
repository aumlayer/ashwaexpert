"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, label, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-small font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-btn border border-border bg-surface px-4 py-2 text-body text-foreground placeholder:text-foreground-muted",
            "transition-all duration-standard ease-out-expo",
            "hover:border-primary/50 hover:shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:shadow-md",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:shadow-none",
            error && "border-error focus:ring-error/50 focus:border-error hover:border-error/50",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-small text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
