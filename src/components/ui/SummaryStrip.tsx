"use client";

import React from "react";

export interface SummaryItem {
  label: string;
  value: React.ReactNode;
  /** Optional emphasis for the value, e.g. an outstanding balance. */
  tone?: "default" | "success" | "warning" | "danger";
}

const TONES = {
  default: "text-text-theme",
  success: "text-success-theme",
  warning: "text-warning-theme",
  danger: "text-danger-theme",
} as const;

/**
 * Horizontal key-fact strip for detail pages — the "at a glance" row that sits
 * under a record header (current stage, job order, agent, balance, ...).
 */
export function SummaryStrip({
  items,
  className = "",
}: {
  items: SummaryItem[];
  className?: string;
}) {
  return (
    <dl
      className={`grid grid-cols-2 gap-px overflow-hidden rounded-card border border-border-theme bg-border-theme sm:grid-cols-3 lg:grid-cols-5 ${className}`}
    >
      {items.map((item, idx) => (
        <div key={idx} className="bg-surface px-4 py-3">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-text-soft">
            {item.label}
          </dt>
          <dd
            className={`mt-1 truncate text-sm font-semibold ${
              TONES[item.tone || "default"]
            }`}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default SummaryStrip;
