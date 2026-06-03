// src/app/api/notifications/[id]/route.ts
// PATCH /api/notifications/[id] - Mark a specific notification as read, enforcing ownership boundaries

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { activeCompanyId, userId } = await getCompanyContextOrThrow(request);

    // 2. Fetch the notification to check existence and active company ownership
    const notification = await prisma.notification.findFirst({
      where: { id, userId, companyId: activeCompanyId },
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    }

    // 4. Update and mark as read
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json(updatedNotification);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }
    console.error("PATCH /api/notifications/[id] Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
