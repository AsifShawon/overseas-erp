// src/app/api/finance/commissions/accrue/route.ts
// POST /api/finance/commissions/accrue - Automatic administrative scan to accrue commissions for placed candidates.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";

export async function POST(request: Request) {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { userId, roleName } = decoded;

    // Boundary Check: Explicitly block Agent and Applicant user roles from administrative accruals
    if (roleName === "Agent" || roleName === "Applicant") {
      return NextResponse.json(
        { error: "Forbidden. Sourced cohorts and candidates cannot invoke administrative commission scans." },
        { status: 403 }
      );
    }

    // RBAC: Check permissions
    const permissions = await getUserPermissions(userId);
    const isAuthorized =
      roleName === "Super Admin" ||
      roleName === "Operations Admin" ||
      roleName === "Accounts Officer" ||
      permissions.includes("MANAGE_ACCOUNTS" as any);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient administrative permissions to trigger commission accrual." },
        { status: 403 }
      );
    }

    let createdCount = 0;

    // Execute atomic transaction for safe, concurrent-safe scans
    await prisma.$transaction(async (tx) => {
      // 1. Scan eligible candidates: agentId exists, jobOrderId exists, stage is DEPLOYED, and no existing commission
      const eligibleApplicants = await tx.applicant.findMany({
        where: {
          agentId: { not: null },
          jobOrderId: { not: null },
          currentStage: "DEPLOYED",
          commissions: { none: {} },
        },
        include: {
          agent: true,
          jobOrder: true,
        },
      });

      for (const applicant of eligibleApplicants) {
        if (!applicant.agentId || !applicant.jobOrderId || !applicant.jobOrder) {
          continue;
        }

        // 2. Insert Commission row
        const commission = await tx.commission.create({
          data: {
            agentId: applicant.agentId,
            applicantId: applicant.id,
            jobOrderId: applicant.jobOrderId,
            amount: applicant.jobOrder.commissionAmount,
            status: "ACCRUED",
          },
        });

        createdCount++;

        // 3. Dispatch Agent Notification if Agent profile is linked to a system User ID
        if (applicant.agent?.userId) {
          await tx.notification.create({
            data: {
              userId: applicant.agent.userId,
              title: "Candidate Commission Accrued",
              message: `Placement commission of $${applicant.jobOrder.commissionAmount.toLocaleString()} has been accrued for candidate ${applicant.fullName} (${applicant.passportNumber}).`,
            },
          });
        }

        // 4. Create AuditLog row tracking the database change
        await tx.auditLog.create({
          data: {
            userId,
            roleName,
            actionType: "ACCRUE_COMMISSION",
            tableName: "Commission",
            recordId: commission.id,
            delta: {
              before: null,
              after: {
                id: commission.id,
                agentId: commission.agentId,
                applicantId: commission.applicantId,
                jobOrderId: commission.jobOrderId,
                amount: Number(commission.amount),
                status: commission.status,
              },
            } as any,
            ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      count: createdCount,
      message: `${createdCount} commissions successfully scanned and accrued.`,
    });
  } catch (error: any) {
    console.error("POST /api/finance/commissions/accrue Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred while scanning candidate placements." },
      { status: 500 }
    );
  }
}
