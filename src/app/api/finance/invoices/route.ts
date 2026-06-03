// src/app/api/finance/invoices/route.ts
// GET /api/finance/invoices - Retrieve paginated and filtered applicant invoices with status mapping and biodata joins.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";

export async function GET(request: Request) {
  try {
    const { activeCompanyId, userId, roleName, permissions } = await getCompanyContextOrThrow(request);

    // Boundary Check: Explicitly block Agent and Applicant user roles
    if (roleName === "Agent" || roleName === "Applicant") {
      return NextResponse.json(
        { error: "Forbidden. Sourced cohorts and candidates cannot access corporate billing records." },
        { status: 403 }
      );
    }

    // RBAC: Check permissions
    const isAuthorized =
      roleName === "Super Admin" ||
      roleName === "Operations Admin" ||
      roleName === "Accounts Officer" ||
      permissions.includes("VIEW_ACCOUNTS") ||
      permissions.includes("MANAGE_ACCOUNTS");

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient administrative permissions to view billing records." },
        { status: 403 }
      );
    }

    // Parse query params
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "50", 10);

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Build filters dynamically
    const whereClause: any = {
      companyId: activeCompanyId, // FORCE TENANT ISOLATION
    };

    if (search) {
      const matchingApplicants = await prisma.applicant.findMany({
        where: {
          companyId: activeCompanyId,
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { passportNumber: { contains: search, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      });
      const applicantIds = matchingApplicants.map((a) => a.id);

      whereClause.OR = [
        { applicantId: { in: applicantIds } },
        { invoiceNo: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch invoices
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        applicant: {
          select: {
            fullName: true,
            passportNumber: true,
          },
        },
      },
    });

    const totalCount = await prisma.invoice.count({
      where: whereClause,
    });

    // Map database models to output representation including status
    const data = invoices.map((inv) => {
      const amount = Number(inv.amount);
      const outstanding = Number(inv.outstanding);

      let status: "PAID" | "PARTIAL" | "DUE" = "DUE";
      if (outstanding === 0) {
        status = "PAID";
      } else if (outstanding < amount) {
        status = "PARTIAL";
      }

      return {
        id: inv.id,
        applicantId: inv.applicantId,
        applicantName: inv.applicant?.fullName || "Unknown Candidate",
        passportNumber: inv.applicant?.passportNumber || "N/A",
        invoiceNo: inv.invoiceNo,
        amount,
        outstanding,
        dueDate: inv.dueDate.toISOString().split("T")[0],
        description: inv.description,
        createdAt: inv.createdAt.toISOString().split("T")[0],
        status,
      };
    });

    return NextResponse.json({
      data,
      pagination: {
        total: totalCount,
        page,
        pageSize,
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }
    console.error("GET /api/finance/invoices Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred while retrieving billing records." },
      { status: 500 }
    );
  }
}
