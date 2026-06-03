// src/app/api/platform/notifications/route.ts
// GET /api/platform/notifications — Platform admin only notification list.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const adminCtx = await requirePlatformAdmin(request);
    if (!adminCtx) {
      return NextResponse.json({ error: "Forbidden. Platform admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page     = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") || "20"));
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const skip = (page - 1) * pageSize;

    const where: any = {
      userId: adminCtx.user.id,
      // Platform notifications have null companyId OR type starts with PLATFORM_
      OR: [
        { companyId: null },
        { type: { startsWith: "PLATFORM_" } },
      ],
    };
    if (unreadOnly) where.isRead = false;

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
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      stats: { total, unread },
    });
  } catch (err) {
    console.error("GET /api/platform/notifications Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
