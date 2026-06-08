import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBranchContext, buildBranchWhere } from "@/lib/branch-scope";

export async function GET(request: Request) {
  try {
    const branchScope = await requireBranchContext(request);
    const { activeCompanyId, userId } = branchScope;

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10));

    const baseWhere = buildBranchWhere(activeCompanyId, branchScope);
    const where: any = {};

    if (branchScope.isAllBranches) {
      where.companyId = activeCompanyId;
      if (baseWhere.branchId) {
        where.branchId = baseWhere.branchId;
      }
    } else {
      where.companyId = activeCompanyId;
      where.OR = [
        { userId: userId },
        { branchId: baseWhere.branchId || { in: branchScope.branchIds } }
      ];
    }

    if (unreadOnly) {
      where.isRead = false;
    }

    const skip = (page - 1) * pageSize;

    const [total, data, unread] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.notification.count({
        where: { ...where, isRead: false },
      }),
    ]);

    return NextResponse.json({
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      stats: {
        total,
        unread,
        channelStatus: "Healthy",
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message === "FORBIDDEN" ? "Forbidden" : "Unauthorized" }, { status: error.message === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("GET /api/notifications Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const branchScope = await requireBranchContext(request);
    const { activeCompanyId, userId } = branchScope;

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Simulation alerts are locked in production environments." },
        { status: 403 }
      );
    }

    let branchId = request.headers.get("X-Branch-Id") || undefined;
    if (!branchId) {
      if (branchScope.branchIds.length === 1) {
        branchId = branchScope.branchIds[0];
      } else {
        const hoBranch = await prisma.branch.findFirst({
          where: { companyId: activeCompanyId, isHeadOffice: true },
        });
        branchId = hoBranch?.id || undefined;
      }
    }

    const newNot = await prisma.notification.create({
      data: {
        userId,
        title: "Consulate Clearance Completed",
        message: `System audited candidate passport dossier. Emigration certificate issued successfully at ${new Date().toLocaleTimeString()}.`,
        isRead: false,
        companyId: activeCompanyId,
        branchId,
      },
    });

    return NextResponse.json(newNot);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message === "FORBIDDEN" ? "Forbidden" : "Unauthorized" }, { status: error.message === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("POST /api/notifications Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
