// src/lib/email/mailer.ts

import nodemailer from "nodemailer";
import { emailConfig, isEmailConfigured } from "./config";

interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

interface SendMailResult {
  sent: boolean;
  reason?: string;
  messageId?: string;
}

export async function sendRawEmail(options: SendMailOptions): Promise<SendMailResult> {
  if (!isEmailConfigured()) {
    return {
      sent: false,
      reason: "SMTP is not configured in environment variables.",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
      },
    });

    const mailOptions = {
      from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    return {
      sent: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error("Mailer Error:", error);
    return {
      sent: false,
      reason: error.message || "Unknown SMTP delivery error",
    };
  }
}
