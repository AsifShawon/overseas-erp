import React from "react";

interface AppBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "primary";
  children: React.ReactNode;
}

export function AppBadge({
  children,
  variant = "neutral",
  className = "",
  ...props
}: AppBadgeProps) {
  let colorStyle = "";

  switch (variant) {
    case "success":
      colorStyle =
        "bg-success-soft text-success-theme border-success-theme/20 dark:border-success-theme/10";
      break;
    case "warning":
      colorStyle =
        "bg-warning-soft text-warning-theme border-warning-theme/20 dark:border-warning-theme/10";
      break;
    case "danger":
      colorStyle =
        "bg-danger-soft text-danger-theme border-danger-theme/20 dark:border-danger-theme/10";
      break;
    case "info":
      colorStyle =
        "bg-info-soft text-info-theme border-info-theme/20 dark:border-info-theme/10";
      break;
    case "primary":
      colorStyle =
        "bg-primary-soft text-primary-theme border-primary-theme/20 dark:border-primary-theme/10";
      break;
    case "neutral":
    default:
      colorStyle =
        "bg-bg-muted text-text-muted border-border-strong";
      break;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide transition-colors ${colorStyle} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export default AppBadge;
