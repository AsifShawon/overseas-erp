// src/app/api/finance/commissions/route.ts
// GET /api/finance/commissions - Retrieve dynamic agent commissions logs with search, status filters, dynamic role scoping, and financial metric aggregates.

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

    // Applicant user roles cannot view commission register logs
    if (roleName === "Applicant") {
      return NextResponse.json(
        { error: "Forbidden. Placed candidates cannot view placement commission registers." },
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
        { error: "Forbidden. Insufficient credentials to view commission log register." },
        { status: 403 }
      );
    }

    // Parse query params
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    const agentIdParam = url.searchParams.get("agentId") || "";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "50", 10);

    const skip = (page - 1) * pageSize;
    const take = pageSize;

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

    // Build independent stats where clause (ignoring status/search for overall totals)
    const statsWhere: any = {};
    if (agentIdScope) {
      statsWhere.agentId = agentIdScope;
    } else if (agentIdParam) {
      statsWhere.agentId = agentIdParam;
    }

    // Fetch metric aggregates
    const [accruedAgg, paidAgg, cancelledAgg, totalCommissionsCount] = await Promise.all([
      prisma.commission.aggregate({
        where: { ...statsWhere, status: "ACCRUED" },
        _sum: { amount: true },
      }),
      prisma.commission.aggregate({
        where: { ...statsWhere, status: "PAID" },
        _sum: { amount: true },
      }),
      prisma.commission.aggregate({
        where: { ...statsWhere, status: "CANCELLED" },
        _sum: { amount: true },
      }),
      prisma.commission.count({
        where: statsWhere,
      }),
    ]);

    const totalAccrued = Number(accruedAgg._sum.amount || 0);
    const totalPaid = Number(paidAgg._sum.amount || 0);
    const totalPending = totalAccrued;
    const totalCancelled = Number(cancelledAgg._sum.amount || 0);

    // Fetch paginated commissions
    const commissions = await prisma.commission.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take,
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
            country: true,
            trade: true,
          },
        },
      },
    });

    const paginatedCount = await prisma.commission.count({
      where: whereClause,
    });

    // Flatten commission record details
    const data = commissions.map((c) => ({
      id: c.id,
      agentId: c.agentId,
      agentCode: c.agent.agentCode,
      agentName: c.agent.companyName || c.agent.user?.fullName || "Unknown Agent",
      applicantId: c.applicantId,
      applicantName: c.applicant.fullName,
      passportNumber: c.applicant.passportNumber,
      jobOrderId: c.jobOrderId,
      jobOrderNumber: c.jobOrder.orderNumber,
      country: c.jobOrder.country,
      trade: c.jobOrder.trade,
      amount: Number(c.amount),
      status: c.status,
      payoutRef: c.payoutRef,
      payoutDate: c.payoutDate ? c.payoutDate.toISOString().split("T")[0] : null,
      createdAt: c.createdAt.toISOString().split("T")[0],
    }));

    return NextResponse.json({
      data,
      stats: {
        totalAccrued,
        totalPaid,
        totalPending,
        totalCancelled,
        totalCommissions: totalCommissionsCount,
      },
      pagination: {
        total: paginatedCount,
        page,
        pageSize,
      },
    });
  } catch (error: any) {
    console.error("GET /api/finance/commissions Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred while retrieving agent commissions." },
      { status: 500 }
    );
  }
}
