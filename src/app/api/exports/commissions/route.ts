import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";
import { buildCsv, csvResponse } from "@/lib/csv";

export async function GET(request: Request) {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { userId, roleName } = decoded;

    // Applicant role blocked
    if (roleName === "Applicant") {
      return NextResponse.json(
        { error: "Forbidden. Candidate access restricted." },
        { status: 403 }
      );
    }

    // RBAC Permissions check
    const permissions = await getUserPermissions(userId);
    const isStaffOrAdmin =
      roleName === "Super Admin" ||
      roleName === "Operations Admin" ||
      roleName === "Accounts Officer" ||
      permissions.includes("VIEW_COMMISSIONS" as any) ||
      permissions.includes("MANAGE_ACCOUNTS" as any);

    const isAgent = roleName === "Agent";

    if (!isStaffOrAdmin && !isAgent) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient credentials to view commissions." },
        { status: 403 }
      );
    }

    // Resolve Agent Scope if the logged-in user is an external Agent
    let agentIdScope: string | null = null;
    if (isAgent) {
      const agentProfile = await prisma.agent.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!agentProfile) {
        return NextResponse.json(
          { error: "Forbidden. Linked agent profile record not found." },
          { status: 403 }
        );
      }
      agentIdScope = agentProfile.id;
    }

    // Parse filters
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    const agentIdParam = url.searchParams.get("agentId") || "";

    // Build the query where clause
    const whereClause: any = {};

    // Apply agent cohort constraints
    if (agentIdScope) {
      whereClause.agentId = agentIdScope;
    } else if (agentIdParam) {
      whereClause.agentId = agentIdParam;
    }

    // Apply search filters
    if (search) {
      whereClause.OR = [
        { applicant: { fullName: { contains: search, mode: "insensitive" } } },
        { applicant: { passportNumber: { contains: search, mode: "insensitive" } } },
        { agent: { companyName: { contains: search, mode: "insensitive" } } },
        { agent: { agentCode: { contains: search, mode: "insensitive" } } },
        { jobOrder: { orderNumber: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Apply status filter
    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    // Fetch all commissions (no pagination limits for exports)
    const commissions = await prisma.commission.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        agent: {
          select: {
            agentCode: true,
            companyName: true,
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
        applicant: {
          select: {
            fullName: true,
            passportNumber: true,
          },
        },
        jobOrder: {
          select: {
            orderNumber: true,
          },
        },
      },
    });

    const headers = [
      "Agent Code",
      "Agent Name",
      "Applicant Name",
      "Passport Number",
      "Job Order Number",
      "Amount",
      "Status",
      "Payout Ref",
      "Payout Date",
      "Created At",
    ];

    const rows = commissions.map((c) => {
      const agentName = c.agent.companyName || c.agent.user?.fullName || "Unknown Agent";
      const payoutDateStr = c.payoutDate ? c.payoutDate.toISOString().split("T")[0] : "N/A";
      const payoutRefStr = c.payoutRef || "N/A";

      return [
        c.agent.agentCode,
        agentName,
        c.applicant.fullName,
        c.applicant.passportNumber,
        c.jobOrder.orderNumber,
        Number(c.amount).toFixed(2),
        c.status,
        payoutRefStr,
        payoutDateStr,
        c.createdAt.toISOString().split("T")[0],
      ];
    });

    const csvText = buildCsv(headers, rows);
    return csvResponse(`commissions_export_${Date.now()}.csv`, csvText);
  } catch (error) {
    console.error("GET /api/exports/commissions Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred during commission CSV generation." },
      { status: 500 }
    );
  }
}
