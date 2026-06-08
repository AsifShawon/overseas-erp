// src/app/api/company/branches/[id]/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCompanyContext } from "@/lib/auth";
import { z } from "zod";

const AssignUserSchema = z.object({
  userId: z.string().optional(),
  membershipId: z.string().optional(),
  roleId: z.string().uuid("Invalid role ID."),
  isBranchManager: z.boolean().optional().default(false),
});

/**
 * GET /api/company/branches/[id]/users
 * Returns BranchMemberships for this branch.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireCompanyContext(request);
    if (!ctx || !ctx.activeCompanyId) {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }

    if (!ctx.permissions.includes("VIEW_BRANCH_USERS")) {
      return NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 });
    }

    const { id } = await params;

    // Verify branch ownership
    const branch = await prisma.branch.findFirst({
      where: { id, companyId: ctx.activeCompanyId },
    });

    if (!branch) {
      return NextResponse.json({ error: "Branch not found." }, { status: 404 });
    }

    const memberships = await prisma.branchMembership.findMany({
      where: { branchId: id, companyId: ctx.activeCompanyId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            isActive: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(memberships);
  } catch (error) {
    console.error("GET /api/company/branches/[id]/users Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

/**
 * POST /api/company/branches/[id]/users
 * Assigns a user to a branch.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireCompanyContext(request);
    if (!ctx || !ctx.activeCompanyId) {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }

    if (!ctx.permissions.includes("ASSIGN_BRANCH_USERS")) {
      return NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 });
    }

    const { id } = await params;

    // Verify branch ownership
    const branch = await prisma.branch.findFirst({
      where: { id, companyId: ctx.activeCompanyId },
    });

    if (!branch) {
      return NextResponse.json({ error: "Branch not found in this company." }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const validatedData = AssignUserSchema.parse(body);

    const { userId, membershipId, roleId, isBranchManager } = validatedData;

    let targetUserId = userId;

    if (!targetUserId && membershipId) {
      const userMembership = await prisma.userMembership.findUnique({
        where: { id: membershipId },
      });
      if (userMembership && userMembership.companyId === ctx.activeCompanyId) {
        targetUserId = userMembership.userId;
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "A valid company user must be designated." }, { status: 400 });
    }

    // Verify user membership in this company
    const userMembership = await prisma.userMembership.findFirst({
      where: { userId: targetUserId, companyId: ctx.activeCompanyId },
    });

    if (!userMembership) {
      return NextResponse.json({ error: "Designated user does not belong to this company." }, { status: 400 });
    }

    // Verify role is not platform admin and is valid
    const targetRole = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!targetRole || targetRole.name === "Platform Admin") {
      return NextResponse.json({ error: "Invalid role selected." }, { status: 400 });
    }

    // Check duplicate assignment
    const existing = await prisma.branchMembership.findUnique({
      where: {
        userId_branchId_roleId: {
          userId: targetUserId,
          branchId: id,
          roleId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "User is already assigned to this branch with this role." }, { status: 400 });
    }

    const newMembership = await prisma.branchMembership.create({
      data: {
        userId: targetUserId,
        companyId: ctx.activeCompanyId,
        branchId: id,
        roleId,
        isBranchManager: isBranchManager || false,
        status: "ACTIVE",
      },
      include: {
        user: { select: { fullName: true, email: true } },
        role: { select: { name: true } },
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: ctx.userId,
        roleName: ctx.roleName,
        actionType: "ASSIGN_BRANCH_USER",
        tableName: "BranchMembership",
        recordId: newMembership.id,
        companyId: ctx.activeCompanyId,
        delta: {
          assignedUserId: targetUserId,
          assignedUserEmail: newMembership.user.email,
          branchName: branch.name,
          roleName: newMembership.role.name,
          isBranchManager: newMembership.isBranchManager,
        } as any,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json(newMembership, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation failed." }, { status: 400 });
    }
    console.error("POST /api/company/branches/[id]/users Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
