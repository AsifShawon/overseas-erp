import React from "react";
import * as Icons from "lucide-react";
import { useT } from "@/i18n/useT";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  iconName?: keyof typeof Icons;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, description, iconName, trend, className = "" }: StatCardProps) {
  const IconComponent = iconName ? Icons[iconName] as React.ComponentType<{ className?: string }> : null;
  const { locale } = useT();

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border-theme bg-surface p-6 md:p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${className}`}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-[15px] md:text-base font-semibold text-text-soft leading-relaxed">{title}</span>
        {IconComponent && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-theme">
            <IconComponent className="h-6 w-6" />
          </div>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-theme">{value}</h3>
        {description && (
          <p className="mt-2 text-sm text-text-soft leading-relaxed">{description}</p>
        )}
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs md:text-sm font-bold ${
              trend.isPositive
                ? "bg-success-soft text-success-theme"
                : "bg-danger-soft text-danger-theme"
            }`}
          >
            {trend.isPositive ? "↑" : "↓"} {trend.value}
          </span>
          <span className="text-xs md:text-sm text-text-soft leading-normal">
            {locale === "bn" ? "গত মাসের তুলনায়" : "vs last month"}
          </span>
        </div>
      )}
    </div>
  );
}
