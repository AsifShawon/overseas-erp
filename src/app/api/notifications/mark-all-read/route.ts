// src/app/api/notifications/mark-all-read/route.ts
// POST /api/notifications/mark-all-read - Mark all active user notifications as read in a single batch operation

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // 1. Authenticate Request
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { userId } = decoded;

    // 2. Perform bulk update inside database
    const updateResult = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({
      success: true,
      count: updateResult.count,
      message: "All user notifications successfully marked as read.",
    });
  } catch (error) {
    console.error("POST /api/notifications/mark-all-read Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
