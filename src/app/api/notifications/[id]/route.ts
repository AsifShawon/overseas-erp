import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBranchContext } from "@/lib/branch-scope";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const branchScope = await requireBranchContext(request);
    const { activeCompanyId, userId } = branchScope;

    const notification = await prisma.notification.findFirst({
      where: { id, companyId: activeCompanyId },
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    }

    const isOwner = notification.userId === userId;
    const isBranchAccess = notification.branchId && !branchScope.isAllBranches && branchScope.branchIds.includes(notification.branchId);

    if (!isOwner && !branchScope.isAllBranches && !isBranchAccess) {
      return NextResponse.json({ error: "Forbidden. Inaccessible notification." }, { status: 403 });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json(updatedNotification);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message === "FORBIDDEN" ? "Forbidden" : "Unauthorized" }, { status: error.message === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("PATCH /api/notifications/[id] Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
