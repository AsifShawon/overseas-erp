// src/lib/notifications/notification-service.ts
// Core notification service: createNotification, send email, send push, audience helpers.

import { prisma } from "@/lib/db";
import {
  CreateNotificationInput,
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  EMAIL_NOTIFICATION_TYPES,
  type NotificationTypeValue,
} from "./notification-types";
import {
  getCompanyAdminUserIds,
  getPlatformAdminUserIds,
  getAccountsTeamUserIds,
  getHrTeamUserIds,
  getDocumentationTeamUserIds,
  getVisaTeamUserIds,
  getUsersByRoleNamesInCompany,
} from "./role-targeting";
import { sendWebPushToUser, sendWebPushToUsers } from "./web-push";
import { sendImportantEmailNotification } from "@/lib/email/email-service";

// -----------------------------------------------------------
// CORE PRIMITIVE — create a single in-app notification
// -----------------------------------------------------------

export async function createNotification(
  input: CreateNotificationInput
): Promise<string | null> {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId:       input.userId,
        companyId:    input.companyId ?? null,
        branchId:     input.branchId  ?? null,
        title:        input.title,
        message:      input.message,
        type:         input.type         ?? NotificationType.GENERAL,
        priority:     input.priority     ?? NotificationPriority.NORMAL,
        channel:      input.channel      ?? NotificationChannel.IN_APP,
        targetRoleId: input.targetRoleId ?? null,
        relatedModel: input.relatedModel ?? null,
        relatedId:    input.relatedId    ?? null,
        actionUrl:    input.actionUrl    ?? null,
        dueAt:        input.dueAt        ?? null,
        isRead:       false,
      },
    });
    return notification.id;
  } catch (err) {
    console.error("[NotificationService] createNotification failed:", err);
    return null;
  }
}

// -----------------------------------------------------------
// EMAIL DELIVERY
// -----------------------------------------------------------

async function maybeSendEmail(
  userId: string,
  title: string,
  message: string,
  type: NotificationTypeValue,
  companyId?: string | null
): Promise<void> {
  if (!EMAIL_NOTIFICATION_TYPES.includes(type)) return;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true },
    });
    if (!user) return;

    // Check notification preferences
    const pref = await prisma.notificationPreference.findUnique({
      where: { userId },
    });
    if (pref && !pref.emailEnabled) return;

    await sendImportantEmailNotification(
      user.email,
      user.fullName,
      message,
      type,
      companyId ?? undefined,
      userId
    );
  } catch (err) {
    console.error("[NotificationService] maybeSendEmail failed:", err);
  }
}

// -----------------------------------------------------------
// PUSH DELIVERY
// -----------------------------------------------------------

async function maybeSendPush(
  userId: string,
  title: string,
  message: string,
  actionUrl?: string,
  type?: string
): Promise<void> {
  try {
    const pref = await prisma.notificationPreference.findUnique({
      where: { userId },
    });
    if (pref && !pref.pushEnabled) return;

    await sendWebPushToUser(userId, { title, message, actionUrl, type });
  } catch (err) {
    console.error("[NotificationService] maybeSendPush failed:", err);
  }
}

// -----------------------------------------------------------
// notifyUser — notify a single user via all channels
// -----------------------------------------------------------

export interface NotifyUserOptions extends CreateNotificationInput {
  sendEmail?: boolean;
  sendPush?: boolean;
}

export async function notifyUser(opts: NotifyUserOptions): Promise<void> {
  // Always create in-app notification (check preferences later if needed)
  await createNotification(opts);

  const type = opts.type ?? NotificationType.GENERAL;

  if (opts.sendEmail !== false) {
    await maybeSendEmail(opts.userId, opts.title, opts.message, type as NotificationTypeValue, opts.companyId);
  }
  if (opts.sendPush !== false) {
    await maybeSendPush(opts.userId, opts.title, opts.message, opts.actionUrl, type);
  }
}

// -----------------------------------------------------------
// notifyUsers — bulk notify a list of users
// -----------------------------------------------------------

export async function notifyUsers(
  userIds: string[],
  opts: Omit<NotifyUserOptions, "userId">
): Promise<void> {
  if (userIds.length === 0) return;
  await Promise.allSettled(
    userIds.map((uid) => notifyUser({ ...opts, userId: uid }))
  );
}

// -----------------------------------------------------------
// notifyRole — notify all members of a role in a company
// -----------------------------------------------------------

export async function notifyRole(
  companyId: string,
  roleNames: string[],
  opts: Omit<NotifyUserOptions, "userId" | "companyId">
): Promise<void> {
  const userIds = await getUsersByRoleNamesInCompany(companyId, roleNames);
  await notifyUsers(userIds, { ...opts, companyId });
}

// -----------------------------------------------------------
// notifyCompanyAdmins — notify owner/admin roles in company
// -----------------------------------------------------------

export async function notifyCompanyAdmins(
  companyId: string,
  opts: Omit<NotifyUserOptions, "userId" | "companyId">
): Promise<void> {
  const userIds = await getCompanyAdminUserIds(companyId);
  await notifyUsers(userIds, { ...opts, companyId });
}

// -----------------------------------------------------------
// notifyPlatformAdmins — notify only platform admin users
// -----------------------------------------------------------

export async function notifyPlatformAdmins(
  opts: Omit<NotifyUserOptions, "userId" | "companyId">
): Promise<void> {
  const userIds = await getPlatformAdminUserIds();
  await notifyUsers(userIds, { ...opts, companyId: null });
}

// -----------------------------------------------------------
// Audience shortcuts
// -----------------------------------------------------------

export async function notifyAccountsTeam(
  companyId: string,
  opts: Omit<NotifyUserOptions, "userId" | "companyId">
): Promise<void> {
  const userIds = await getAccountsTeamUserIds(companyId);
  await notifyUsers(userIds, { ...opts, companyId });
}

export async function notifyHrTeam(
  companyId: string,
  opts: Omit<NotifyUserOptions, "userId" | "companyId">
): Promise<void> {
  const userIds = await getHrTeamUserIds(companyId);
  await notifyUsers(userIds, { ...opts, companyId });
}

export async function notifyDocumentationTeam(
  companyId: string,
  opts: Omit<NotifyUserOptions, "userId" | "companyId">
): Promise<void> {
  const userIds = await getDocumentationTeamUserIds(companyId);
  await notifyUsers(userIds, { ...opts, companyId });
}

export async function notifyVisaTeam(
  companyId: string,
  opts: Omit<NotifyUserOptions, "userId" | "companyId">
): Promise<void> {
  const userIds = await getVisaTeamUserIds(companyId);
  await notifyUsers(userIds, { ...opts, companyId });
}

export async function notifyApplicant(
  applicantId: string,
  companyId: string,
  opts: Omit<NotifyUserOptions, "userId" | "companyId">
): Promise<void> {
  try {
    const applicant = await prisma.applicant.findFirst({
      where: { id: applicantId, companyId },
      select: { userId: true },
    });
    if (applicant?.userId) {
      await notifyUser({ ...opts, userId: applicant.userId, companyId, relatedId: applicantId, relatedModel: "Applicant" });
    }
  } catch (err) {
    console.error("[NotificationService] notifyApplicant failed:", err);
  }
}

export async function notifyAgent(
  agentId: string,
  companyId: string,
  opts: Omit<NotifyUserOptions, "userId" | "companyId">
): Promise<void> {
  try {
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, companyId },
      select: { userId: true },
    });
    if (agent?.userId) {
      await notifyUser({ ...opts, userId: agent.userId, companyId, relatedId: agentId, relatedModel: "Agent" });
    }
  } catch (err) {
    console.error("[NotificationService] notifyAgent failed:", err);
  }
}
