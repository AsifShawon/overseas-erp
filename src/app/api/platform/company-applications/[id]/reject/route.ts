// src/app/api/platform/company-applications/[id]/reject/route.ts
// POST /api/platform/company-applications/[id]/reject - Reject a pending application

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requirePlatformAdmin(request);
    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { rejectionReason } = body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return NextResponse.json({ error: "Rejection reason is required." }, { status: 400 });
    }

    const application = await prisma.companyApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json({ error: "Company application not found." }, { status: 404 });
    }

    if (application.status !== "PENDING") {
      return NextResponse.json({ error: "Only PENDING applications can be rejected." }, { status: 400 });
    }

    const updatedApplication = await prisma.companyApplication.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: rejectionReason.trim(),
        reviewedById: adminCheck.user.id,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error("POST /api/platform/company-applications/[id]/reject Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
