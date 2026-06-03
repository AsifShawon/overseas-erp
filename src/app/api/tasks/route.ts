// src/app/api/tasks/route.ts
// GET /api/tasks — List tasks scoped to active company
// POST /api/tasks — Create a new task

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";
import { notifyUser } from "@/lib/notifications/notification-service";
import { NotificationType, NotificationPriority } from "@/lib/notifications/notification-types";

export async function GET(request: Request) {
  try {
    const { activeCompanyId, userId, roleName } = await getCompanyContextOrThrow(request);
    const url = new URL(request.url);
    const status   = url.searchParams.get("status") || "";
    const myTasks  = url.searchParams.get("myTasks") === "true";
    const page     = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(100, parseInt(url.searchParams.get("pageSize") || "50"));
    const skip     = (page - 1) * pageSize;

    const where: any = { companyId: activeCompanyId };

    // Non-admins see only their assigned tasks
    const isAdmin = roleName === "Super Admin" || roleName === "Operations Admin";
    if (!isAdmin || myTasks) {
      where.assignedToId = userId;
    }

    if (status) where.status = status;

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
        include: {
          applicant: { select: { fullName: true, passportNumber: true } },
        },
      }),
    ]);

    return NextResponse.json({
      data: tasks,
      pagination: { total, page, pageSize },
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/tasks Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { activeCompanyId, userId } = await getCompanyContextOrThrow(request);
    const body = await request.json();

    const {
      title, description, priority, dueAt,
      assignedToId, assignedRoleId, applicantId,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        companyId:      activeCompanyId,
        title,
        description:    description ?? null,
        priority:       priority    ?? "NORMAL",
        dueAt:          dueAt ? new Date(dueAt) : null,
        assignedToId:   assignedToId   ?? null,
        assignedRoleId: assignedRoleId ?? null,
        applicantId:    applicantId    ?? null,
        createdById:    userId,
        status:         "PENDING",
      },
    });

    // Notify assigned user if specified
    if (assignedToId && assignedToId !== userId) {
      await notifyUser({
        userId:       assignedToId,
        companyId:    activeCompanyId,
        title:        "New Task Assigned",
        message:      `You have been assigned a new task: "${title}"${dueAt ? ` due ${new Date(dueAt).toLocaleDateString()}` : ""}.`,
        type:         NotificationType.TASK_ASSIGNED,
        priority:     NotificationPriority.NORMAL,
        relatedModel: "Task",
        relatedId:    task.id,
        actionUrl:    "/tasks",
        sendEmail:    true,
      });
    }

    return NextResponse.json(task, { status: 201 });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/tasks Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
