"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  /** Renders as a circle — for avatar placeholders. */
  circle?: boolean;
  style?: React.CSSProperties;
}

/**
 * Base loading placeholder. Prefer skeletons that mirror the shape of the
 * content being loaded over full-page spinners.
 */
export function Skeleton({ className = "", circle = false, style }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={`app-skeleton ${circle ? "rounded-full" : ""} ${className}`}
    />
  );
}

/** Skeleton shaped like a row of MetricCards. */
export function MetricCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-card border border-border-theme bg-surface p-4 shadow-xs"
        >
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-8" circle />
          </div>
          <Skeleton className="mt-3 h-7 w-32" />
          <Skeleton className="mt-3 h-3 w-40" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton shaped like a ChartCard. */
export function ChartSkeleton({ height = 230 }: { height?: number }) {
  return (
    <div className="rounded-card border border-border-theme bg-surface p-5 shadow-xs">
      <div className="mb-4 border-b border-border-theme pb-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-2 h-3 w-64" />
      </div>
      <div className="flex items-end gap-3" style={{ height }}>
        {[62, 88, 45, 74, 96, 58].map((h, i) => (
          <Skeleton key={i} className="flex-1" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

/** Skeleton shaped like table rows. */
export function TableSkeleton({
  rows = 6,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-border-theme bg-surface shadow-xs">
      <div className="border-b border-border-theme bg-bg-muted/70 px-4 py-3">
        <div className="flex items-center gap-6">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border-theme">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-6 px-4 py-3.5">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className="h-3.5 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Skeleton;
