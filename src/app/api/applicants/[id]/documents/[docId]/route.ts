// src/app/api/applicants/[id]/documents/[docId]/route.ts
// PATCH /api/applicants/[id]/documents/[docId] - Verify or Reject compliance documents

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";
import { z } from "zod";

const VerifySchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED"]),
  remarks: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params;

    // 1. Authenticate Request
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { userId, roleName } = decoded;

    // 2. RBAC check: Restrict document verification to Super Admin, Operations Admin, and Documentation Officer
    const isSuperOrOps = roleName === "Super Admin" || roleName === "Operations Admin";
    const isDocOfficer = roleName === "Documentation Officer";
    const permissions = await getUserPermissions(userId);
    const hasVerifyPermission = permissions.includes("VERIFY_DOCUMENT");

    if (!isSuperOrOps && !isDocOfficer && !hasVerifyPermission) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient permissions to verify compliance documents." },
        { status: 403 }
      );
    }

    // 3. Parse and validate JSON input payload
    const body = await request.json();
    const validatedData = VerifySchema.parse(body);
    const { status, remarks } = validatedData;

    // 4. Verify applicant and document existence
    const applicant = await prisma.applicant.findUnique({
      where: { id },
    });
    if (!applicant) {
      return NextResponse.json({ error: "Applicant record not found." }, { status: 404 });
    }

    const document = await prisma.document.findUnique({
      where: { id: docId },
    });
    if (!document || document.applicantId !== id) {
      return NextResponse.json({ error: "Document record not found for this applicant." }, { status: 404 });
    }

    // 5. Commit changes inside a database transaction
    await prisma.$transaction(async (tx) => {
      // Update Document Row
      await tx.document.update({
        where: { id: docId },
        data: {
          status: status as any,
          verifiedById: userId,
        },
      });

      // Save remarks and audit delta in Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          roleName,
          actionType: status === "VERIFIED" ? "VERIFY_DOCUMENT" : "REJECT_DOCUMENT",
          tableName: "Document",
          recordId: docId,
          delta: {
            before: { status: document.status, verifiedById: document.verifiedById },
            after: { status, verifiedById: userId },
            remarks: remarks || null,
            verifiedAt: new Date().toISOString(),
          } as any,
          ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
        },
      });

      // Create Notification for the linked applicant user if linked
      if (applicant.userId) {
        await tx.notification.create({
          data: {
            userId: applicant.userId,
            title: `Compliance File: ${status === "VERIFIED" ? "Approved" : "Rejected"}`,
            message: `Your document (${document.documentType.replace("_", " ")}) has been reviewed and ${status.toLowerCase()}.${remarks ? ` Remarks: ${remarks}` : ""}`,
          },
        });
      }

      // Create Notification for the sourcing Agent user if linked
      if (applicant.agentId) {
        const agent = await tx.agent.findUnique({
          where: { id: applicant.agentId },
          select: { userId: true },
        });
        if (agent) {
          await tx.notification.create({
            data: {
              userId: agent.userId,
              title: `Compliance Review Alert`,
              message: `Applicant ${applicant.fullName}'s ${document.documentType.replace("_", " ")} document was ${status.toLowerCase()}.${remarks ? ` Remarks: ${remarks}` : ""}`,
            },
          });
        }
      }
    });

    // 6. Fetch and return complete updated applicant dossier for UI sync
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation failed." }, { status: 400 });
    }
    console.error("PATCH /api/applicants/[id]/documents/[docId] Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
