// src/app/api/notifications/[id]/route.ts
// PATCH /api/notifications/[id] - Mark a specific notification as read, enforcing ownership boundaries

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Authenticate Request
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { userId } = decoded;

    // 2. Fetch the notification to check existence
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    }

    // 3. Enforce boundary scoping (ownership check)
    if (notification.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden. You can only modify your own notifications." },
        { status: 403 }
      );
    }

    // 4. Update and mark as read
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error("PATCH /api/notifications/[id] Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
