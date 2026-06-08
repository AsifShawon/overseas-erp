// src/app/api/company/users/route.ts
// GET /api/company/users - List users in the active company

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCompanyContext } from "@/lib/auth";

/**
 * GET /api/company/users
 * Returns list of memberships for activeCompanyId.
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireCompanyContext(request);
    if (!ctx || !ctx.activeCompanyId) {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }

    // Check permission
    if (!ctx.permissions.includes("VIEW_COMPANY_USERS")) {
      return NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 });
    }

    const memberships = await prisma.userMembership.findMany({
      where: { companyId: ctx.activeCompanyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            isActive: true,
            createdAt: true,
            passwordChangedAt: true,
            branchMemberships: {
              where: { companyId: ctx.activeCompanyId },
              include: {
                branch: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    isHeadOffice: true,
                  }
                }
              }
            }
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
    console.error("GET /api/company/users Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}


