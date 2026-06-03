// src/app/api/company/users/[membershipId]/route.ts
// PATCH /api/company/users/[membershipId] - Edit company user membership (role or status)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCompanyContext } from "@/lib/auth";
import { z } from "zod";

const UpdateMembershipSchema = z.object({
  roleId: z.string().uuid().optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "INVITED"]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ membershipId: string }> }
) {
  try {
    const ctx = await requireCompanyContext(request);
    if (!ctx || !ctx.activeCompanyId) {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }

    if (!ctx.permissions.includes("UPDATE_COMPANY_USER")) {
      return NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 });
    }

    const { membershipId } = await params;

    // Retrieve the membership to edit
    const targetMembership = await prisma.userMembership.findUnique({
      where: { id: membershipId },
      include: { role: true, user: true },
    });

    if (!targetMembership || targetMembership.companyId !== ctx.activeCompanyId) {
      return NextResponse.json({ error: "Membership not found in this company." }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const validatedData = UpdateMembershipSchema.parse(body);

    const { roleId, status } = validatedData;

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
    // Determine if the target membership is currently a Super Admin/Owner
    const isTargetOwner = targetMembership.isOwner || targetMembership.role.name === "Super Admin";

    if (isTargetOwner) {
      // Find all ACTIVE owners in the company
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

      // If the target is an owner, and they are the last active owner:
      const isLastActiveOwner = activeOwners.length <= 1 && activeOwners.some(o => o.id === targetMembership.id);

      if (isLastActiveOwner) {
        // Prevent suspension
        if (status && status !== "ACTIVE") {
          return NextResponse.json({ error: "Cannot suspend or deactivate the only active company owner." }, { status: 400 });
        }
        // Prevent role downgrade (if changing role to anything other than Super Admin)
        if (newRole && newRole.name !== "Super Admin") {
          return NextResponse.json({ error: "Cannot downgrade the role of the only active company owner." }, { status: 400 });
        }
      }
    }

    // Update the membership
    const updateData: any = {};
    if (newRole) {
      updateData.roleId = newRole.id;
      updateData.isOwner = newRole.name === "Super Admin";
    }
    if (status) {
      updateData.status = status;
    }

    const updatedMembership = await prisma.userMembership.update({
      where: { id: membershipId },
      data: updateData,
      include: { role: true },
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
        } as any,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json(updatedMembership);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation failed." }, { status: 400 });
    }
    console.error("PATCH /api/company/users/[membershipId] Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
