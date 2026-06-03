"use client";

import React from "react";

interface AppInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const AppInput = React.forwardRef<HTMLInputElement, AppInputProps>(
  ({ label, error, className = "", type = "text", ...props }, ref) => {
    return (
      <div className="space-y-2 w-full">
        {label && (
          <label className="block text-sm font-semibold tracking-wide text-text-theme leading-relaxed">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={`w-full rounded-xl border border-border-theme bg-white px-4 py-3 text-[15px] leading-relaxed text-text-theme placeholder:text-text-soft outline-none transition-all focus:border-primary-theme focus:ring-2 focus:ring-primary-theme/20 dark:bg-slate-900 ${
            error ? "border-danger-theme focus:border-danger-theme focus:ring-danger-theme" : ""
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs md:text-sm text-danger-theme font-medium leading-relaxed mt-1">{error}</p>
        )}
      </div>
    );
  }
);

AppInput.displayName = "AppInput";

export default AppInput;
