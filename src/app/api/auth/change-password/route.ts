// src/app/api/auth/change-password/route.ts
// POST /api/auth/change-password

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import * as argon2 from "argon2";
import { z } from "zod";
import { sendPasswordChangedAlert } from "@/lib/email/email-service";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string()
    .min(8, "New password must be at least 8 characters long.")
    .regex(/[a-z]/, "New password must contain at least one lowercase letter.")
    .regex(/[A-Z]/, "New password must contain at least one uppercase letter.")
    .regex(/\d/, "New password must contain at least one number.")
    .regex(/[!@#$%^&*(),.?":{}|<>_+\-\[\]\/\\~`|';]/, "New password must contain at least one special character (e.g., #, @, !, etc.)."),
  confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters long."),
});

export async function POST(request: Request) {
  try {
    // 1. Authenticate request using Bearer JWT
    const decoded = await authenticateRequest(request);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in again." }, { status: 401 });
    }

    // 2. Validate payload structure
    const body = await request.json().catch(() => ({}));
    const validatedData = ChangePasswordSchema.parse(body);

    const { currentPassword, newPassword, confirmPassword } = validatedData;

    // 3. Payload business validation
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "New password and confirmation password do not match." }, { status: 400 });
    }

    if (newPassword === currentPassword) {
      return NextResponse.json({ error: "New password cannot be the same as your current password." }, { status: 400 });
    }

    // 4. Retrieve user from the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "Your account is deactivated." }, { status: 401 });
    }

    // 5. Verify current password using argon2
    const isCurrentPasswordValid = await argon2.verify(user.passwordHash, currentPassword);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: "The current password you entered is incorrect." }, { status: 400 });
    }

    // 6. Hash new password with argon2
    const newPasswordHash = await argon2.hash(newPassword);

    // 7. Update User credentials atomically in DB
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
    });

    // 8. Create a secure, immutable AuditLog entry (strictly excluding plain password or hashes)
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        roleName: user.role.name,
        actionType: "PASSWORD_CHANGED",
        tableName: "User",
        recordId: user.id,
        companyId: decoded.activeCompanyId || null,
        delta: {
          email: user.email,
          fullName: user.fullName,
          mustChangePasswordChanged: true,
          passwordChangedAt: updatedUser.passwordChangedAt,
        } as any,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    // 9. Send email notification (failsafe, do not block main flow)
    try {
      await sendPasswordChangedAlert(
        user.email,
        user.fullName,
        decoded.activeCompanyId || undefined,
        user.id
      );
    } catch (emailErr) {
      console.error("Failsafe: failed to send password changed alert email:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Your password has been changed successfully.",
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation failed." }, { status: 400 });
    }
    console.error("POST /api/auth/change-password Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
