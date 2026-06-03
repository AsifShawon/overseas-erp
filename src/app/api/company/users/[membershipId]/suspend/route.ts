// src/app/api/company/users/[membershipId]/suspend/route.ts
// POST /api/company/users/[membershipId]/suspend - Suspend a company user

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

    if (!ctx.permissions.includes("SUSPEND_COMPANY_USER")) {
      return NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 });
    }

    const { membershipId } = await params;

    const membership = await prisma.userMembership.findUnique({
      where: { id: membershipId },
      include: { user: true, role: true },
    });

    if (!membership || membership.companyId !== ctx.activeCompanyId) {
      return NextResponse.json({ error: "Membership not found in this company." }, { status: 404 });
    }

    // Owner protection rules:
    const isOwner = membership.isOwner || membership.role.name === "Super Admin";
    if (isOwner) {
      const activeOwners = await prisma.userMembership.findMany({
        where: {
          companyId: ctx.activeCompanyId,
          status: "ACTIVE",
          OR: [
            { isOwner: true },
            { role: { name: "Super Admin" } },
          ],
        },
      });

      const isLastActiveOwner = activeOwners.length <= 1 && activeOwners.some(o => o.id === membership.id);
      if (isLastActiveOwner) {
        return NextResponse.json({ error: "Cannot suspend the only active company owner." }, { status: 400 });
      }
    }

    // Set membership status to SUSPENDED
    const updatedMembership = await prisma.userMembership.update({
      where: { id: membershipId },
      data: { status: "SUSPENDED" },
    });

    // Check if the user has any other active memberships in any company
    const otherActiveMemberships = await prisma.userMembership.findMany({
      where: {
        userId: membership.userId,
        status: "ACTIVE",
        id: { not: membershipId },
      },
    });

    if (otherActiveMemberships.length === 0) {
      // Deactivate global user
      await prisma.user.update({
        where: { id: membership.userId },
        data: { isActive: false },
      });
    }

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: ctx.userId,
        roleName: ctx.roleName,
        actionType: "SUSPEND_COMPANY_USER",
        tableName: "UserMembership",
        recordId: membershipId,
        companyId: ctx.activeCompanyId,
        delta: {
          suspendedUserId: membership.userId,
          suspendedUserEmail: membership.user.email,
        } as any,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json(updatedMembership);
  } catch (error) {
    console.error("POST /api/company/users/[membershipId]/suspend Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
