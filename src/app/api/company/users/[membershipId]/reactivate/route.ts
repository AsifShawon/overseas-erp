// src/app/api/company/users/[membershipId]/reactivate/route.ts
// POST /api/company/users/[membershipId]/reactivate - Reactivate a suspended company user

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCompanyContext } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ membershipId: string }> }
) {
  try {
    const ctx = await requireCompanyContext(request);
    if (!ctx || !ctx.activeCompanyId) {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }

    const hasPermission = ctx.permissions.includes("SUSPEND_COMPANY_USER") || ctx.permissions.includes("UPDATE_COMPANY_USER");
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 });
    }

    const { membershipId } = await params;

    const membership = await prisma.userMembership.findUnique({
      where: { id: membershipId },
      include: { user: true },
    });

    if (!membership || membership.companyId !== ctx.activeCompanyId) {
      return NextResponse.json({ error: "Membership not found in this company." }, { status: 404 });
    }

    // Set global user back to active if they were deactivated
    if (!membership.user.isActive) {
      await prisma.user.update({
        where: { id: membership.userId },
        data: { isActive: true },
      });
    }

    // Determine status (if they have set a password or logged in)
    // If they have mustChangePassword or their password has not been changed yet and they were newly invited, they might remain INVITED.
    // Let's set membership status to ACTIVE or INVITED depending on password activation state.
    // An invited user has mustChangePassword or passwordChangedAt === null.
    const newStatus = (membership.user.mustChangePassword || !membership.user.passwordChangedAt) ? "INVITED" : "ACTIVE";

    const updatedMembership = await prisma.userMembership.update({
      where: { id: membershipId },
      data: { status: newStatus },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: ctx.userId,
        roleName: ctx.roleName,
        actionType: "REACTIVATE_COMPANY_USER",
        tableName: "UserMembership",
        recordId: membershipId,
        companyId: ctx.activeCompanyId,
        delta: {
          reactivatedUserId: membership.userId,
          reactivatedUserEmail: membership.user.email,
          membershipStatus: newStatus,
        } as any,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json(updatedMembership);
  } catch (error) {
    console.error("POST /api/company/users/[membershipId]/reactivate Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
