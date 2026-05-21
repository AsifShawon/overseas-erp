"use client";

import React from "react";

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
  className?: string;
  gridColumns?: 1 | 2 | 3 | 4;
}

export function FormSection({
  title,
  description,
  children,
  footerActions,
  className = "",
  gridColumns = 2,
}: FormSectionProps) {
  const getGridClass = () => {
    switch (gridColumns) {
      case 1:
        return "grid-cols-1";
      case 3:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      case 4:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
      default:
        return "grid-cols-1 sm:grid-cols-2";
    }
  };

  return (
    <div
      className={`rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 ${className}`}
    >
      <div className="border-b border-slate-100 pb-4 mb-5 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">{title}</h3>
        {description && (
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 leading-normal">{description}</p>
        )}
      </div>

      <div className={`grid gap-6 ${getGridClass()}`}>
        {children}
      </div>

      {footerActions && (
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          {footerActions}
        </div>
      )}
    </div>
  );
}

export default FormSection;
