"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  isLoading?: boolean;
}

export function AppButton({
  children,
  variant = "primary",
  isLoading = false,
  className = "",
  disabled,
  ...props
}: AppButtonProps) {
  const baseStyle =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

  let variantStyle = "";

  switch (variant) {
    case "primary":
      variantStyle =
        "bg-primary-theme hover:bg-primary-hover text-white shadow-sm shadow-indigo-600/10";
      break;
    case "secondary":
      variantStyle =
        "border border-border-strong bg-white hover:bg-bg-muted text-text-theme dark:bg-slate-900";
      break;
    case "ghost":
      variantStyle =
        "text-text-muted hover:bg-bg-muted hover:text-text-theme";
      break;
    case "danger":
      variantStyle =
        "bg-danger-theme hover:bg-danger-theme/90 text-white shadow-sm shadow-rose-600/10";
      break;
    case "success":
      variantStyle =
        "bg-success-theme hover:bg-success-theme/90 text-white shadow-sm shadow-emerald-600/10";
      break;
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variantStyle} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}

export default AppButton;
