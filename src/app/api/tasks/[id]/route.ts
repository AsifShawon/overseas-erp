// src/app/api/tasks/[id]/route.ts
// PATCH /api/tasks/[id] — Update a task

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { activeCompanyId } = await getCompanyContextOrThrow(request);
    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const task = await prisma.task.findFirst({
      where: { id, companyId: activeCompanyId },
    });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const { title, description, status, priority, dueAt, assignedToId } = body;

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(title         !== undefined && { title }),
        ...(description   !== undefined && { description }),
        ...(status        !== undefined && { status }),
        ...(priority      !== undefined && { priority }),
        ...(dueAt         !== undefined && { dueAt: dueAt ? new Date(dueAt) : null }),
        ...(assignedToId  !== undefined && { assignedToId }),
        ...(status === "COMPLETED" && { completedAt: new Date() }),
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PATCH /api/tasks/[id] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { activeCompanyId } = await getCompanyContextOrThrow(request);
    const { id } = await params;

    const task = await prisma.task.findFirst({
      where: { id, companyId: activeCompanyId },
      include: {
        applicant: { select: { fullName: true, passportNumber: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/tasks/[id] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
