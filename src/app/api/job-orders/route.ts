// src/app/api/job-orders/route.ts
// GET /api/job-orders - Fetch job orders with status filter and security permissions

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { userId, roleName } = decoded;

    // Check RBAC permission: Super Admin, Operations Admin, and users with CREATE_APPLICANT or VIEW_APPLICANTS are allowed.
    const permissions = await getUserPermissions(userId);
    const isSuperOrOps = roleName === "Super Admin" || roleName === "Operations Admin";
    if (!isSuperOrOps && !permissions.includes("CREATE_APPLICANT") && !permissions.includes("VIEW_APPLICANTS")) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient permissions." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const jobOrders = await prisma.jobOrder.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        employerName: true,
        country: true,
        trade: true,
        status: true,
        totalQuota: true,
        allocatedQuota: true,
      },
      orderBy: {
        orderNumber: "asc",
      },
    });

    return NextResponse.json({ data: jobOrders });
  } catch (error) {
    console.error("GET /api/job-orders Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
