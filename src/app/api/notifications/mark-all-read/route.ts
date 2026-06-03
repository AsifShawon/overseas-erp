// src/app/api/notifications/mark-all-read/route.ts
// POST /api/notifications/mark-all-read - Mark all active user notifications as read in a single batch operation

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";

export async function POST(request: Request) {
  try {
    // 1. Authenticate Request and resolve company context
    const { activeCompanyId, userId } = await getCompanyContextOrThrow(request);

    // 2. Perform bulk update inside database
    const updateResult = await prisma.notification.updateMany({
      where: {
        userId,
        companyId: activeCompanyId, // FORCE TENANT ISOLATION
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({
      success: true,
      count: updateResult.count,
      message: "All user company notifications successfully marked as read.",
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }
    console.error("POST /api/notifications/mark-all-read Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
