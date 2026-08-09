"use client";

import React from "react";

interface ProgressBarProps {
  /** 0-100. Values outside the range are clamped. */
  value: number;
  /** Colour intent. "auto" turns amber past 80% and rose past 95%. */
  tone?: "primary" | "success" | "warning" | "danger" | "auto";
  size?: "sm" | "md";
  className?: string;
  /** Accessible description of what is being measured. */
  label?: string;
}

const TONES = {
  primary: "bg-primary-theme",
  success: "bg-success-theme",
  warning: "bg-warning-theme",
  danger: "bg-danger-theme",
} as const;

/** Quota / utilisation bar. Used for job-order fill rates and similar ratios. */
export function ProgressBar({
  value,
  tone = "primary",
  size = "md",
  className = "",
  label,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

  const resolved =
    tone === "auto"
      ? pct >= 95
        ? "danger"
        : pct >= 80
          ? "warning"
          : "primary"
      : tone;

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`w-full overflow-hidden rounded-full bg-bg-muted ${
        size === "sm" ? "h-1.5" : "h-2"
      } ${className}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${TONES[resolved]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default ProgressBar;
