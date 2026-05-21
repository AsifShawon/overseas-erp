"use client";

import React from "react";
import { Search, SlidersHorizontal } from "lucide-react";

interface FilterBarProps {
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  searchTerm = "",
  onSearchChange,
  searchPlaceholder = "Filter results...",
  filters,
  actions,
  className = "",
}: FilterBarProps) {
  return (
    <div
      className={`flex flex-col gap-4 border-b border-slate-100 bg-white p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950/20 ${className}`}
    >
      {/* Search Input Section */}
      {onSearchChange && (
        <div className="relative flex-1 max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-slate-200 py-1.5 pl-10 pr-4 text-xs font-medium outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900"
          />
        </div>
      )}

      {/* Filter and Additional Dropdowns Slots */}
      {(filters || actions) && (
        <div className="flex flex-wrap items-center gap-3 justify-start sm:justify-end">
          {filters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filters:
              </span>
              {filters}
            </div>
          )}
          {actions && <div className="flex items-center gap-2 border-l border-slate-200 pl-3 dark:border-slate-800">{actions}</div>}
        </div>
      )}
    </div>
  );
}

export default FilterBar;
