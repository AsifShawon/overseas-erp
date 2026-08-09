"use client";

import React from "react";
import { Loader2 } from "lucide-react";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success";
type Size = "sm" | "md" | "lg" | "icon";

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

/**
 * The single button primitive for the whole application.
 *
 * Every colour comes from a semantic design token — no raw palette classes and
 * no `dark:` variants, so both themes follow automatically.
 */
const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary-theme text-white border border-transparent hover:bg-primary-hover",
  secondary:
    "bg-surface text-text-theme border border-border-theme hover:bg-bg-muted",
  outline:
    "bg-transparent text-text-theme border border-border-strong hover:bg-bg-muted",
  ghost:
    "bg-transparent text-text-muted border border-transparent hover:bg-bg-muted hover:text-text-theme",
  danger:
    "bg-danger-theme text-white border border-transparent hover:opacity-90",
  success:
    "bg-success-theme text-white border border-transparent hover:opacity-90",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9.5 px-3.5 text-xs gap-1.5",
  lg: "h-11 px-5 text-sm gap-2",
  icon: "h-9.5 w-9.5 p-0 justify-center",
};

export function AppButton({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  className = "",
  disabled,
  type = "button",
  ...props
}: AppButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md font-semibold leading-none transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 cursor-pointer ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}

export default AppButton;
