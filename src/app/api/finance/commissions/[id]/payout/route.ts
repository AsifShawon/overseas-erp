// src/app/api/finance/commissions/[id]/payout/route.ts
// POST /api/finance/commissions/[id]/payout - Administrative action to settle accrued commission and release cash payout.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";
import { z } from "zod";

const PayoutSchema = z.object({
  payoutRef: z.string().trim().min(1, "Settlement payout reference code is required."),
  payoutDate: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { userId, roleName } = decoded;

    // Boundary Check: Explicitly block Agent and Applicant user roles
    if (roleName === "Agent" || roleName === "Applicant") {
      return NextResponse.json(
        { error: "Forbidden. Sourced cohorts and candidates cannot settle commission payouts." },
        { status: 403 }
      );
    }

    // RBAC: Check permissions
    const permissions = await getUserPermissions(userId);
    const isAuthorized =
      roleName === "Super Admin" ||
      roleName === "Operations Admin" ||
      roleName === "Accounts Officer" ||
      permissions.includes("MANAGE_ACCOUNTS" as any) ||
      permissions.includes("RECORD_PAYMENT" as any);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient credentials to release commission payout settlement." },
        { status: 403 }
      );
    }

    // Parse and validate incoming payload
    const body = await request.json();
    const validatedData = PayoutSchema.parse(body);
    const { payoutRef, payoutDate } = validatedData;

    let resultCommission: any = null;

    // Execute atomic transaction for commission state update and log audit trail
    await prisma.$transaction(async (tx) => {
      // 1. Fetch current commission details with associated profiles
      const commission = await tx.commission.findUnique({
        where: { id },
        include: {
          agent: true,
          applicant: true,
          jobOrder: true,
        },
      });

      if (!commission) {
        throw new Error("NOT_FOUND");
      }

      if (commission.status !== "ACCRUED") {
        throw new Error("BAD_STATUS");
      }

      const settlementDate = payoutDate ? new Date(payoutDate) : new Date();

      // 2. Perform database update
      resultCommission = await tx.commission.update({
        where: { id },
        data: {
          status: "PAID",
          payoutRef,
          payoutDate: settlementDate,
        },
        include: {
          agent: {
            select: {
              agentCode: true,
              companyName: true,
            },
          },
          applicant: {
            select: {
              fullName: true,
              passportNumber: true,
            },
          },
          jobOrder: {
            select: {
              orderNumber: true,
              country: true,
              trade: true,
            },
          },
        },
      });

      // 3. Dispatch Agent Notification if Agent user ID is linked
      if (commission.agent?.userId) {
        await tx.notification.create({
          data: {
            userId: commission.agent.userId,
            title: "Commission Payout Released",
            message: `Your accrued placement commission of $${Number(commission.amount).toLocaleString()} for candidate ${commission.applicant.fullName} has been paid via transfer ref: ${payoutRef}.`,
          },
        });
      }

      // 4. Create AuditLog row tracking the change
      await tx.auditLog.create({
        data: {
          userId,
          roleName,
          actionType: "PAYOUT_COMMISSION",
          tableName: "Commission",
          recordId: id,
          delta: {
            before: {
              status: commission.status,
              payoutRef: commission.payoutRef,
              payoutDate: commission.payoutDate,
            },
            after: {
              status: resultCommission.status,
              payoutRef: resultCommission.payoutRef,
              payoutDate: resultCommission.payoutDate,
            },
          } as any,
          ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
        },
      });
    });

    // Flatten commission record details for frontend response
    const responseData = {
      id: resultCommission.id,
      agentId: resultCommission.agentId,
      agentCode: resultCommission.agent.agentCode,
      agentName: resultCommission.agent.companyName || "Unknown Agent",
      applicantId: resultCommission.applicantId,
      applicantName: resultCommission.applicant.fullName,
      passportNumber: resultCommission.applicant.passportNumber,
      jobOrderId: resultCommission.jobOrderId,
      jobOrderNumber: resultCommission.jobOrder.orderNumber,
      country: resultCommission.jobOrder.country,
      trade: resultCommission.jobOrder.trade,
      amount: Number(resultCommission.amount),
      status: resultCommission.status,
      payoutRef: resultCommission.payoutRef,
      payoutDate: resultCommission.payoutDate ? resultCommission.payoutDate.toISOString().split("T")[0] : null,
      createdAt: resultCommission.createdAt.toISOString().split("T")[0],
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed." },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return NextResponse.json({ error: "Commission record not found." }, { status: 404 });
      }
      if (error.message === "BAD_STATUS") {
        return NextResponse.json(
          { error: "Commission can only be paid out from the ACCRUED state." },
          { status: 400 }
        );
      }
    }

    console.error("POST /api/finance/commissions/[id]/payout Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred while releasing commission payout." },
      { status: 500 }
    );
  }
}
