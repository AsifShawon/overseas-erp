import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";
import { buildCsv, csvResponse } from "@/lib/csv";

export async function GET(request: Request) {
  try {
    const { activeCompanyId, userId, roleName, permissions } = await getCompanyContextOrThrow(request);

    // Enforce RBAC
    const isSuperAdmin = roleName === "Super Admin";
    let isAuthorized = isSuperAdmin;

    if (!isAuthorized) {
      isAuthorized = permissions.includes("VIEW_AUDIT_LOGS");
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient permissions to view audit logs." },
        { status: 403 }
      );
    }

    // Parse filters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const actionType = searchParams.get("actionType") || undefined;
    const tableName = searchParams.get("tableName") || undefined;
    const operatorRole = searchParams.get("roleName") || undefined;

    // Construct DB filtering
    const where: any = {
      companyId: activeCompanyId,
    };

    if (actionType) {
      where.actionType = actionType;
    }
    if (tableName) {
      where.tableName = tableName;
    }
    if (operatorRole) {
      where.roleName = operatorRole;
    }

    if (search) {
      where.OR = [
        { actionType: { contains: search, mode: "insensitive" } },
        { tableName: { contains: search, mode: "insensitive" } },
        { roleName: { contains: search, mode: "insensitive" } },
        { ipAddress: { contains: search, mode: "insensitive" } },
        {
          user: {
            fullName: { contains: search, mode: "insensitive" },
          },
        },
        {
          user: {
            email: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    // Query audit logs without limits
    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    const headers = [
      "Timestamp",
      "User",
      "Role",
      "Action Type",
      "Table Name",
      "Record ID",
      "IP Address",
      "Delta JSON",
    ];

    const rows = auditLogs.map((log) => {
      const userName = log.user?.fullName || log.userId || "System Engine";
      const userRole = log.roleName || "System";
      const ipAddr = log.ipAddress || "System Engine";
      
      return [
        log.timestamp.toISOString(),
        userName,
        userRole,
        log.actionType,
        log.tableName,
        log.recordId || "N/A",
        ipAddr,
        log.delta, // escapeCsvValue will stringify and safely quote this JSON object
      ];
    });

    const csvText = buildCsv(headers, rows);
    return csvResponse(`audit_logs_export_${Date.now()}.csv`, csvText);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized access or inactive company workspace." },
        { status: 401 }
      );
    }
    console.error("GET /api/exports/audit-logs Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred during audit log CSV generation." },
      { status: 500 }
    );
  }
}
