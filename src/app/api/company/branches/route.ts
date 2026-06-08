// src/app/api/company/branches/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCompanyContext } from "@/lib/auth";
import { z } from "zod";

const CreateBranchSchema = z.object({
  name: z.string().min(1, "Branch name is required."),
  code: z.string().min(1, "Branch code is required.").toUpperCase().trim(),
  city: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address.").optional().or(z.literal("")),
  isHeadOffice: z.boolean().optional(),
});

/**
 * GET /api/company/branches
 * Returns all branches for active company.
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireCompanyContext(request);
    if (!ctx || !ctx.activeCompanyId) {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }

    if (!ctx.permissions.includes("VIEW_BRANCHES")) {
      return NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 });
    }

    const branches = await prisma.branch.findMany({
      where: { companyId: ctx.activeCompanyId },
      include: {
        _count: {
          select: {
            memberships: true,
            applicants: true,
            agents: true,
            jobOrders: true,
          },
        },
      },
      orderBy: [
        { isHeadOffice: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(branches);
  } catch (error) {
    console.error("GET /api/company/branches Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

/**
 * POST /api/company/branches
 * Creates a new branch for active company.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireCompanyContext(request);
    if (!ctx || !ctx.activeCompanyId) {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }

    const companyId = ctx.activeCompanyId as string;

    if (!ctx.permissions.includes("CREATE_BRANCH")) {
      return NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const validatedData = CreateBranchSchema.parse(body);

    const { name, code, city, address, phone, email, isHeadOffice } = validatedData;

    // Check unique branch code within the same company
    const existing = await prisma.branch.findUnique({
      where: {
        companyId_code: {
          companyId,
          code,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: `A branch with code '${code}' already exists in this company.` }, { status: 400 });
    }

    // Atomic database action
    const newBranch = await prisma.$transaction(async (tx) => {
      // If we are setting this as the Head Office, unset other Head Offices
      if (isHeadOffice) {
        await tx.branch.updateMany({
          where: { companyId, isHeadOffice: true },
          data: { isHeadOffice: false },
        });
      }

      return await tx.branch.create({
        data: {
          companyId,
          name,
          code,
          city: city || null,
          address: address || null,
          phone: phone || null,
          email: email || null,
          isHeadOffice: isHeadOffice || false,
          status: "ACTIVE",
        },
      });
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: ctx.userId,
        roleName: ctx.roleName,
        actionType: "CREATE_BRANCH",
        tableName: "Branch",
        recordId: newBranch.id,
        companyId: ctx.activeCompanyId,
        delta: {
          name,
          code,
          isHeadOffice: newBranch.isHeadOffice,
        } as any,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json(newBranch, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation failed." }, { status: 400 });
    }
    console.error("POST /api/company/branches Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
