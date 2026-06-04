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

/**
 * Resolves the absolute application base URL dynamically from the request headers or URL origin,
 * with fallbacks for production environment and configuration.
 */
export function resolveBaseUrl(request: Request): string {
  const xForwardedHost = request.headers.get("x-forwarded-host");
  const host = request.headers.get("host");
  const xForwardedProto = request.headers.get("x-forwarded-proto") || "https";

  const finalHost = xForwardedHost || host;
  
  if (finalHost && !finalHost.includes("localhost") && !finalHost.includes("127.0.0.1")) {
    return `${xForwardedProto}://${finalHost}`;
  }

  try {
    const { origin } = new URL(request.url);
    if (origin && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
      return origin;
    }
  } catch (e) {}

  if (process.env.NODE_ENV === "production") {
    return "https://visatek.fleek.com.bd";
  }

  return emailConfig.appBaseUrl;
}
