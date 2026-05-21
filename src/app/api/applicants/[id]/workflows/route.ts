// src/app/api/applicants/[id]/workflows/route.ts
// POST /api/applicants/[id]/workflows - Commit workflow transition

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";
import { validateTransition } from "@/lib/workflow-rules";
import { z } from "zod";

const TransitionSchema = z.object({
  nextStage: z.enum([
    "APPLIED",
    "INTERVIEWED",
    "SELECTED",
    "MEDICAL_WAITING",
    "MEDICAL_FIT",
    "MEDICAL_UNFIT",
    "TRAINING_COMPLETED",
    "VISA_SUBMITTED",
    "VISA_STAMPED",
    "VISA_REJECTED",
    "TICKETED",
    "DEPLOYED"
  ]),
  remarks: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { userId, roleName } = decoded;

    // RBAC: Staff must hold TRANSITION_WORKFLOW permission or be Super Admin / Operations Admin
    const permissions = await getUserPermissions(userId);
    const isSuperOrOps = roleName === "Super Admin" || roleName === "Operations Admin";
    if (!isSuperOrOps && !permissions.includes("TRANSITION_WORKFLOW")) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient permissions to transition workflow." },
        { status: 403 }
      );
    }

    // Read payload
    const body = await request.json();
    const validatedData = TransitionSchema.parse(body);
    const { nextStage, remarks } = validatedData;

    // Perform state transition within transaction
    await prisma.$transaction(async (tx) => {
      // 1. Read applicant
      const applicant = await tx.applicant.findUnique({
        where: { id },
        include: {
          agent: true,
        },
      });

      if (!applicant) {
        throw new Error("NOT_FOUND");
      }

      // 2. Validate transition path and role-based stage access boundaries
      const validation = validateTransition(roleName, applicant.currentStage, nextStage);
      if (!validation.valid) {
        const errorReason = validation.reason || "Invalid transition.";
        if (errorReason.includes("Invalid pipeline path")) {
          throw new Error(`BAD_REQUEST:${errorReason}`);
        } else {
          throw new Error(`FORBIDDEN:${errorReason}`);
        }
      }

      // 3. Update Applicant.currentStage
      await tx.applicant.update({
        where: { id },
        data: {
          currentStage: nextStage,
        },
      });

      // 4. Create WorkflowHistory row
      await tx.workflowHistory.create({
        data: {
          applicantId: id,
          oldStage: applicant.currentStage,
          newStage: nextStage,
          changedById: userId,
          changeNotes: remarks || null,
        },
      });

      // 5. Create Notification row for linked applicant user if available
      if (applicant.userId) {
        await tx.notification.create({
          data: {
            userId: applicant.userId,
            title: "Application Status Update",
            message: `Your application stage has been updated from ${applicant.currentStage} to ${nextStage}.`,
          },
        });
      }

      // 6. Create Notification row for linked agent user if available (agentId -> Agent -> userId)
      if (applicant.agentId) {
        const agent = await tx.agent.findUnique({
          where: { id: applicant.agentId },
          select: { userId: true },
        });
        if (agent) {
          await tx.notification.create({
            data: {
              userId: agent.userId,
              title: "Candidate Progress Alert",
              message: `Candidate ${applicant.fullName}'s stage updated to ${nextStage}.`,
            },
          });
        }
      }

      // 7. Create AuditLog row with before/after delta
      await tx.auditLog.create({
        data: {
          userId,
          roleName,
          actionType: "TRANSITION_STAGE",
          tableName: "Applicant",
          recordId: id,
          delta: {
            before: { currentStage: applicant.currentStage },
            after: { currentStage: nextStage },
            remarks: remarks || null,
          } as any,
          ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
        },
      });
    });

    // Fetch updated applicant with sorted relation models to match GET response format
    const fullUpdatedApplicant = await prisma.applicant.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            agentCode: true,
            companyName: true,
          },
        },
        jobOrder: true,
        workflows: {
          orderBy: {
            timestamp: "desc",
          },
        },
        documents: {
          orderBy: {
            createdAt: "desc",
          },
        },
        invoices: {
          orderBy: {
            createdAt: "desc",
          },
        },
        receipts: {
          orderBy: {
            createdAt: "desc",
          },
        },
        ledgerEntries: {
          orderBy: {
            timestamp: "asc",
          },
        },
      },
    });

    return NextResponse.json(fullUpdatedApplicant);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation failed." }, { status: 400 });
    }
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return NextResponse.json({ error: "Applicant record not found." }, { status: 404 });
      }
      if (error.message.startsWith("BAD_REQUEST:")) {
        return NextResponse.json({ error: error.message.replace("BAD_REQUEST:", "") }, { status: 400 });
      }
      if (error.message.startsWith("FORBIDDEN:")) {
        return NextResponse.json({ error: error.message.replace("FORBIDDEN:", "") }, { status: 403 });
      }
    }
    console.error("POST /api/applicants/[id]/workflows Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
