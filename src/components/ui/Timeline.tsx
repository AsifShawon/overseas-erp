"use client";

import React from "react";
import { ICONS, type IconName } from "./icon-registry";

export interface TimelineItem {
  key: string;
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  timestamp?: string;
  iconName?: IconName;
  status?: "completed" | "active" | "pending" | "error" | "warning";
  action?: React.ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  layout?: "vertical" | "horizontal";
  className?: string;
}

export function Timeline({ items, layout = "vertical", className = "" }: TimelineProps) {
  const getStatusColor = (status?: TimelineItem["status"]) => {
    switch (status) {
      case "completed":
        return {
          bg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
          border: "border-emerald-500",
          dot: "bg-emerald-500",
        };
      case "active":
        return {
          bg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400",
          border: "border-indigo-600",
          dot: "bg-indigo-600 animate-pulse",
        };
      case "error":
        return {
          bg: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
          border: "border-rose-500",
          dot: "bg-rose-500",
        };
      case "warning":
        return {
          bg: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
          border: "border-amber-500",
          dot: "bg-amber-500",
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-400 dark:bg-slate-900 dark:text-slate-500",
          border: "border-slate-300 dark:border-slate-700",
          dot: "bg-slate-300 dark:bg-slate-700",
        };
    }
  };

  if (layout === "horizontal") {
    return (
      <div className={`flex flex-col md:flex-row gap-6 md:gap-4 overflow-x-auto py-4 ${className}`}>
        {items.map((item, idx) => {
          const colors = getStatusColor(item.status);
          const IconComponent = item.iconName ? ICONS[item.iconName] : null;

          return (
            <div key={item.key} className="flex-1 flex flex-row md:flex-col gap-4 md:gap-2 relative min-w-[200px]">
              {/* Connector line */}
              {idx < items.length - 1 && (
                <div className="hidden md:block absolute left-[28px] top-[14px] right-0 h-0.5 bg-slate-100 dark:bg-slate-800 -z-10" />
              )}

              {/* Node Circle */}
              <div className="flex shrink-0 items-center justify-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white dark:bg-slate-950 z-10 transition-all ${colors.border} ${colors.bg}`}
                >
                  {IconComponent ? (
                    <IconComponent className="h-4 w-4" />
                  ) : (
                    <span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
                  )}
                </div>
              </div>

              {/* Text Area */}
              <div className="flex-1 md:text-center mt-1 md:mt-2 space-y-1">
                <div className="text-xs font-bold text-slate-800 dark:text-white leading-snug">
                  {item.title}
                </div>
                {item.timestamp && (
                  <p className="text-[10px] text-slate-400 font-semibold">{item.timestamp}</p>
                )}
                {item.description && (
                  <p className="text-[10px] text-slate-500 leading-normal max-w-[180px] md:mx-auto">
                    {item.description}
                  </p>
                )}
                {item.action && <div className="mt-2">{item.action}</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Default Vertical Layout
  return (
    <div className={`flow-root ${className}`}>
      <ul className="-mb-8">
        {items.map((item, idx) => {
          const colors = getStatusColor(item.status);
          const IconComponent = item.iconName ? ICONS[item.iconName] : null;

          return (
            <li key={item.key}>
              <div className="relative pb-8">
                {/* Vertical Connector Line */}
                {idx < items.length - 1 && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100 dark:bg-slate-800"
                    aria-hidden="true"
                  />
                )}

                <div className="relative flex space-x-3 items-start">
                  <div>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white dark:bg-slate-950 z-10 transition-all ${colors.border} ${colors.bg}`}
                    >
                      {IconComponent ? (
                        <IconComponent className="h-4 w-4" />
                      ) : (
                        <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                      )}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 pt-1.5 flex justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-800 dark:text-white">
                        {item.title}
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-slate-500 leading-relaxed">{item.description}</p>
                      )}
                      {item.action && <div className="mt-2">{item.action}</div>}
                    </div>

                    {item.timestamp && (
                      <div className="text-right text-[10px] font-semibold text-slate-400 whitespace-nowrap pt-0.5">
                        {item.timestamp}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Timeline;
