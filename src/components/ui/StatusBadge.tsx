import React from "react";
import { WORKFLOW_LABELS, WorkflowStage } from "@/lib/mockData";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  // Resolve standard or technical enums
  let label = status;
  let themeClass = "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800";

  // Check if status is a workflow stage
  if (status in WORKFLOW_LABELS) {
    label = WORKFLOW_LABELS[status as WorkflowStage];
  }

  // Assign color themes
  switch (status) {
    // Active / Positive States
    case "VERIFIED":
    case "MEDICAL_FIT":
    case "DEPLOYED":
    case "PAID":
      themeClass = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900";
      break;

    // Warning / Pending States
    case "PENDING_VERIFICATION":
    case "PENDING_UPLOAD":
    case "MEDICAL_WAITING":
    case "VISA_SUBMITTED":
    case "ACCRUED":
      themeClass = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900";
      break;

    // Processing / Stage highlight states
    case "SELECTED":
    case "TRAINING_COMPLETED":
    case "VISA_STAMPED":
    case "TICKETED":
      themeClass = "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-900";
      break;

    // Stopped / Alert States
    case "REJECTED":
    case "MEDICAL_UNFIT":
    case "VISA_REJECTED":
    case "CANCELLED":
    case "EXPIRED":
      themeClass = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-900";
      break;

    // Normal starting states
    case "APPLIED":
    case "INTERVIEWED":
      themeClass = "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-400 dark:border-sky-900";
      break;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors ${themeClass} ${className}`}
    >
      {label}
    </span>
  );
}
