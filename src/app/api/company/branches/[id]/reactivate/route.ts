// src/app/api/company/branches/[id]/reactivate/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCompanyContext } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireCompanyContext(request);
    if (!ctx || !ctx.activeCompanyId) {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }

    if (!ctx.permissions.includes("SUSPEND_BRANCH") && !ctx.permissions.includes("UPDATE_BRANCH")) {
      return NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 });
    }

    const { id } = await params;

    const targetBranch = await prisma.branch.findFirst({
      where: { id, companyId: ctx.activeCompanyId },
    });

    if (!targetBranch) {
      return NextResponse.json({ error: "Branch not found in this company." }, { status: 404 });
    }

    const updated = await prisma.branch.update({
      where: { id },
      data: { status: "ACTIVE" },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: ctx.userId,
        roleName: ctx.roleName,
        actionType: "REACTIVATE_BRANCH",
        tableName: "Branch",
        recordId: id,
        companyId: ctx.activeCompanyId,
        delta: { status: "ACTIVE" } as any,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("POST /api/company/branches/[id]/reactivate Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
