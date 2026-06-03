import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";
import { getUserPermissions } from "@/lib/rbac";
import { buildCsv, csvResponse } from "@/lib/csv";

export async function GET(request: Request) {
  try {
    const { activeCompanyId, userId, roleName, permissions } = await getCompanyContextOrThrow(request);

    // Boundary Check: Applicants cannot export lists
    if (roleName === "Applicant") {
      return NextResponse.json(
        { error: "Forbidden. Candidate access restricted." },
        { status: 403 }
      );
    }

    // Boundary Check: Sourcing Agents scoped to own cohort
    let enforcedAgentId: string | undefined = undefined;
    if (roleName === "Agent") {
      const agent = await prisma.agent.findFirst({
        where: { userId, companyId: activeCompanyId },
      });
      if (!agent) {
        return csvResponse("applicants_export.csv", buildCsv(
          ["Applicant Name", "Passport Number", "Phone", "Email", "Trade", "Nationality", "Current Stage", "Agent Code", "Job Order Number", "Archived", "Created At"],
          []
        ));
      }
      enforcedAgentId = agent.id;
    } else {
      // Staff roles: Must hold VIEW_APPLICANTS permission
      const isSuperOrOps = roleName === "Super Admin" || roleName === "Operations Admin";
      if (!isSuperOrOps && !permissions.includes("VIEW_APPLICANTS")) {
        return NextResponse.json(
          { error: "Forbidden. Insufficient permissions to export applicants." },
          { status: 403 }
        );
      }
    }

    // Parse filters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const stage = searchParams.get("stage") || "";
    const trade = searchParams.get("trade") || "";
    const country = searchParams.get("country") || "";
    const agentId = searchParams.get("agentId") || "";
    const archivedStr = searchParams.get("archived") || "false";
    const archived = archivedStr === "true";

    // Build Prisma query filters
    const where: any = {
      companyId: activeCompanyId,
      isArchived: archived,
    };

    if (enforcedAgentId) {
      where.agentId = enforcedAgentId;
    } else if (agentId) {
      // If filtering by agentId, make sure that agent also belongs to the company
      const targetAgent = await prisma.agent.findFirst({
        where: { id: agentId, companyId: activeCompanyId },
      });
      if (!targetAgent) {
        where.agentId = "NON_EXISTENT";
      } else {
        where.agentId = agentId;
      }
    }

    if (stage && stage !== "ALL") {
      where.currentStage = stage;
    }

    if (trade && trade !== "ALL") {
      where.trade = trade;
    }

    if (country) {
      where.jobOrder = {
        companyId: activeCompanyId,
        country: {
          equals: country,
          mode: "insensitive",
        },
      };
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { passportNumber: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch all records without pagination limits for full file export
    const applicants = await prisma.applicant.findMany({
      where,
      include: {
        agent: {
          select: {
            agentCode: true,
          },
        },
        jobOrder: {
          select: {
            orderNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Formulate headers & data rows
    const headers = [
      "Applicant Name",
      "Passport Number",
      "Phone",
      "Email",
      "Trade",
      "Nationality",
      "Current Stage",
      "Agent Code",
      "Job Order Number",
      "Archived",
      "Created At",
    ];

    const rows = applicants.map((app) => [
      app.fullName,
      app.passportNumber,
      app.phone,
      app.email || "N/A",
      app.trade,
      app.nationality,
      app.currentStage,
      app.agent?.agentCode || "Walk-In",
      app.jobOrder?.orderNumber || "Unassigned",
      app.isArchived ? "Yes" : "No",
      app.createdAt.toISOString().split("T")[0],
    ]);

    const csvText = buildCsv(headers, rows);
    return csvResponse(`applicants_export_${Date.now()}.csv`, csvText);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized access or inactive company workspace." },
        { status: 401 }
      );
    }
    console.error("GET /api/exports/applicants Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred during CSV generation." },
      { status: 500 }
    );
  }
}
