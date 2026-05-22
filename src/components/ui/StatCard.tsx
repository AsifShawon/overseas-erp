import React from "react";
import * as Icons from "lucide-react";

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

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border-theme bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text-soft">{title}</span>
        {IconComponent && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary-theme">
            <IconComponent className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-3xl font-bold tracking-tight text-text-theme">{value}</h3>
        {description && (
          <p className="mt-1 text-xs text-text-soft">{description}</p>
        )}
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
              trend.isPositive
                ? "bg-success-soft text-success-theme"
                : "bg-danger-soft text-danger-theme"
            }`}
          >
            {trend.isPositive ? "↑" : "↓"} {trend.value}
          </span>
          <span className="text-[10px] text-text-soft">vs last month</span>
        </div>
      )}
    </div>
  );
}
