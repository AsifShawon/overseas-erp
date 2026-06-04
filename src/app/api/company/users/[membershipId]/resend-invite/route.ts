// src/app/api/company/users/[membershipId]/resend-invite/route.ts
// POST /api/company/users/[membershipId]/resend-invite - Resends the activation link or resets invite password

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCompanyContext } from "@/lib/auth";
import { sendCompanyUserInvitation } from "@/lib/email/email-service";
import { resolveBaseUrl } from "@/lib/email/config";
import crypto from "crypto";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ membershipId: string }> }
) {
  try {
    const origin = resolveBaseUrl(request);
    const ctx = await requireCompanyContext(request);
    if (!ctx || !ctx.activeCompanyId) {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }

    const hasPermission = ctx.permissions.includes("RESET_COMPANY_USER_PASSWORD") || ctx.permissions.includes("INVITE_COMPANY_USER");
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 });
    }

    const { membershipId } = await params;

    const membership = await prisma.userMembership.findUnique({
      where: { id: membershipId },
      include: { user: true, company: true },
    });

    if (!membership || membership.companyId !== ctx.activeCompanyId) {
      return NextResponse.json({ error: "Membership not found in this company." }, { status: 404 });
    }

    // Generate new token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // Invalidate old tokens for this user
    await prisma.accountActivationToken.updateMany({
      where: {
        userId: membership.userId,
        usedAt: null,
      },
      data: {
        usedAt: new Date(), // Mark as used/invalidated
      },
    });

    // Create new token
    await prisma.accountActivationToken.create({
      data: {
        userId: membership.userId,
        companyId: ctx.activeCompanyId,
        tokenHash,
        type: "COMPANY_USER_INVITATION",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    let emailSent = false;
    let emailWarning: string | null = null;
    let activationLink = `${origin}/activate-account?token=${rawToken}`;

    try {
      const emailRes = await sendCompanyUserInvitation(
        membership.user.email,
        membership.user.fullName,
        membership.company.name,
        rawToken,
        ctx.activeCompanyId,
        membership.userId,
        origin
      );
      emailSent = emailRes.sent;
      activationLink = emailRes.activationLink || activationLink;
      if (!emailRes.sent) {
        emailWarning = emailRes.reason || "SMTP not configured.";
      }
    } catch (err: any) {
      console.error("Failsafe: failed to send resend-invite email:", err);
      emailWarning = err.message || "Failed to transmit activation email.";
    }

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: ctx.userId,
        roleName: ctx.roleName,
        actionType: "RESEND_COMPANY_USER_INVITE",
        tableName: "UserMembership",
        recordId: membershipId,
        companyId: ctx.activeCompanyId,
        delta: {
          resendUserId: membership.userId,
          resendUserEmail: membership.user.email,
        } as any,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json({
      success: true,
      emailSent,
      emailWarning,
      activationLink,
    });
  } catch (error) {
    console.error("POST /api/company/users/[membershipId]/resend-invite Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
