"use client";

import React from "react";

interface AppSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

export const AppSelect = React.forwardRef<HTMLSelectElement, AppSelectProps>(
  ({ label, error, children, className = "", ...props }, ref) => {
    return (
      <div className="space-y-2 w-full">
        {label && (
          <label className="block text-sm font-semibold tracking-wide text-text-theme leading-relaxed">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full rounded-xl border border-border-theme bg-white px-4 py-3 text-[15px] leading-relaxed text-text-theme outline-none transition-all focus:border-primary-theme focus:ring-2 focus:ring-primary-theme/20 dark:bg-slate-900 ${
            error ? "border-danger-theme focus:border-danger-theme" : ""
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="text-xs md:text-sm text-danger-theme font-medium leading-relaxed mt-1">{error}</p>
        )}
      </div>
    );
  }
);

AppSelect.displayName = "AppSelect";

export default AppSelect;
