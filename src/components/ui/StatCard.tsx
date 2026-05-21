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
      className={`relative overflow-hidden rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</span>
        {IconComponent && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <IconComponent className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</h3>
        {description && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
              trend.isPositive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
            }`}
          >
            {trend.isPositive ? "↑" : "↓"} {trend.value}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">vs last month</span>
        </div>
      )}
    </div>
  );
}
