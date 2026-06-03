// src/app/api/notifications/web-push/unsubscribe/route.ts
// POST /api/notifications/web-push/unsubscribe — Deactivate push subscription.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (endpoint) {
      // Deactivate specific subscription
      await prisma.webPushSubscription.updateMany({
        where: { endpoint, userId: user.userId },
        data: { isActive: false },
      });
    } else {
      // Deactivate all subscriptions for this user
      await prisma.webPushSubscription.updateMany({
        where: { userId: user.userId },
        data: { isActive: false },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/notifications/web-push/unsubscribe Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
