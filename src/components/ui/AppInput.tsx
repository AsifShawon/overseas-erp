"use client";

import React from "react";

interface AppInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const AppInput = React.forwardRef<HTMLInputElement, AppInputProps>(
  ({ label, error, className = "", type = "text", ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={`w-full rounded-xl border border-border-theme bg-white px-3.5 py-2 text-xs text-text-theme placeholder:text-text-soft outline-none transition-all focus:border-primary-theme focus:ring-1 focus:ring-primary-theme dark:bg-slate-900 ${
            error ? "border-danger-theme focus:border-danger-theme focus:ring-danger-theme" : ""
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-[10px] text-danger-theme font-medium">{error}</p>
        )}
      </div>
    );
  }
);

AppInput.displayName = "AppInput";

export default AppInput;
