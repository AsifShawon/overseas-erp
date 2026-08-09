"use client";

import React from "react";
import * as Icons from "lucide-react";
import { useT } from "@/i18n/useT";

export interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  iconName?: keyof typeof Icons;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export function MetricCard({
  title,
  value,
  description,
  iconName,
  trend,
  variant = "default",
  className = "",
}: MetricCardProps) {
  const IconComponent = iconName ? (Icons[iconName] as React.ComponentType<{ className?: string }>) : null;
  const { locale } = useT();

  const variantStyles = {
    default: "bg-primary-soft text-primary-theme",
    success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    warning: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    danger: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
    info: "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border-theme bg-surface p-4.5 md:p-5 shadow-xs transition-all duration-200 hover:border-border-strong ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-text-soft truncate">
          {title}
        </span>
        {IconComponent && (
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${variantStyles[variant]}`}>
            <IconComponent className="h-4.5 w-4.5" />
          </div>
        )}
      </div>

      <div className="mt-2.5">
        <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-theme">{value}</h3>
      </div>

      {(trend || description) && (
        <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                trend.isPositive
                  ? "bg-success-soft text-success-theme"
                  : "bg-danger-soft text-danger-theme"
              }`}
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value}
            </span>
          )}
          {description && (
            <span className="text-[11px] text-text-soft font-medium leading-tight">
              {description}
            </span>
          )}
          {trend && !description && (
            <span className="text-[11px] text-text-soft font-medium">
              {locale === "bn" ? "গত মাসের তুলনায়" : "vs last month"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default MetricCard;
