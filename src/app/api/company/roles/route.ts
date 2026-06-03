// src/app/api/company/roles/route.ts
// GET /api/company/roles - List available roles for company staff selection

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCompanyContext } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const ctx = await requireCompanyContext(request);
    if (!ctx || !ctx.activeCompanyId) {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }

    const hasPermission = ctx.permissions.includes("VIEW_COMPANY_ROLES") || ctx.permissions.includes("INVITE_COMPANY_USER") || ctx.permissions.includes("UPDATE_COMPANY_USER");
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 });
    }

    // Fetch all roles
    const roles = await prisma.role.findMany({
      orderBy: { name: "asc" },
    });

    // Filter out Agent and Applicant roles, and platform admin check (if there were specific platform-only roles)
    const companyUsableRoles = roles.filter(
      (role) => !["Agent", "Applicant"].includes(role.name)
    );

    return NextResponse.json(companyUsableRoles);
  } catch (error) {
    console.error("GET /api/company/roles Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
