// src/app/api/tasks/route.ts
// GET /api/tasks — List tasks scoped to active company
// POST /api/tasks — Create a new task

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";
import { notifyUser } from "@/lib/notifications/notification-service";
import { NotificationType, NotificationPriority } from "@/lib/notifications/notification-types";
import { requireBranchContext, buildBranchWhere, validateWriteBranch } from "@/lib/branch-scope";

export async function GET(request: Request) {
  try {
    const branchScope = await requireBranchContext(request);
    const { activeCompanyId, userId, roleName, roleId } = branchScope;
    const url = new URL(request.url);
    const status   = url.searchParams.get("status") || "";
    const myTasks  = url.searchParams.get("myTasks") === "true";
    const page     = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(100, parseInt(url.searchParams.get("pageSize") || "50"));
    const skip     = (page - 1) * pageSize;

    const baseWhere = buildBranchWhere(activeCompanyId, branchScope);
    const where: any = { ...baseWhere };

    // Non-admins see only their assigned tasks or tasks assigned to their branch + role
    const isAdmin = roleName === "Super Admin" || roleName === "Operations Admin" || branchScope.isAllBranches;

    if (myTasks) {
      where.assignedToId = userId;
    } else if (!isAdmin) {
      // Branch staff sees tasks assigned directly to them, OR assigned to their branch/role
      delete where.branchId;
      where.OR = [
        {
          assignedToId: userId,
          ...(baseWhere.branchId ? { branchId: baseWhere.branchId } : {}),
        },
        {
          branchId: baseWhere.branchId || { in: branchScope.branchIds },
          assignedRoleId: roleId,
        }
      ];
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
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return NextResponse.json({ error: err.message === "FORBIDDEN" ? "Forbidden" : "Unauthorized" }, { status: err.message === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("GET /api/tasks Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const branchScope = await requireBranchContext(request);
    const { activeCompanyId, userId } = branchScope;
    const body = await request.json();

    const {
      title, description, priority, dueAt,
      assignedToId, assignedRoleId, applicantId,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    let targetBranchId: string | null = null;
    if (applicantId) {
      const applicant = await prisma.applicant.findFirst({
        where: { id: applicantId, companyId: activeCompanyId },
      });
      if (!applicant) {
        return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
      }

      // Enforce branch access check on applicant
      if (!branchScope.isAllBranches && applicant.branchId && !branchScope.branchIds.includes(applicant.branchId)) {
        return NextResponse.json({ error: "Forbidden. Inaccessible applicant." }, { status: 403 });
      }
      targetBranchId = applicant.branchId;
    }

    let branchId = body.branchId;
    if (applicantId && targetBranchId) {
      branchId = targetBranchId;
    }

    if (branchId) {
      await validateWriteBranch(branchId, activeCompanyId, branchScope);
    } else {
      if (branchScope.isAllBranches) {
        const hoBranch = await prisma.branch.findFirst({
          where: { companyId: activeCompanyId, isHeadOffice: true },
        });
        branchId = hoBranch?.id || null;
      } else if (branchScope.branchIds.length === 1) {
        branchId = branchScope.branchIds[0];
      } else {
        return NextResponse.json({ error: "branchId is required for multi-branch staff" }, { status: 400 });
      }
    }

    const task = await prisma.task.create({
      data: {
        companyId:      activeCompanyId,
        branchId,
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
        branchId:     branchId,
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
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return NextResponse.json({ error: err.message === "FORBIDDEN" ? "Forbidden" : "Unauthorized" }, { status: err.message === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("POST /api/tasks Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
