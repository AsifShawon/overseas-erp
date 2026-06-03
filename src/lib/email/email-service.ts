// src/lib/email/email-service.ts

import { prisma } from "../db";
import { emailConfig, isEmailConfigured } from "./config";
import { sendRawEmail } from "./mailer";
import {
  getCompanyOwnerActivationEmail,
  getCompanyUserInvitationEmail,
  getPasswordResetEmail,
  getPasswordChangedAlertEmail,
  getGenericNotificationEmail,
} from "./templates";

interface EmailServiceResult {
  sent: boolean;
  activationLink?: string;
  reason?: string;
  messageId?: string;
}

/**
 * High-level email helper to send emails and write EmailLog records.
 */
async function sendAndLog({
  toEmail,
  subject,
  html,
  text,
  templateKey,
  companyId,
  userId,
}: {
  toEmail: string;
  subject: string;
  html: string;
  text: string;
  templateKey: string;
  companyId?: string;
  userId?: string;
}): Promise<EmailServiceResult> {
  if (!isEmailConfigured()) {
    // Log as SKIPPED
    try {
      await prisma.emailLog.create({
        data: {
          toEmail,
          subject,
          templateKey,
          status: "SKIPPED",
          errorMessage: "SMTP not configured in environment variables",
          companyId: companyId || null,
          userId: userId || null,
        },
      });
    } catch (dbErr) {
      console.error("Failed to write SKIPPED EmailLog:", dbErr);
    }
    return {
      sent: false,
      reason: "SMTP not configured",
    };
  }

  const result = await sendRawEmail({ to: toEmail, subject, text, html });

  try {
    await prisma.emailLog.create({
      data: {
        toEmail,
        subject,
        templateKey,
        status: result.sent ? "SENT" : "FAILED",
        providerMessageId: result.messageId || null,
        errorMessage: result.reason || null,
        companyId: companyId || null,
        userId: userId || null,
      },
    });
  } catch (dbErr) {
    console.error("Failed to write EmailLog:", dbErr);
  }

  return {
    sent: result.sent,
    reason: result.reason,
    messageId: result.messageId,
  };
}

/**
 * 1. Send Company Owner Activation Email
 */
export async function sendCompanyOwnerActivation(
  email: string,
  fullName: string,
  companyName: string,
  token: string,
  companyId?: string,
  userId?: string
): Promise<EmailServiceResult> {
  const activationLink = `${emailConfig.appBaseUrl}/activate-account?token=${token}`;
  const { html, text, subject } = getCompanyOwnerActivationEmail({
    recipientName: fullName,
    companyName,
    actionUrl: activationLink,
    expiryHours: 24,
    supportEmail: "support@visatek-erp.com",
  });

  const res = await sendAndLog({
    toEmail: email,
    subject,
    html,
    text,
    templateKey: "COMPANY_OWNER_ACTIVATION",
    companyId,
    userId,
  });

  return { ...res, activationLink };
}

/**
 * 2. Send Company User Invitation Email
 */
export async function sendCompanyUserInvitation(
  email: string,
  fullName: string,
  companyName: string,
  token: string,
  companyId?: string,
  userId?: string
): Promise<EmailServiceResult> {
  const activationLink = `${emailConfig.appBaseUrl}/activate-account?token=${token}`;
  const { html, text, subject } = getCompanyUserInvitationEmail({
    recipientName: fullName,
    companyName,
    actionUrl: activationLink,
    expiryHours: 24,
    supportEmail: "support@visatek-erp.com",
  });

  const res = await sendAndLog({
    toEmail: email,
    subject,
    html,
    text,
    templateKey: "COMPANY_USER_INVITATION",
    companyId,
    userId,
  });

  return { ...res, activationLink };
}

/**
 * 3. Send Password Reset / Activation Link Email
 */
export async function sendPasswordReset(
  email: string,
  fullName: string,
  token: string,
  companyId?: string,
  userId?: string
): Promise<EmailServiceResult> {
  const resetLink = `${emailConfig.appBaseUrl}/activate-account?token=${token}`;
  const { html, text, subject } = getPasswordResetEmail({
    recipientName: fullName,
    actionUrl: resetLink,
    expiryHours: 24,
    supportEmail: "support@visatek-erp.com",
  });

  const res = await sendAndLog({
    toEmail: email,
    subject,
    html,
    text,
    templateKey: "PASSWORD_RESET",
    companyId,
    userId,
  });

  return { ...res, activationLink: resetLink };
}

/**
 * 4. Send Password Changed Alert Email
 */
export async function sendPasswordChangedAlert(
  email: string,
  fullName: string,
  companyId?: string,
  userId?: string
): Promise<EmailServiceResult> {
  const { html, text, subject } = getPasswordChangedAlertEmail({
    recipientName: fullName,
    supportEmail: "support@visatek-erp.com",
  });

  return await sendAndLog({
    toEmail: email,
    subject,
    html,
    text,
    templateKey: "PASSWORD_CHANGED_ALERT",
    companyId,
    userId,
  });
}

/**
 * 5. Send SMTP Test Email
 */
export async function sendSmtpTestEmail(
  toEmail: string,
  adminUserId?: string
): Promise<EmailServiceResult> {
  const { html, text, subject } = getGenericNotificationEmail({
    recipientName: "Platform Administrator",
    customMessage: "This is a test email to verify that your global SMTP configuration is active and working correctly in VisaTek ERP.",
    supportEmail: "support@visatek-erp.com",
  });

  return await sendAndLog({
    toEmail,
    subject: "SMTP Test Email - VisaTek ERP",
    html,
    text,
    templateKey: "SMTP_TEST_EMAIL",
    userId: adminUserId,
  });
}

/**
 * J. Notification integration groundwork helper.
 * Call this to log important alerts that could be emailed in the future.
 */
export async function sendImportantEmailNotification(
  toEmail: string,
  recipientName: string,
  customMessage: string,
  templateKey: string,
  companyId?: string,
  userId?: string
): Promise<EmailServiceResult> {
  const { html, text, subject } = getGenericNotificationEmail({
    recipientName,
    customMessage,
    supportEmail: "support@visatek-erp.com",
  });

  return await sendAndLog({
    toEmail,
    subject: `VisaTek ERP - ${subject}`,
    html,
    text,
    templateKey,
    companyId,
    userId,
  });
}
