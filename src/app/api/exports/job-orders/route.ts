// src/app/api/exports/job-orders/route.ts
// GET /api/exports/job-orders - Securely compile and download corporate Job Orders registry as CSV

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";
import { buildCsv, csvResponse } from "@/lib/csv";

export async function GET(request: Request) {
  try {
    const { activeCompanyId, userId, roleName, permissions } = await getCompanyContextOrThrow(request);

    // Boundary Check: Applicants and Agents strictly prohibited from bulk exports
    if (roleName === "Applicant" || roleName === "Agent") {
      return NextResponse.json(
        { error: "Forbidden. Sourced partners and placed candidates are not permitted to run bulk exports." },
        { status: 403 }
      );
    }

    // RBAC: Staff roles must hold permission to view reports or manage job orders
    const isSuperOrOps = roleName === "Super Admin" || roleName === "Operations Admin";
    const hasExportAccess =
      isSuperOrOps ||
      roleName === "HR Officer" ||
      permissions.includes("VIEW_REPORTS" as any) ||
      permissions.includes("MANAGE_JOB_ORDERS" as any);

    if (!hasExportAccess) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient permissions to export demand registry." },
        { status: 403 }
      );
    }

    // Parse optional filters from URL search params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const country = searchParams.get("country") || "";
    const trade = searchParams.get("trade") || "";

    const where: any = {
      companyId: activeCompanyId,
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (country) {
      where.country = { equals: country, mode: "insensitive" };
    }

    if (trade && trade !== "ALL") {
      where.trade = { equals: trade, mode: "insensitive" };
    }

    if (search) {
      where.OR = [
        { employerName: { contains: search, mode: "insensitive" } },
        { orderNumber: { contains: search, mode: "insensitive" } },
        { country: { contains: search, mode: "insensitive" } },
        { trade: { contains: search, mode: "insensitive" } },
      ];
    }

    // Query all records matching the filters (no pagination limits for full export)
    const jobOrders = await prisma.jobOrder.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    const headers = [
      "Order Number",
      "Employer Name",
      "Country",
      "Trade",
      "Salary",
      "Total Quota",
      "Allocated Quota",
      "Remaining Quota",
      "Commission Amount",
      "Status",
      "Created At",
    ];

    const rows = jobOrders.map((jo) => {
      const remainingQuota = Math.max(0, jo.totalQuota - jo.allocatedQuota);
      return [
        jo.orderNumber,
        jo.employerName,
        jo.country,
        jo.trade,
        `${Number(jo.salary).toFixed(2)}`,
        `${jo.totalQuota}`,
        `${jo.allocatedQuota}`,
        `${remainingQuota}`,
        `${Number(jo.commissionAmount).toFixed(2)}`,
        jo.status,
        jo.createdAt.toISOString().split("T")[0],
      ];
    });

    const csvText = buildCsv(headers, rows);
    return csvResponse(`job_orders_export_${Date.now()}.csv`, csvText);

  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized access or inactive company workspace." },
        { status: 401 }
      );
    }
    console.error("GET /api/exports/job-orders Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred during CSV generation." },
      { status: 500 }
    );
  }
}
