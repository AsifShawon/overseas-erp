// src/lib/workflow-rules.ts
// Workflow transition rules and role-based access restrictions

import { WorkflowStage } from "@/lib/mockData";

/**
 * Maps each stage to its allowed immediate successor stages.
 * Restricts transitions to step-by-step progressions and logical recoveries.
 */
export const ALLOWED_TRANSITIONS: Record<WorkflowStage, WorkflowStage[]> = {
  APPLIED: ["INTERVIEWED", "SELECTED"],
  INTERVIEWED: ["APPLIED", "SELECTED"],
  SELECTED: ["INTERVIEWED", "MEDICAL_WAITING"],
  MEDICAL_WAITING: ["MEDICAL_FIT", "MEDICAL_UNFIT", "SELECTED"],
  MEDICAL_FIT: ["MEDICAL_WAITING", "TRAINING_COMPLETED"],
  MEDICAL_UNFIT: ["MEDICAL_WAITING"], // Recovery path from medical failure
  TRAINING_COMPLETED: ["MEDICAL_FIT", "VISA_SUBMITTED"],
  VISA_SUBMITTED: ["VISA_STAMPED", "VISA_REJECTED", "TRAINING_COMPLETED"],
  VISA_STAMPED: ["VISA_SUBMITTED", "TICKETED"],
  VISA_REJECTED: ["VISA_SUBMITTED"], // Recovery path from visa decline
  TICKETED: ["VISA_STAMPED", "DEPLOYED"],
  DEPLOYED: ["TICKETED"],
};

/**
 * Validates whether an actor with a given role is permitted to transition
 * an applicant from currentStage to nextStage based on ERP business boundaries.
 */
export function validateTransition(
  roleName: string,
  currentStage: WorkflowStage,
  nextStage: WorkflowStage
): { valid: boolean; reason?: string } {
  // Super Admin & Operations Admin can override valid transitions and roles
  if (roleName === "Super Admin" || roleName === "Operations Admin") {
    return { valid: true };
  }

  // External sourcing agents & placed applicants cannot transition workflow
  if (roleName === "Agent" || roleName === "Applicant") {
    return {
      valid: false,
      reason: "Forbidden. External recruitment partners and candidates are restricted from transitioning workflows.",
    };
  }

  // HR Officer: restricted to early recruitment stages only
  if (roleName === "HR Officer") {
    const hrStages: WorkflowStage[] = ["APPLIED", "INTERVIEWED", "SELECTED"];
    if (!hrStages.includes(nextStage)) {
      return {
        valid: false,
        reason: `HR Officer permissions only allow transitioning to early recruitment stages (Applied, Interviewed, Selected). Attempted: ${nextStage}`,
      };
    }
  }

  // Documentation Officer: restricted to compliance stages only (Medical/Pre-departure)
  else if (roleName === "Documentation Officer") {
    const docStages: WorkflowStage[] = ["MEDICAL_WAITING", "MEDICAL_FIT", "MEDICAL_UNFIT", "TRAINING_COMPLETED"];
    if (!docStages.includes(nextStage)) {
      return {
        valid: false,
        reason: `Documentation Officer permissions only allow transitioning to compliance stages (Medical/Training). Attempted: ${nextStage}`,
      };
    }
  }

  // Visa Officer: restricted to consular/logistic stages only (Visa/Flight/Deployment)
  else if (roleName === "Visa Officer") {
    const visaStages: WorkflowStage[] = ["VISA_SUBMITTED", "VISA_STAMPED", "VISA_REJECTED", "TICKETED", "DEPLOYED"];
    if (!visaStages.includes(nextStage)) {
      return {
        valid: false,
        reason: `Visa Officer permissions only allow transitioning to consular/logistic stages (Visa/Ticket/Deployment). Attempted: ${nextStage}`,
      };
    }
  }

  // Other staff roles (e.g. Accounts Officer) are unauthorized
  else {
    return {
      valid: false,
      reason: `Forbidden. Role '${roleName}' does not possess stage transition clearance.`,
    };
  }

  // Verify transition path mapping complies with pipeline rules
  const allowed = ALLOWED_TRANSITIONS[currentStage];
  if (!allowed || !allowed.includes(nextStage)) {
    return {
      valid: false,
      reason: `Invalid pipeline path: Candidates cannot be transitioned directly from ${currentStage} to ${nextStage}.`,
    };
  }

  return { valid: true };
}

/**
 * Maps sensitive workflow stages to their required verified document types.
 */
export const DOCUMENT_PREREQUISITES: Record<string, string[]> = {
  MEDICAL_FIT: ["MEDICAL_REPORT"],
  VISA_SUBMITTED: ["PASSPORT"],
  VISA_STAMPED: ["VISA_STICKER"],
  TICKETED: ["AIR_TICKET"],
  DEPLOYED: ["PASSPORT", "MEDICAL_REPORT", "VISA_STICKER", "AIR_TICKET"],
};

