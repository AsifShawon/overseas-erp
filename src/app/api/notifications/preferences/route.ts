// src/app/api/notifications/preferences/route.ts
// GET /PUT /api/notifications/preferences — User notification preferences.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pref = await prisma.notificationPreference.findUnique({
      where: { userId: user.userId },
    });

    // Return defaults if not set
    return NextResponse.json(
      pref ?? {
        userId:       user.userId,
        companyId:    user.activeCompanyId,
        emailEnabled: true,
        pushEnabled:  true,
        inAppEnabled: true,
        categories:   null,
      }
    );
  } catch (err) {
    console.error("GET /api/notifications/preferences Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { emailEnabled, pushEnabled, inAppEnabled, categories } = body;

    const pref = await prisma.notificationPreference.upsert({
      where: { userId: user.userId },
      update: {
        emailEnabled: emailEnabled ?? true,
        pushEnabled:  pushEnabled  ?? true,
        inAppEnabled: inAppEnabled ?? true,
        categories:   categories ?? null,
      },
      create: {
        userId:       user.userId,
        companyId:    user.activeCompanyId ?? null,
        emailEnabled: emailEnabled ?? true,
        pushEnabled:  pushEnabled  ?? true,
        inAppEnabled: inAppEnabled ?? true,
        categories:   categories ?? null,
      },
    });

    return NextResponse.json(pref);
  } catch (err) {
    console.error("PUT /api/notifications/preferences Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
