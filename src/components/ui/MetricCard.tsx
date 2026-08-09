"use client";

import React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { ICONS, type IconName } from "./icon-registry";

export interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  iconName?: IconName;
  /**
   * Only pass a trend when the backend actually supplies a comparison figure.
   * Never hardcode a percentage — a fabricated trend is worse than no trend.
   */
  trend?: {
    value: string;
    isPositive: boolean;
    /** e.g. "vs last month" — states what the comparison is against. */
    label?: string;
  };
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
  /** Optional click target. Adds hover affordance only when provided. */
  onClick?: () => void;
}

const ICON_VARIANTS = {
  default: "bg-primary-soft text-primary-theme",
  success: "bg-success-soft text-success-theme",
  warning: "bg-warning-soft text-warning-theme",
  danger: "bg-danger-soft text-danger-theme",
  info: "bg-info-soft text-info-theme",
} as const;

/**
 * Compact KPI tile:
 *
 *   LABEL                    [icon]
 *   1,352
 *   ↑ 8.5%  vs last month
 *
 * Sized to sit four-up on a standard desktop without dominating the page.
 */
export function MetricCard({
  title,
  value,
  description,
  iconName,
  trend,
  variant = "default",
  className = "",
  onClick,
}: MetricCardProps) {
  const IconComponent = iconName ? ICONS[iconName] : null;

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      {...(onClick
        ? { onClick, type: "button" as const }
        : {})}
      className={`rounded-card border border-border-theme bg-surface p-4 text-left shadow-xs ${
        onClick
          ? "cursor-pointer transition-colors duration-150 hover:border-border-strong hover:bg-bg-muted/40"
          : ""
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 pt-0.5 text-[11px] font-semibold uppercase leading-tight tracking-wide text-text-soft">
          {title}
        </span>
        {IconComponent && (
          <span
            aria-hidden="true"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${ICON_VARIANTS[variant]}`}
          >
            <IconComponent className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="mt-2.5 text-[1.75rem] font-bold leading-none tracking-tight text-text-theme tabular-nums-ui">
        {value}
      </div>

      {(trend || description) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-[11px] font-semibold leading-none ${
                trend.isPositive
                  ? "bg-success-soft text-success-theme"
                  : "bg-danger-soft text-danger-theme"
              }`}
            >
              {trend.isPositive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {trend.value}
            </span>
          )}
          {(trend?.label || description) && (
            <span className="text-[11px] leading-tight text-text-soft">
              {trend?.label || description}
            </span>
          )}
        </div>
      )}
    </Wrapper>
  );
}

export default MetricCard;
