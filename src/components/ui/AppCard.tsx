import React from "react";

interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Padding density. Use "none" when the card hosts a table or its own header. */
  padding?: "none" | "sm" | "md" | "lg";
  /**
   * Only set this on cards that are genuinely clickable. Static analytics cards
   * must stay visually stable — no hover lift.
   */
  interactive?: boolean;
}

const PADDING = {
  none: "",
  sm: "p-3.5",
  md: "p-5",
  lg: "p-6",
} as const;

export function AppCard({
  children,
  className = "",
  padding = "md",
  interactive = false,
  ...props
}: AppCardProps) {
  return (
    <div
      className={`rounded-card border border-border-theme bg-surface text-text-theme shadow-xs ${
        PADDING[padding]
      } ${
        interactive
          ? "cursor-pointer transition-colors duration-150 hover:border-border-strong hover:bg-bg-muted/40"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/** Standard card header: title, optional subtitle, optional right-hand action. */
export function AppCardHeader({
  title,
  subtitle,
  action,
  icon: Icon,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-2 border-b border-border-theme pb-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex min-w-0 items-center gap-2">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-text-soft" />}
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-text-theme">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs leading-relaxed text-text-soft">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export default AppCard;
