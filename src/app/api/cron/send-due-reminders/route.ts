// src/app/api/cron/send-due-reminders/route.ts
// POST /api/cron/send-due-reminders — Protected cron endpoint for due date reminder scanning.
//
// Security: Protected by CRON_SECRET env variable.
//
// Dev usage:
//   curl -X POST http://localhost:3000/api/cron/send-due-reminders \
//     -H "Authorization: Bearer $CRON_SECRET"
//
// Vercel/external cron: Configure to call this endpoint with the bearer token.

import { NextResponse } from "next/server";
import { runAllDueReminders } from "@/lib/notifications/due-reminders";

export async function POST(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;

    // Reject if CRON_SECRET not configured
    if (!cronSecret) {
      return NextResponse.json(
        { error: "CRON_SECRET is not configured on this server." },
        { status: 500 }
      );
    }

    // Validate bearer token
    const authHeader = request.headers.get("Authorization");
    const providedToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!providedToken || providedToken !== cronSecret) {
      return NextResponse.json(
        { error: "Unauthorized. Invalid or missing CRON_SECRET." },
        { status: 401 }
      );
    }

    const startedAt = Date.now();

    // Run all reminder scanners
    const result = await runAllDueReminders();

    const durationMs = Date.now() - startedAt;

    return NextResponse.json({
      success: true,
      durationMs,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("POST /api/cron/send-due-reminders Error:", err);
    return NextResponse.json(
      { error: "Cron job failed.", details: err.message },
      { status: 500 }
    );
  }
}
