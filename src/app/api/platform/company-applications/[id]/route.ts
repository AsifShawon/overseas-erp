// src/app/api/platform/company-applications/[id]/route.ts
// GET /api/platform/company-applications/[id] - Get details of a single company application

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requirePlatformAdmin(request);
    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await params;

    const application = await prisma.companyApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json({ error: "Company application not found." }, { status: 404 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("GET /api/platform/company-applications/[id] Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
