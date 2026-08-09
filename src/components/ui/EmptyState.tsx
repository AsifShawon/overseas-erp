import React from "react";
import { ICONS, type IconName } from "./icon-registry";

interface EmptyStateProps {
  title: string;
  description: string;
  iconName?: IconName;
  actionButton?: React.ReactNode;
}

export function EmptyState({ title, description, iconName = "Search", actionButton }: EmptyStateProps) {
  const IconComponent = ICONS[iconName];

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border-theme bg-bg-muted/50 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-soft text-text-soft border border-border-theme">
        <IconComponent className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-text-theme">{title}</h3>
      <p className="mt-2 max-w-sm text-xs text-text-muted">{description}</p>
      {actionButton && <div className="mt-6">{actionButton}</div>}
    </div>
  );
}
