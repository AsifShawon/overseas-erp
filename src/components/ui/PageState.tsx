"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { AppButton } from "./AppButton";
import { ICONS, type IconName } from "./icon-registry";

/**
 * Error state.
 *
 * Deliberately does NOT surface stack traces or backend internals — `message`
 * should already be the sanitised, user-facing error text produced by the page.
 */
export function ErrorPanel({
  title,
  message,
  onRetry,
  retryLabel = "Retry",
}: {
  title: string;
  message?: string | null;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 rounded-card border border-danger-theme/25 bg-danger-soft px-6 py-14 text-center"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface/70 text-danger-theme">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-text-theme">{title}</h3>
        {message && (
          <p className="mx-auto max-w-md text-xs leading-relaxed text-text-muted">
            {message}
          </p>
        )}
      </div>
      {onRetry && (
        <AppButton variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" />
          {retryLabel}
        </AppButton>
      )}
    </div>
  );
}

/**
 * Empty state: short explanation + at most one useful call to action.
 */
export function EmptyPanel({
  title,
  description,
  iconName = "Inbox",
  action,
  compact = false,
}: {
  title: string;
  description?: string;
  iconName?: IconName;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  const IconComponent = ICONS[iconName];

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-card border border-dashed border-border-theme bg-bg-muted/40 px-6 text-center ${
        compact ? "py-10" : "py-16"
      }`}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border-theme bg-surface text-text-soft">
        <IconComponent className="h-5 w-5" />
      </div>
      <h3 className="mt-3.5 text-sm font-semibold text-text-theme">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default ErrorPanel;
