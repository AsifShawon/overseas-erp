"use client";

import React from "react";
import { ICONS, type IconName } from "./icon-registry";

interface ErrorStateProps {
  title: string;
  description: string;
  iconName?: IconName;
  actionButton?: React.ReactNode;
  className?: string;
}

export function ErrorState({
  title,
  description,
  iconName = "AlertCircle",
  actionButton,
  className = "",
}: ErrorStateProps) {
  const IconComponent = ICONS[iconName];

  return (
    <div
      className={`flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50/10 p-8 text-center dark:border-rose-950/30 dark:bg-rose-950/5 ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 animate-pulse">
        <IconComponent className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-base font-bold text-text-theme">{title}</h3>
      <p className="mt-2 max-w-md text-xs leading-relaxed text-text-muted">{description}</p>
      {actionButton && <div className="mt-6">{actionButton}</div>}
    </div>
  );
}

export default ErrorState;
