import React from "react";

type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "primary";

interface AppBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** Adds a leading status dot — useful when colour alone must not carry meaning. */
  dot?: boolean;
  children: React.ReactNode;
}

const VARIANTS: Record<BadgeVariant, string> = {
  success: "bg-success-soft text-success-theme border-success-theme/25",
  warning: "bg-warning-soft text-warning-theme border-warning-theme/25",
  danger: "bg-danger-soft text-danger-theme border-danger-theme/25",
  info: "bg-info-soft text-info-theme border-info-theme/25",
  primary: "bg-primary-soft text-primary-theme border-primary-theme/25",
  neutral: "bg-bg-muted text-text-muted border-border-theme",
};

/**
 * Compact semantic badge. Vertical padding is kept at py-1 (not py-0.5) so
 * Bangla matras and conjuncts have room to render without clipping.
 */
export function AppBadge({
  children,
  variant = "neutral",
  dot = false,
  className = "",
  ...props
}: AppBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[11px] font-semibold leading-none ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"
        />
      )}
      {children}
    </span>
  );
}

export default AppBadge;
