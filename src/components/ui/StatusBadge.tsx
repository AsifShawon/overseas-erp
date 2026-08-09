import React from "react";
import { WORKFLOW_LABELS, WorkflowStage } from "@/lib/mockData";
import { useT } from "@/i18n/useT";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const { t } = useT();
  let label = status;
  let themeClass = "bg-bg-muted text-text-muted border-border-theme";

  const workflowTranslated = t(`workflow.${status}`);
  const statusTranslated = t(`statuses.${status}`);

  if (workflowTranslated !== `workflow.${status}`) {
    label = workflowTranslated;
  } else if (statusTranslated !== `statuses.${status}`) {
    label = statusTranslated;
  } else if (status in WORKFLOW_LABELS) {
    label = WORKFLOW_LABELS[status as WorkflowStage];
  }

  switch (status) {
    // Active / Positive States
    case "VERIFIED":
    case "MEDICAL_FIT":
    case "DEPLOYED":
    case "PAID":
    case "ACTIVE":
      themeClass = "bg-success-soft text-success-theme border-success-theme/30";
      break;

    // Warning / Pending States
    case "PENDING_VERIFICATION":
    case "PENDING_UPLOAD":
    case "MEDICAL_WAITING":
    case "VISA_SUBMITTED":
    case "ACCRUED":
    case "PARTIAL":
      themeClass = "bg-warning-soft text-warning-theme border-warning-theme/30";
      break;

    // Processing / Stage highlight states
    case "SELECTED":
    case "TRAINING_COMPLETED":
    case "VISA_STAMPED":
    case "TICKETED":
    case "OPEN":
      themeClass = "bg-primary-soft text-primary-theme border-primary-theme/30";
      break;

    // Stopped / Alert States
    case "REJECTED":
    case "MEDICAL_UNFIT":
    case "VISA_REJECTED":
    case "CANCELLED":
    case "EXPIRED":
    case "OVERDUE":
    case "UNPAID":
      themeClass = "bg-danger-soft text-danger-theme border-danger-theme/30";
      break;

    // Normal starting states
    case "APPLIED":
    case "INTERVIEWED":
      themeClass = "bg-info-soft text-info-theme border-info-theme/30";
      break;
  }

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-wide transition-colors ${themeClass} ${className}`}
    >
      {label}
    </span>
  );
}

export default StatusBadge;

