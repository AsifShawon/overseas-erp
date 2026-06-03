// src/lib/notifications/due-reminders.ts
// Due reminder scanning logic called by the cron endpoint.

import { prisma } from "@/lib/db";
import {
  notifyAccountsTeam,
  notifyHrTeam,
  notifyVisaTeam,
  notifyDocumentationTeam,
  notifyApplicant,
  notifyAgent,
  notifyCompanyAdmins,
  notifyUsers,
} from "./notification-service";
import { NotificationType, NotificationPriority } from "./notification-types";

// -------------------------------------------------------
// DEDUPLICATION HELPER
// -------------------------------------------------------

/**
 * Returns true if a reminder has already been sent for this key+date.
 * Uses ReminderLog with unique constraint to prevent duplicate sends.
 */
async function hasReminderBeenSent(
  reminderKey: string,
  reminderDate: Date,
  companyId?: string | null
): Promise<boolean> {
  const dateOnly = new Date(reminderDate.toISOString().split("T")[0] + "T00:00:00.000Z");
  const existing = await prisma.reminderLog.findFirst({
    where: {
      companyId: companyId ?? null,
      reminderKey,
      reminderDate: dateOnly,
    },
  });
  return !!existing;
}

async function markReminderSent(
  reminderKey: string,
  reminderDate: Date,
  relatedModel?: string,
  relatedId?: string,
  companyId?: string | null
): Promise<void> {
  const dateOnly = new Date(reminderDate.toISOString().split("T")[0] + "T00:00:00.000Z");
  try {
    await prisma.reminderLog.create({
      data: {
        companyId: companyId ?? null,
        reminderKey,
        relatedModel: relatedModel ?? null,
        relatedId:    relatedId    ?? null,
        reminderDate: dateOnly,
      },
    });
  } catch {
    // Unique constraint violation = already logged — ignore
  }
}

// -------------------------------------------------------
// DATE WINDOW HELPERS
// -------------------------------------------------------

function getTomorrow(): { start: Date; end: Date } {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getNow(): Date {
  return new Date();
}

function getToday(): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// -------------------------------------------------------
// 1. Invoice due tomorrow
// -------------------------------------------------------

export async function scanInvoicesDueTomorrow(): Promise<number> {
  const { start, end } = getTomorrow();
  const invoices = await prisma.invoice.findMany({
    where: {
      dueDate: { gte: start, lte: end },
      outstanding: { gt: 0 },
      companyId: { not: null },
    },
    include: { applicant: { select: { id: true, userId: true, agentId: true, fullName: true } } },
  });

  let count = 0;
  for (const inv of invoices) {
    const key = `invoice_due_tomorrow:${inv.id}`;
    if (await hasReminderBeenSent(key, new Date(), inv.companyId)) continue;

    const title = "Invoice Due Tomorrow";
    const message = `Invoice ${inv.invoiceNo} for ${inv.applicant?.fullName ?? "applicant"} is due tomorrow. Outstanding: ৳${Number(inv.outstanding).toLocaleString()}.`;
    const actionUrl = `/receipts-invoices`;

    await notifyAccountsTeam(inv.companyId!, {
      title, message, actionUrl,
      type: NotificationType.INVOICE_DUE_TOMORROW,
      priority: NotificationPriority.HIGH,
      relatedModel: "Invoice", relatedId: inv.id,
      sendEmail: true,
    });

    // Also notify applicant if they have a portal account
    if (inv.applicant?.userId) {
      await notifyApplicant(inv.applicantId, inv.companyId!, {
        title, message: `Your payment invoice ${inv.invoiceNo} is due tomorrow.`, actionUrl,
        type: NotificationType.INVOICE_DUE_TOMORROW,
        priority: NotificationPriority.HIGH,
      });
    }

    await markReminderSent(key, new Date(), "Invoice", inv.id, inv.companyId);
    count++;
  }
  return count;
}

// -------------------------------------------------------
// 2. Invoice overdue
// -------------------------------------------------------

export async function scanInvoicesOverdue(): Promise<number> {
  const invoices = await prisma.invoice.findMany({
    where: {
      dueDate: { lt: new Date() },
      outstanding: { gt: 0 },
      companyId: { not: null },
    },
    include: { applicant: { select: { id: true, userId: true, fullName: true } } },
  });

  let count = 0;
  for (const inv of invoices) {
    const key = `invoice_overdue:${inv.id}`;
    if (await hasReminderBeenSent(key, new Date(), inv.companyId)) continue;

    const title = "Invoice Overdue";
    const message = `Invoice ${inv.invoiceNo} for ${inv.applicant?.fullName ?? "applicant"} is overdue. Outstanding: ৳${Number(inv.outstanding).toLocaleString()}.`;
    const actionUrl = `/receipts-invoices`;

    await notifyAccountsTeam(inv.companyId!, {
      title, message, actionUrl,
      type: NotificationType.INVOICE_OVERDUE,
      priority: NotificationPriority.CRITICAL,
      relatedModel: "Invoice", relatedId: inv.id,
      sendEmail: true,
    });

    await markReminderSent(key, new Date(), "Invoice", inv.id, inv.companyId);
    count++;
  }
  return count;
}

// -------------------------------------------------------
// 3. Task due tomorrow
// -------------------------------------------------------

export async function scanTasksDueTomorrow(): Promise<number> {
  const { start, end } = getTomorrow();
  const tasks = await prisma.task.findMany({
    where: {
      dueAt: { gte: start, lte: end },
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
  });

  let count = 0;
  for (const task of tasks) {
    const key = `task_due_tomorrow:${task.id}`;
    if (await hasReminderBeenSent(key, new Date(), task.companyId)) continue;

    const title = "Task Due Tomorrow";
    const message = `Task "${task.title}" is due tomorrow.`;
    const actionUrl = `/tasks`;

    const userIds: string[] = [];
    if (task.assignedToId) userIds.push(task.assignedToId);

    if (task.assignedRoleId) {
      const roleUsers = await prisma.userMembership.findMany({
        where: { companyId: task.companyId, roleId: task.assignedRoleId, status: "ACTIVE" },
        select: { userId: true },
      });
      userIds.push(...roleUsers.map((m) => m.userId));
    }

    if (userIds.length > 0) {
      await notifyUsers([...new Set(userIds)], {
        title, message, actionUrl,
        companyId: task.companyId,
        type: NotificationType.TASK_DUE_TOMORROW,
        priority: NotificationPriority.HIGH,
        relatedModel: "Task", relatedId: task.id,
        sendEmail: true,
      });
    }

    await markReminderSent(key, new Date(), "Task", task.id, task.companyId);
    count++;
  }
  return count;
}

// -------------------------------------------------------
// 4. Task overdue
// -------------------------------------------------------

export async function scanTasksOverdue(): Promise<number> {
  const tasks = await prisma.task.findMany({
    where: {
      dueAt: { lt: new Date() },
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
  });

  let count = 0;
  for (const task of tasks) {
    const key = `task_overdue:${task.id}`;
    if (await hasReminderBeenSent(key, new Date(), task.companyId)) continue;

    const title = "Task Overdue";
    const message = `Task "${task.title}" is overdue and still pending.`;
    const actionUrl = `/tasks`;

    const userIds: string[] = [];
    if (task.assignedToId) userIds.push(task.assignedToId);
    if (task.assignedRoleId) {
      const roleUsers = await prisma.userMembership.findMany({
        where: { companyId: task.companyId, roleId: task.assignedRoleId, status: "ACTIVE" },
        select: { userId: true },
      });
      userIds.push(...roleUsers.map((m) => m.userId));
    }

    if (userIds.length > 0) {
      await notifyUsers([...new Set(userIds)], {
        title, message, actionUrl,
        companyId: task.companyId,
        type: NotificationType.TASK_OVERDUE,
        priority: NotificationPriority.CRITICAL,
        relatedModel: "Task", relatedId: task.id,
        sendEmail: true,
      });
    }

    await notifyCompanyAdmins(task.companyId, {
      title: `Overdue Task Alert`, message,
      type: NotificationType.TASK_OVERDUE,
      priority: NotificationPriority.HIGH,
      relatedModel: "Task", relatedId: task.id,
    });

    await markReminderSent(key, new Date(), "Task", task.id, task.companyId);
    count++;
  }
  return count;
}

// -------------------------------------------------------
// 5. Commission due (unpaid ACCRUED commissions > 30 days old)
// -------------------------------------------------------

export async function scanCommissionsDue(): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const commissions = await prisma.commission.findMany({
    where: {
      status: "ACCRUED",
      createdAt: { lt: thirtyDaysAgo },
      companyId: { not: null },
    },
    include: {
      agent: { select: { id: true, userId: true, agentCode: true } },
    },
  });

  let count = 0;
  for (const com of commissions) {
    const key = `commission_due:${com.id}`;
    if (await hasReminderBeenSent(key, new Date(), com.companyId)) continue;

    const title = "Commission Payment Overdue";
    const message = `Commission of ৳${Number(com.amount).toLocaleString()} for agent ${com.agent?.agentCode ?? ""} has been accrued for 30+ days.`;

    await notifyAccountsTeam(com.companyId!, {
      title, message,
      type: NotificationType.COMMISSION_DUE,
      priority: NotificationPriority.HIGH,
      relatedModel: "Commission", relatedId: com.id,
      sendEmail: true,
    });

    if (com.agent?.userId) {
      await notifyAgent(com.agentId, com.companyId!, {
        title: "Commission Pending", message: `Your commission of ৳${Number(com.amount).toLocaleString()} is pending payment.`,
        type: NotificationType.COMMISSION_DUE,
        priority: NotificationPriority.NORMAL,
      });
    }

    await markReminderSent(key, new Date(), "Commission", com.id, com.companyId);
    count++;
  }
  return count;
}

// -------------------------------------------------------
// Master runner — called by cron endpoint
// -------------------------------------------------------

export interface ReminderScanResult {
  invoicesDueTomorrow: number;
  invoicesOverdue: number;
  tasksDueTomorrow: number;
  tasksOverdue: number;
  commissionsDue: number;
  errors: string[];
}

export async function runAllDueReminders(): Promise<ReminderScanResult> {
  const result: ReminderScanResult = {
    invoicesDueTomorrow: 0,
    invoicesOverdue:     0,
    tasksDueTomorrow:    0,
    tasksOverdue:        0,
    commissionsDue:      0,
    errors:              [],
  };

  await Promise.allSettled([
    scanInvoicesDueTomorrow().then((n) => (result.invoicesDueTomorrow = n)).catch((e) => result.errors.push(`invoicesDueTomorrow: ${e.message}`)),
    scanInvoicesOverdue().then((n) => (result.invoicesOverdue = n)).catch((e) => result.errors.push(`invoicesOverdue: ${e.message}`)),
    scanTasksDueTomorrow().then((n) => (result.tasksDueTomorrow = n)).catch((e) => result.errors.push(`tasksDueTomorrow: ${e.message}`)),
    scanTasksOverdue().then((n) => (result.tasksOverdue = n)).catch((e) => result.errors.push(`tasksOverdue: ${e.message}`)),
    scanCommissionsDue().then((n) => (result.commissionsDue = n)).catch((e) => result.errors.push(`commissionsDue: ${e.message}`)),
  ]);

  return result;
}
