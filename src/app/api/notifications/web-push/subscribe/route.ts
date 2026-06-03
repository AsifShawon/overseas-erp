// src/app/api/notifications/web-push/subscribe/route.ts
// POST /api/notifications/web-push/subscribe — Save push subscription for current user.

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
    const { endpoint, p256dh, auth, userAgent } = body;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "endpoint, p256dh, and auth are required" }, { status: 400 });
    }

    // Upsert by endpoint (unique) — prevents duplicate subscriptions
    const sub = await prisma.webPushSubscription.upsert({
      where: { endpoint },
      update: {
        userId:    user.userId,
        companyId: user.activeCompanyId ?? null,
        p256dh,
        auth,
        userAgent: userAgent ?? null,
        isActive:  true,
        updatedAt: new Date(),
      },
      create: {
        userId:    user.userId,
        companyId: user.activeCompanyId ?? null,
        endpoint,
        p256dh,
        auth,
        userAgent: userAgent ?? null,
        isActive:  true,
      },
    });

    return NextResponse.json({ success: true, id: sub.id });
  } catch (err) {
    console.error("POST /api/notifications/web-push/subscribe Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
