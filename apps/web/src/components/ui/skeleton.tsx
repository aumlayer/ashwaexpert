import type React from "react";
import { cn } from "@/utils/cn";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-foreground/10", className)}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-card border border-border bg-surface p-6 space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-10 w-1/2" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export function PlanCardSkeleton() {
  return (
    <div className="rounded-card border border-border bg-surface p-6 space-y-4">
      <div className="text-center space-y-2">
        <Skeleton className="h-6 w-1/2 mx-auto" />
        <Skeleton className="h-10 w-2/3 mx-auto" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
      </div>
      <div className="grid grid-cols-2 gap-2 py-4 border-y border-border">
        <div className="text-center space-y-1">
          <Skeleton className="h-3 w-12 mx-auto" />
          <Skeleton className="h-5 w-8 mx-auto" />
        </div>
        <div className="text-center space-y-1">
          <Skeleton className="h-3 w-12 mx-auto" />
          <Skeleton className="h-5 w-8 mx-auto" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export function TestimonialSkeleton() {
  return (
    <div className="rounded-card border border-border bg-surface p-6 space-y-4">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-5" />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  );
}
