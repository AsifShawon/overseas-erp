// src/app/api/company/branches/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCompanyContext } from "@/lib/auth";
import { z } from "zod";

const UpdateBranchSchema = z.object({
  name: z.string().min(1, "Branch name is required.").optional(),
  code: z.string().min(1, "Branch code is required.").toUpperCase().trim().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address.").optional().or(z.literal("")),
  isHeadOffice: z.boolean().optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
});

/**
 * GET /api/company/branches/[id]
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

    if (!ctx.permissions.includes("VIEW_BRANCHES")) {
      return NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 });
    }

    const { id } = await params;

    const branch = await prisma.branch.findFirst({
      where: { id, companyId: ctx.activeCompanyId },
      include: {
        memberships: {
          where: { status: "ACTIVE" },
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
              },
            },
          },
        },
        _count: {
          select: {
            applicants: true,
            agents: true,
            jobOrders: true,
            invoices: true,
            receipts: true,
          },
        },
      },
    });

    if (!branch) {
      return NextResponse.json({ error: "Branch not found." }, { status: 404 });
    }

    return NextResponse.json(branch);
  } catch (error) {
    console.error("GET /api/company/branches/[id] Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

/**
 * PATCH /api/company/branches/[id]
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireCompanyContext(request);
    if (!ctx || !ctx.activeCompanyId) {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }

    const companyId = ctx.activeCompanyId as string;

    if (!ctx.permissions.includes("UPDATE_BRANCH")) {
      return NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 });
    }

    const { id } = await params;

    // Check target branch exists
    const targetBranch = await prisma.branch.findFirst({
      where: { id, companyId },
    });

    if (!targetBranch) {
      return NextResponse.json({ error: "Branch not found in this company." }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const validatedData = UpdateBranchSchema.parse(body);

    const { name, code, city, address, phone, email, isHeadOffice, status } = validatedData;

    // Code uniqueness check
    if (code) {
      const existing = await prisma.branch.findFirst({
        where: {
          companyId,
          code,
          id: { not: id },
        },
      });
      if (existing) {
        return NextResponse.json({ error: `A branch with code '${code}' already exists in this company.` }, { status: 400 });
      }
    }

    // Suspension check
    if (status === "SUSPENDED") {
      const activeCount = await prisma.branch.count({
        where: { companyId, status: "ACTIVE" },
      });
      if (activeCount <= 1 && targetBranch.status === "ACTIVE") {
        return NextResponse.json({ error: "Cannot suspend the company's only active branch. At least one active branch must remain." }, { status: 400 });
      }
    }

    const updatedBranch = await prisma.$transaction(async (tx) => {
      // Unset other Head Offices if this one is set to Head Office
      if (isHeadOffice) {
        await tx.branch.updateMany({
          where: { companyId, isHeadOffice: true },
          data: { isHeadOffice: false },
        });
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (code !== undefined) updateData.code = code;
      if (city !== undefined) updateData.city = city || null;
      if (address !== undefined) updateData.address = address || null;
      if (phone !== undefined) updateData.phone = phone || null;
      if (email !== undefined) updateData.email = email || null;
      if (isHeadOffice !== undefined) updateData.isHeadOffice = isHeadOffice;
      if (status !== undefined) updateData.status = status;

      return await tx.branch.update({
        where: { id },
        data: updateData,
      });
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: ctx.userId,
        roleName: ctx.roleName,
        actionType: "UPDATE_BRANCH",
        tableName: "Branch",
        recordId: id,
        companyId: ctx.activeCompanyId,
        delta: {
          oldStatus: targetBranch.status,
          newStatus: updatedBranch.status,
          oldName: targetBranch.name,
          newName: updatedBranch.name,
          oldCode: targetBranch.code,
          newCode: updatedBranch.code,
        } as any,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json(updatedBranch);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation failed." }, { status: 400 });
    }
    console.error("PATCH /api/company/branches/[id] Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
