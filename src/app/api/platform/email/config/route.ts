// src/app/api/platform/email/config/route.ts
// GET /api/platform/email/config - Expose SMTP settings metadata safely (omitting password/secrets)

import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth";
import { emailConfig, isEmailConfigured } from "@/lib/email/config";

export async function GET(request: Request) {
  try {
    const adminCheck = await requirePlatformAdmin(request);
    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    return NextResponse.json({
      configured: isEmailConfigured(),
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      user: emailConfig.user,
      fromEmail: emailConfig.fromEmail,
      fromName: emailConfig.fromName,
    });
  } catch (error) {
    console.error("GET /api/platform/email/config Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
