"use client";

import React, { useContext } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { ToastContext, ToastItem, ToastType } from "@/context/ToastContext";

export function ToastContainer() {
  const context = useContext(ToastContext);
  if (!context) return null;

  const { toasts, removeToast } = context;

  if (toasts.length === 0) return null;

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />;
      case "info":
      default:
        return <Info className="h-4 w-4 text-indigo-500 shrink-0" />;
    }
  };

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return "border-emerald-100 bg-emerald-50/95 text-emerald-900 dark:border-emerald-950/20 dark:bg-emerald-950/90 dark:text-emerald-100";
      case "warning":
        return "border-amber-100 bg-amber-50/95 text-amber-900 dark:border-amber-950/20 dark:bg-amber-950/90 dark:text-amber-100";
      case "error":
        return "border-rose-100 bg-rose-50/95 text-rose-900 dark:border-rose-950/20 dark:bg-rose-950/90 dark:text-rose-100";
      case "info":
      default:
        return "border-indigo-100 bg-indigo-50/95 text-indigo-900 dark:border-indigo-950/20 dark:bg-indigo-950/90 dark:text-indigo-100";
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full p-4 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start justify-between gap-3 pointer-events-auto rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-4 fade-in duration-200 ${getToastStyles(
            t.type
          )}`}
          role="alert"
        >
          <div className="flex gap-2.5 items-start">
            {getIcon(t.type)}
            <p className="text-xs font-semibold leading-relaxed break-words">
              {t.message}
            </p>
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="rounded-lg p-0.5 text-slate-400 hover:bg-slate-200/50 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800/50 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Close notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
