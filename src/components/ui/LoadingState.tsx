import React from "react";

interface LoadingStateProps {
  rows?: number;
  className?: string;
}

export function LoadingState({ rows = 3, className = "" }: LoadingStateProps) {
  return (
    <div className={`space-y-4 py-4 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center space-x-4">
          <div className="h-10 w-10 rounded-full bg-border-theme/65"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 rounded bg-border-theme/65"></div>
            <div className="h-3 w-5/6 rounded bg-border-theme/65"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
