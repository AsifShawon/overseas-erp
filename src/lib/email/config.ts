// src/lib/email/config.ts

export const emailConfig = {
  host: process.env.SMTP_HOST || "",
  port: Number(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  user: process.env.SMTP_USER || "",
  pass: process.env.SMTP_PASS || "",
  fromName: process.env.SMTP_FROM_NAME || "VisaTek ERP",
  fromEmail: process.env.SMTP_FROM_EMAIL || "",
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:3000",
};

export function isEmailConfigured(): boolean {
  return !!(emailConfig.host && emailConfig.user && emailConfig.pass && emailConfig.fromEmail);
}
