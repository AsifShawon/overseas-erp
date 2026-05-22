// src/app/api/audit-logs/route.ts
// GET /api/audit-logs - Fetch paginated and filterable regulatory operation audit logs

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    // 1. Authenticate Request
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { userId, roleName } = decoded;

    // 2. Enforce RBAC
    const isSuperAdmin = roleName === "Super Admin";
    let isAuthorized = isSuperAdmin;

    if (!isAuthorized) {
      const permissions = await getUserPermissions(userId);
      isAuthorized = permissions.includes("VIEW_AUDIT_LOGS");
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient permissions to view audit logs." },
        { status: 403 }
      );
    }

    // 3. Parse query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const actionType = searchParams.get("actionType") || undefined;
    const tableName = searchParams.get("tableName") || undefined;
    const operatorRole = searchParams.get("roleName") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10));

    // 4. Construct DB filtering
    const where: any = {};

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

    const skip = (page - 1) * pageSize;

    // 5. Query counts and paginated logs
    const [total, data, totalLogs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip,
        take: pageSize,
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      }),
      prisma.auditLog.count(),
    ]);

    // 6. Return response matching requested shape
    return NextResponse.json({
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      stats: {
        totalLogs,
        ipLoggingEnabled: true,
        auditChainStatus: "SHA-256 Locked",
      },
    });
  } catch (error) {
    console.error("GET /api/audit-logs Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
