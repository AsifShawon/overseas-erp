// src/app/api/platform/company-applications/route.ts
// GET /api/platform/company-applications - List company applications for platform admin

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const adminCheck = await requirePlatformAdmin(request);
    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ALL";

    const where: any = {};
    if (status !== "ALL") {
      where.status = status;
    }

    const applications = await prisma.companyApplication.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("GET /api/platform/company-applications Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
