"use client";

import React from "react";

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  footer,
  className = "",
}: ChartCardProps) {
  return (
    <div className={`rounded-xl border border-border-theme bg-surface p-5 shadow-xs ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-border-theme">
        <div>
          <h3 className="text-sm font-bold text-text-theme">{title}</h3>
          {subtitle && <p className="text-xs text-text-soft font-medium mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>

      <div className="w-full">{children}</div>

      {footer && (
        <div className="mt-4 pt-3 border-t border-border-theme text-xs text-text-soft">
          {footer}
        </div>
      )}
    </div>
  );
}

export default ChartCard;
