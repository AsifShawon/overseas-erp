// src/app/api/notifications/web-push/test/route.ts
// POST /api/notifications/web-push/test — Send a test push to current user.

import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { sendWebPushToUser } from "@/lib/notifications/web-push";

export async function POST(request: Request) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await sendWebPushToUser(user.userId, {
      title:     "Test Notification — VisaTek ERP",
      message:   "Your browser notifications are working correctly.",
      actionUrl: "/notifications",
      type:      "GENERAL",
    });

    return NextResponse.json({ success: true, message: "Test push sent to your active subscriptions." });
  } catch (err) {
    console.error("POST /api/notifications/web-push/test Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
