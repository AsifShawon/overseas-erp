// Role-Based Access Control configuration for Overseas Recruitment ERP

export type PermissionCode =
  | "VIEW_DASHBOARD"
  | "VIEW_APPLICANTS"
  | "CREATE_APPLICANT"
  | "UPDATE_APPLICANT"
  | "ARCHIVE_APPLICANT"
  | "TRANSITION_WORKFLOW"
  | "UPLOAD_DOCUMENT"
  | "VERIFY_DOCUMENT"
  | "MANAGE_AGENTS"
  | "RECORD_PAYMENT"
  | "VIEW_ACCOUNTS"
  | "VIEW_COMMISSIONS"
  | "VIEW_REPORTS"
  | "VIEW_AUDIT_LOGS"
  | "MANAGE_RBAC"
  | "VIEW_NOTIFICATIONS"
  | "MANAGE_JOB_ORDERS";

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: PermissionCode[];
}

export const SYSTEM_ROLES: Record<string, Role> = {
  SUPER_ADMIN: {
    id: "role-super-admin",
    name: "Super Admin",
    description: "Ultimate system supervisor. Full permission overrides across all modules.",
    permissions: [
      "VIEW_DASHBOARD",
      "VIEW_APPLICANTS",
      "CREATE_APPLICANT",
      "UPDATE_APPLICANT",
      "ARCHIVE_APPLICANT",
      "TRANSITION_WORKFLOW",
      "UPLOAD_DOCUMENT",
      "VERIFY_DOCUMENT",
      "MANAGE_AGENTS",
      "RECORD_PAYMENT",
      "VIEW_ACCOUNTS",
      "VIEW_COMMISSIONS",
      "VIEW_REPORTS",
      "VIEW_AUDIT_LOGS",
      "MANAGE_RBAC",
      "VIEW_NOTIFICATIONS",
      "MANAGE_JOB_ORDERS",
    ],
  },
  OPERATIONS_ADMIN: {
    id: "role-operations-admin",
    name: "Operations Admin",
    description: "Day-to-day agency manager. Reviews pipelines and exports system reports.",
    permissions: [
      "VIEW_DASHBOARD",
      "VIEW_APPLICANTS",
      "CREATE_APPLICANT",
      "UPDATE_APPLICANT",
      "ARCHIVE_APPLICANT",
      "TRANSITION_WORKFLOW",
      "UPLOAD_DOCUMENT",
      "VERIFY_DOCUMENT",
      "MANAGE_AGENTS",
      "VIEW_ACCOUNTS",
      "VIEW_COMMISSIONS",
      "VIEW_REPORTS",
      "VIEW_AUDIT_LOGS",
      "VIEW_NOTIFICATIONS",
      "MANAGE_JOB_ORDERS",
    ],
  },
  HR_OFFICER: {
    id: "role-hr-officer",
    name: "HR Officer",
    description: "Handles applicant screening, interviews, pre-selection, and job order mapping.",
    permissions: [
      "VIEW_DASHBOARD",
      "VIEW_APPLICANTS",
      "CREATE_APPLICANT",
      "UPDATE_APPLICANT",
      "TRANSITION_WORKFLOW", // Limited to HR stages in UI
      "UPLOAD_DOCUMENT",
      "VIEW_NOTIFICATIONS",
    ],
  },
  DOCUMENTATION_OFFICER: {
    id: "role-documentation-officer",
    name: "Documentation Officer",
    description: "Manages compliance checklists, medical centers, training, and passport files.",
    permissions: [
      "VIEW_DASHBOARD",
      "VIEW_APPLICANTS",
      "TRANSITION_WORKFLOW", // Limited to compliance stages in UI
      "UPLOAD_DOCUMENT",
      "VERIFY_DOCUMENT",
      "VIEW_NOTIFICATIONS",
    ],
  },
  VISA_OFFICER: {
    id: "role-visa-officer",
    name: "Visa Officer",
    description: "Assembles embassy packets, visa sticker loggings, and consulate slots.",
    permissions: [
      "VIEW_DASHBOARD",
      "VIEW_APPLICANTS",
      "TRANSITION_WORKFLOW", // Limited to visa stages in UI
      "UPLOAD_DOCUMENT",
      "VIEW_NOTIFICATIONS",
    ],
  },
  ACCOUNTS_OFFICER: {
    id: "role-accounts-officer",
    name: "Accounts Officer",
    description: "Controls candidate invoices, payments, general ledger, and agent commissions.",
    permissions: [
      "VIEW_DASHBOARD",
      "VIEW_APPLICANTS",
      "VIEW_ACCOUNTS",
      "VIEW_COMMISSIONS",
      "RECORD_PAYMENT",
      "VIEW_REPORTS",
      "VIEW_NOTIFICATIONS",
    ],
  },
  AGENT: {
    id: "role-agent",
    name: "Agent",
    description: "External recruitment partner. Sourced cohort access limits apply.",
    permissions: [
      "VIEW_DASHBOARD",
      "VIEW_APPLICANTS", // Scoped cohort
      "CREATE_APPLICANT", // Scoped
      "UPDATE_APPLICANT", // Scoped
      "UPLOAD_DOCUMENT", // Scoped
      "VIEW_COMMISSIONS", // Scoped
      "VIEW_NOTIFICATIONS",
    ],
  },
  APPLICANT: {
    id: "role-applicant",
    name: "Applicant",
    description: "Placed candidate. Scoped to personal progress portal only.",
    permissions: [
      "VIEW_DASHBOARD", // Personal portal
      "UPLOAD_DOCUMENT", // Scoped
      "VIEW_NOTIFICATIONS",
    ],
  },
};

// Check if a role has a specific permission
export function hasPermission(roleName: string, permission: PermissionCode): boolean {
  const normalizedKey = roleName.toUpperCase().replace(/\s+/g, "_");
  const role = SYSTEM_ROLES[normalizedKey];
  if (!role) return false;
  return role.permissions.includes(permission);
}
