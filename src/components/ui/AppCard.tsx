import React from "react";

interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function AppCard({ children, className = "", ...props }: AppCardProps) {
  return (
    <div
      className={`rounded-2xl border border-border-theme bg-surface p-6 shadow-sm transition-all duration-300 dark:bg-slate-950 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default AppCard;
