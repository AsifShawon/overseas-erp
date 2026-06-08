// src/app/api/company/users/[membershipId]/route.ts
// GET / PATCH /api/company/users/[membershipId] - Retrieve or edit company user membership
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCompanyContext } from "@/lib/auth";
import { z } from "zod";

const UpdateMembershipSchema = z.object({
  roleId: z.string().uuid().optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "INVITED"]).optional(),
  branchIds: z.array(z.string()).optional(),
  isAllBranches: z.boolean().optional(),
});

/**
 * GET /api/company/users/[membershipId]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ membershipId: string }> }
) {
  try {
    const ctx = await requireCompanyContext(request);
    if (!ctx || !ctx.activeCompanyId) {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }

    if (!ctx.permissions.includes("VIEW_COMPANY_USERS")) {
      return NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 });
    }

    const { membershipId } = await params;

    const membership = await prisma.userMembership.findUnique({
      where: { id: membershipId },
      include: {
        role: {
          select: { id: true, name: true, description: true }
        },
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            isActive: true,
            branchMemberships: {
              where: { companyId: ctx.activeCompanyId },
              include: {
                branch: {
                  select: { id: true, name: true, code: true, isHeadOffice: true }
                }
              }
            }
          }
        }
      }
    });

    if (!membership || membership.companyId !== ctx.activeCompanyId) {
      return NextResponse.json({ error: "User membership not found in this company." }, { status: 404 });
    }

    return NextResponse.json(membership);
  } catch (error) {
    console.error("GET /api/company/users/[membershipId] Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

/**
 * PATCH /api/company/users/[membershipId]
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ membershipId: string }> }
) {
  try {
    const ctx = await requireCompanyContext(request);
    if (!ctx || !ctx.activeCompanyId) {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }

    const companyId = ctx.activeCompanyId as string;

    if (!ctx.permissions.includes("UPDATE_COMPANY_USER")) {
      return NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 });
    }

    const { membershipId } = await params;

    // Retrieve the membership to edit
    const targetMembership = await prisma.userMembership.findUnique({
      where: { id: membershipId },
      include: { role: true, user: true },
    });

    if (!targetMembership || targetMembership.companyId !== companyId) {
      return NextResponse.json({ error: "Membership not found in this company." }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const validatedData = UpdateMembershipSchema.parse(body);

    const { roleId, status, branchIds, isAllBranches } = validatedData;

    // Check if we are changing role
    let newRole = null;
    if (roleId) {
      newRole = await prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!newRole) {
        return NextResponse.json({ error: "Selected role not found." }, { status: 400 });
      }

      const forbiddenRoles = ["Agent", "Applicant"];
      if (forbiddenRoles.includes(newRole.name)) {
        return NextResponse.json({ error: `Cannot assign the '${newRole.name}' role from here.` }, { status: 400 });
      }
    }

    // Owner protection rules:
    const isTargetOwner = targetMembership.isOwner || targetMembership.role.name === "Super Admin";

    if (isTargetOwner) {
      const activeOwners = await prisma.userMembership.findMany({
        where: {
          companyId,
          status: "ACTIVE",
          OR: [
            { isOwner: true },
            { role: { name: "Super Admin" } },
          ],
        },
      });

      const isLastActiveOwner = activeOwners.length <= 1 && activeOwners.some(o => o.id === targetMembership.id);

      if (isLastActiveOwner) {
        if (status && status !== "ACTIVE") {
          return NextResponse.json({ error: "Cannot suspend or deactivate the only active company owner." }, { status: 400 });
        }
        if (newRole && newRole.name !== "Super Admin") {
          return NextResponse.json({ error: "Cannot downgrade the role of the only active company owner." }, { status: 400 });
        }
      }
    }

    // Perform updates inside a transaction
    const updatedMembership = await prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (newRole) {
        updateData.roleId = newRole.id;
        updateData.isOwner = newRole.name === "Super Admin";
      }
      if (status) {
        updateData.status = status;
      }

      const updated = await tx.userMembership.update({
        where: { id: membershipId },
        data: updateData,
        include: { role: true },
      });

      // Update branch memberships if provided
      if (branchIds !== undefined || isAllBranches !== undefined) {
        const activeRole = newRole || targetMembership.role;
        const roleHasAllBranches = activeRole.name === "Super Admin" || activeRole.name === "Operations Admin";

        let targetBranches: string[] = [];
        if (isAllBranches || roleHasAllBranches) {
          const activeBranches = await tx.branch.findMany({
            where: { companyId, status: "ACTIVE" }
          });
          targetBranches = activeBranches.map(b => b.id);
        } else {
          targetBranches = branchIds || [];
        }

        if (!roleHasAllBranches && targetBranches.length === 0) {
          throw new Error("At least one branch assignment is required.");
        }

        // Delete existing branch memberships
        await tx.branchMembership.deleteMany({
          where: {
            userId: targetMembership.userId,
            companyId,
          }
        });

        // Create new ones
        for (const bId of targetBranches) {
          await tx.branchMembership.create({
            data: {
              userId: targetMembership.userId,
              companyId,
              branchId: bId,
              roleId: activeRole.id,
              status: status || targetMembership.status,
              isBranchManager: roleHasAllBranches,
            }
          });
        }
      }

      return updated;
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: ctx.userId,
        roleName: ctx.roleName,
        actionType: "UPDATE_COMPANY_USER",
        tableName: "UserMembership",
        recordId: membershipId,
        companyId: ctx.activeCompanyId,
        delta: {
          oldRole: targetMembership.role.name,
          newRole: updatedMembership.role.name,
          oldStatus: targetMembership.status,
          newStatus: updatedMembership.status,
          targetUserId: targetMembership.userId,
          updatedBranches: branchIds !== undefined || isAllBranches !== undefined,
        } as any,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json(updatedMembership);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation failed." }, { status: 400 });
    }
    // Handle the custom error thrown in transaction
    if (error.message === "At least one branch assignment is required.") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("PATCH /api/company/users/[membershipId] Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
