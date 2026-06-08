// src/app/api/company/branches/[id]/users/[branchMembershipId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCompanyContext } from "@/lib/auth";
import { z } from "zod";

const UpdateBranchMembershipSchema = z.object({
  roleId: z.string().uuid().optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "INVITED"]).optional(),
  isBranchManager: z.boolean().optional(),
});

/**
 * PATCH /api/company/branches/[id]/users/[branchMembershipId]
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; branchMembershipId: string }> }
) {
  try {
    const ctx = await requireCompanyContext(request);
    if (!ctx || !ctx.activeCompanyId) {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }

    if (!ctx.permissions.includes("ASSIGN_BRANCH_USERS")) {
      return NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 });
    }

    const { id: branchId, branchMembershipId } = await params;

    // Retrieve branch membership
    const targetMembership = await prisma.branchMembership.findUnique({
      where: { id: branchMembershipId },
      include: { role: true, user: true },
    });

    if (
      !targetMembership ||
      targetMembership.branchId !== branchId ||
      targetMembership.companyId !== ctx.activeCompanyId
    ) {
      return NextResponse.json({ error: "Branch membership not found." }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const validatedData = UpdateBranchMembershipSchema.parse(body);

    const { roleId, status, isBranchManager } = validatedData;

    let targetRole = targetMembership.role;
    if (roleId) {
      const fetchedRole = await prisma.role.findUnique({ where: { id: roleId } });
      if (!fetchedRole || fetchedRole.name === "Platform Admin") {
        return NextResponse.json({ error: "Invalid role selected." }, { status: 400 });
      }
      targetRole = fetchedRole;
    }

    // Owner protection rule
    if (status && status !== "ACTIVE") {
      const ownerMembership = await prisma.userMembership.findUnique({
        where: { userId_companyId: { userId: targetMembership.userId, companyId: ctx.activeCompanyId } },
      });

      if (ownerMembership?.isOwner) {
        const activeOwners = await prisma.userMembership.count({
          where: { companyId: ctx.activeCompanyId, isOwner: true, status: "ACTIVE" },
        });
        if (activeOwners <= 1) {
          return NextResponse.json({ error: "Cannot suspend branch access of the only active Company Owner." }, { status: 400 });
        }
      }
    }

    const updated = await prisma.branchMembership.update({
      where: { id: branchMembershipId },
      data: {
        roleId: targetRole.id,
        status: status || undefined,
        isBranchManager: isBranchManager !== undefined ? isBranchManager : undefined,
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: ctx.userId,
        roleName: ctx.roleName,
        actionType: "UPDATE_BRANCH_MEMBER",
        tableName: "BranchMembership",
        recordId: branchMembershipId,
        companyId: ctx.activeCompanyId,
        delta: {
          oldRole: targetMembership.role.name,
          newRole: targetRole.name,
          oldStatus: targetMembership.status,
          newStatus: updated.status,
          isBranchManager: updated.isBranchManager,
        } as any,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation failed." }, { status: 400 });
    }
    console.error("PATCH /api/company/branches/[id]/users/[branchMembershipId] Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

/**
 * DELETE /api/company/branches/[id]/users/[branchMembershipId]
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; branchMembershipId: string }> }
) {
  try {
    const ctx = await requireCompanyContext(request);
    if (!ctx || !ctx.activeCompanyId) {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }

    if (!ctx.permissions.includes("ASSIGN_BRANCH_USERS")) {
      return NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 });
    }

    const { id: branchId, branchMembershipId } = await params;

    // Retrieve branch membership
    const targetMembership = await prisma.branchMembership.findUnique({
      where: { id: branchMembershipId },
      include: { role: true, user: true },
    });

    if (
      !targetMembership ||
      targetMembership.branchId !== branchId ||
      targetMembership.companyId !== ctx.activeCompanyId
    ) {
      return NextResponse.json({ error: "Branch membership not found." }, { status: 404 });
    }

    // Owner protection: cannot delete membership of the only active owner
    const ownerMembership = await prisma.userMembership.findUnique({
      where: { userId_companyId: { userId: targetMembership.userId, companyId: ctx.activeCompanyId } },
    });

    if (ownerMembership?.isOwner) {
      const activeOwners = await prisma.userMembership.count({
        where: { companyId: ctx.activeCompanyId, isOwner: true, status: "ACTIVE" },
      });
      if (activeOwners <= 1) {
        return NextResponse.json({ error: "Cannot remove branch access of the only active Company Owner." }, { status: 400 });
      }
    }

    await prisma.branchMembership.delete({
      where: { id: branchMembershipId },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: ctx.userId,
        roleName: ctx.roleName,
        actionType: "REMOVE_BRANCH_MEMBER",
        tableName: "BranchMembership",
        recordId: branchMembershipId,
        companyId: ctx.activeCompanyId,
        delta: {
          removedUserId: targetMembership.userId,
          removedUserEmail: targetMembership.user.email,
        } as any,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/company/branches/[id]/users/[branchMembershipId] Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
