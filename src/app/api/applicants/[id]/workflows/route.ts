// src/app/api/applicants/[id]/workflows/route.ts
// POST /api/applicants/[id]/workflows - Commit workflow transition

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";
import { validateTransition, DOCUMENT_PREREQUISITES } from "@/lib/workflow-rules";
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
          documents: true,
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

      // 2b. Validate document prerequisites
      const requiredDocs = DOCUMENT_PREREQUISITES[nextStage] || [];
      const verifiedDocs = applicant.documents
        .filter((doc) => doc.status === "VERIFIED")
        .map((doc) => doc.documentType as string);

      const missingDocs = requiredDocs.filter((docType) => !verifiedDocs.includes(docType));

      let isOverrideUsed = false;

      if (missingDocs.length > 0) {
        const isSuperOrOps = roleName === "Super Admin" || roleName === "Operations Admin";
        if (isSuperOrOps) {
          // Admin override is allowed only if they provide remarks
          if (!remarks || remarks.trim() === "") {
            throw new Error(
              `BAD_REQUEST:Prerequisite document(s) [${missingDocs.join(
                ", "
              )}] are missing or unverified. As an Administrator, you must provide justification remarks to override this stage-gate block.`
            );
          }
          isOverrideUsed = true;
        } else {
          // Non-admin roles cannot override
          throw new Error(
            `BAD_REQUEST:Prerequisite document(s) [${missingDocs.join(
              ", "
            )}] must be uploaded and verified before transitioning candidate to ${nextStage}.`
          );
        }
      }

      // 2c. Special Stage-Gate: DEPLOYED requires currentStage to be TICKETED
      if (nextStage === "DEPLOYED" && applicant.currentStage !== "TICKETED") {
        const isSuperOrOps = roleName === "Super Admin" || roleName === "Operations Admin";
        if (isSuperOrOps) {
          if (!remarks || remarks.trim() === "") {
            throw new Error(
              `BAD_REQUEST:Transition to DEPLOYED requires the candidate to be TICKETED first. As an Administrator, you must provide justification remarks to override this stage-gate block.`
            );
          }
          isOverrideUsed = true;
        } else {
          throw new Error(
            `BAD_REQUEST:Candidate must be in the TICKETED stage before being DEPLOYED.`
          );
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
            message: `Your application stage has been updated from ${applicant.currentStage} to ${nextStage}.${isOverrideUsed ? " (Authorized override used)" : ""}`,
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
              message: `Candidate ${applicant.fullName}'s stage updated to ${nextStage}.${isOverrideUsed ? " (Authorized override used)" : ""}`,
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
            overrideUsed: isOverrideUsed,
            missingPrerequisites: missingDocs.length > 0 ? missingDocs : undefined,
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
