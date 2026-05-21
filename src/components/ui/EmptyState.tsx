import React from "react";
import * as Icons from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  iconName?: keyof typeof Icons;
  actionButton?: React.ReactNode;
}

export function EmptyState({ title, description, iconName = "Search", actionButton }: EmptyStateProps) {
  const IconComponent = Icons[iconName] as React.ComponentType<{ className?: string }>;

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/30">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <IconComponent className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-xs text-slate-500 dark:text-slate-400">{description}</p>
      {actionButton && <div className="mt-6">{actionButton}</div>}
    </div>
  );
}
