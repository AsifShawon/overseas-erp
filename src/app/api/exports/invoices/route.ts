import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBranchContext, buildBranchWhere } from "@/lib/branch-scope";
import { buildCsv, csvResponse } from "@/lib/csv";

export async function GET(request: Request) {
  try {
    const branchScope = await requireBranchContext(request);
    const { activeCompanyId, userId, roleName, permissions } = branchScope;

    // Block Agent and Applicant roles
    if (roleName === "Agent" || roleName === "Applicant") {
      return NextResponse.json(
        { error: "Forbidden. Corporate billing records access restricted." },
        { status: 403 }
      );
    }

    // RBAC: Check accounts permissions
    const isAuthorized =
      roleName === "Super Admin" ||
      roleName === "Operations Admin" ||
      roleName === "Accounts Officer" ||
      permissions.includes("VIEW_ACCOUNTS" as any) ||
      permissions.includes("MANAGE_ACCOUNTS" as any);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient accounts credentials." },
        { status: 403 }
      );
    }

    // Parse filters
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";

    const baseWhere = buildBranchWhere(activeCompanyId, branchScope);
    const whereClause: any = {
      ...baseWhere,
    };

    if (search) {
      const matchingApplicants = await prisma.applicant.findMany({
        where: {
          ...baseWhere,
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

    // Fetch invoices (no pagination limits for exports)
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        applicant: {
          select: {
            fullName: true,
            passportNumber: true,
          },
        },
        branch: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    const headers = [
      "Invoice No",
      "Applicant Name",
      "Passport Number",
      "Branch Name",
      "Branch Code",
      "Amount",
      "Outstanding",
      "Status",
      "Due Date",
      "Description",
      "Created At",
    ];

    const rows = invoices.map((inv) => {
      const amount = Number(inv.amount);
      const outstanding = Number(inv.outstanding);

      let status = "DUE";
      if (outstanding === 0) {
        status = "PAID";
      } else if (outstanding < amount) {
        status = "PARTIAL";
      }

      return [
        inv.invoiceNo,
        inv.applicant?.fullName || "Unknown Candidate",
        inv.applicant?.passportNumber || "N/A",
        inv.branch?.name || "N/A",
        inv.branch?.code || "N/A",
        amount.toFixed(2),
        outstanding.toFixed(2),
        status,
        inv.dueDate.toISOString().split("T")[0],
        inv.description,
        inv.createdAt.toISOString().split("T")[0],
      ];
    });

    const csvText = buildCsv(headers, rows);
    return csvResponse(`invoices_export_${Date.now()}.csv`, csvText);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message === "FORBIDDEN" ? "Forbidden" : "Unauthorized" }, { status: error.message === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("GET /api/exports/invoices Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred during invoice CSV generation." },
      { status: 500 }
    );
  }
}
