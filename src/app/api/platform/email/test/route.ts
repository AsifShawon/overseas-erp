// src/app/api/platform/email/test/route.ts
// POST /api/platform/email/test - Sends a test email to verify SMTP configuration

import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth";
import { sendSmtpTestEmail } from "@/lib/email/email-service";
import { isEmailConfigured } from "@/lib/email/config";
import { z } from "zod";

const TestEmailSchema = z.object({
  toEmail: z.string().email("Invalid email address"),
});

export async function POST(request: Request) {
  try {
    // 1. Guard access
    const adminCheck = await requirePlatformAdmin(request);
    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    // 2. Validate payload
    const body = await request.json().catch(() => ({}));
    const validatedData = TestEmailSchema.parse(body);

    // 3. Check if SMTP is configured
    if (!isEmailConfigured()) {
      return NextResponse.json({
        success: false,
        error: "SMTP configuration is missing from environment variables.",
      }, { status: 400 });
    }

    // 4. Send test email
    const result = await sendSmtpTestEmail(validatedData.toEmail, adminCheck.user.id);

    if (!result.sent) {
      return NextResponse.json({
        success: false,
        error: result.reason || "SMTP transmission failed.",
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Test email successfully sent.",
      messageId: result.messageId,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation failed." }, { status: 400 });
    }
    console.error("POST /api/platform/email/test Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
