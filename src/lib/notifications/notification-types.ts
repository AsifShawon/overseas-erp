// src/lib/notifications/notification-types.ts
// Central registry of all notification type codes, priorities, and channels.

export const NotificationType = {
  // Auth / Account
  ACCOUNT_ACTIVATION:           "ACCOUNT_ACTIVATION",
  TEMP_LOGIN_OR_INVITE:         "TEMP_LOGIN_OR_INVITE",
  PASSWORD_CHANGED:             "PASSWORD_CHANGED",

  // Company lifecycle
  COMPANY_APPROVED:             "COMPANY_APPROVED",
  COMPANY_REJECTED:             "COMPANY_REJECTED",
  COMPANY_SUSPENDED:            "COMPANY_SUSPENDED",

  // Applicant workflow
  APPLICANT_CREATED:            "APPLICANT_CREATED",
  APPLICANT_STAGE_CHANGED:      "APPLICANT_STAGE_CHANGED",
  APPLICANT_DOCUMENT_MISSING:   "APPLICANT_DOCUMENT_MISSING",
  APPLICANT_DOCUMENT_UPLOADED:  "APPLICANT_DOCUMENT_UPLOADED",
  DOCUMENT_VERIFICATION_REQUIRED: "DOCUMENT_VERIFICATION_REQUIRED",
  DOCUMENT_REJECTED:            "DOCUMENT_REJECTED",

  // Due date reminders – workflow milestones
  INTERVIEW_DUE:                "INTERVIEW_DUE",
  MEDICAL_DUE:                  "MEDICAL_DUE",
  BMET_DUE:                     "BMET_DUE",
  VISA_FOLLOWUP_DUE:            "VISA_FOLLOWUP_DUE",
  TICKET_DUE:                   "TICKET_DUE",
  DEPLOYMENT_DUE:               "DEPLOYMENT_DUE",

  // Finance
  PAYMENT_DUE:                  "PAYMENT_DUE",
  PAYMENT_RECEIVED:             "PAYMENT_RECEIVED",
  INVOICE_CREATED:              "INVOICE_CREATED",
  INVOICE_DUE_TOMORROW:         "INVOICE_DUE_TOMORROW",
  INVOICE_OVERDUE:              "INVOICE_OVERDUE",
  RECEIPT_CREATED:              "RECEIPT_CREATED",

  // Commission
  COMMISSION_DUE:               "COMMISSION_DUE",
  COMMISSION_PAID:              "COMMISSION_PAID",

  // Tasks
  TASK_ASSIGNED:                "TASK_ASSIGNED",
  TASK_DUE_TOMORROW:            "TASK_DUE_TOMORROW",
  TASK_OVERDUE:                 "TASK_OVERDUE",

  // Platform
  PLATFORM_NEW_COMPANY_APPLICATION: "PLATFORM_NEW_COMPANY_APPLICATION",
  PLATFORM_COMPANY_APPROVED:    "PLATFORM_COMPANY_APPROVED",
  PLATFORM_SMTP_FAILURE:        "PLATFORM_SMTP_FAILURE",

  // General
  GENERAL:                      "GENERAL",
} as const;

export type NotificationTypeValue = (typeof NotificationType)[keyof typeof NotificationType];

export const NotificationPriority = {
  LOW:      "LOW",
  NORMAL:   "NORMAL",
  HIGH:     "HIGH",
  CRITICAL: "CRITICAL",
} as const;

export type NotificationPriorityValue = (typeof NotificationPriority)[keyof typeof NotificationPriority];

export const NotificationChannel = {
  IN_APP:   "IN_APP",
  EMAIL:    "EMAIL",
  WEB_PUSH: "WEB_PUSH",
  MULTI:    "MULTI",
} as const;

export type NotificationChannelValue = (typeof NotificationChannel)[keyof typeof NotificationChannel];

/** Types that must always be sent regardless of user preferences. */
export const CRITICAL_NOTIFICATION_TYPES: NotificationTypeValue[] = [
  NotificationType.PASSWORD_CHANGED,
  NotificationType.ACCOUNT_ACTIVATION,
  NotificationType.COMPANY_SUSPENDED,
  NotificationType.PLATFORM_SMTP_FAILURE,
];

/** Notification types that should trigger email sending. */
export const EMAIL_NOTIFICATION_TYPES: NotificationTypeValue[] = [
  NotificationType.ACCOUNT_ACTIVATION,
  NotificationType.TEMP_LOGIN_OR_INVITE,
  NotificationType.PASSWORD_CHANGED,
  NotificationType.COMPANY_APPROVED,
  NotificationType.COMPANY_REJECTED,
  NotificationType.COMPANY_SUSPENDED,
  NotificationType.INVOICE_CREATED,
  NotificationType.INVOICE_DUE_TOMORROW,
  NotificationType.INVOICE_OVERDUE,
  NotificationType.PAYMENT_RECEIVED,
  NotificationType.RECEIPT_CREATED,
  NotificationType.COMMISSION_DUE,
  NotificationType.COMMISSION_PAID,
  NotificationType.TASK_DUE_TOMORROW,
  NotificationType.TASK_OVERDUE,
  NotificationType.PLATFORM_NEW_COMPANY_APPLICATION,
  NotificationType.PLATFORM_SMTP_FAILURE,
];

export interface CreateNotificationInput {
  userId: string;
  companyId?: string | null;
  title: string;
  message: string;
  type?: NotificationTypeValue;
  priority?: NotificationPriorityValue;
  channel?: NotificationChannelValue;
  targetRoleId?: string;
  relatedModel?: string;
  relatedId?: string;
  actionUrl?: string;
  dueAt?: Date;
}
