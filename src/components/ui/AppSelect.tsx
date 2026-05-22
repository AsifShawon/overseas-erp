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
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full rounded-xl border border-border-theme bg-white px-3.5 py-2 text-xs text-text-theme outline-none transition-all focus:border-primary-theme focus:ring-1 focus:ring-primary-theme dark:bg-slate-900 ${
            error ? "border-danger-theme focus:border-danger-theme" : ""
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="text-[10px] text-danger-theme font-medium">{error}</p>
        )}
      </div>
    );
  }
);

AppSelect.displayName = "AppSelect";

export default AppSelect;
