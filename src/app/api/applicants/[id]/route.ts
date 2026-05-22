// src/app/api/applicants/[id]/route.ts
// GET /api/applicants/[id] - Fetch individual candidate
// PATCH /api/applicants/[id] - Update candidate records with change-log tracking

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";
import { z } from "zod";

// Zod validation schema for updating a candidate (all fields optional)
const UpdateApplicantSchema = z.object({
  passportNumber: z.string().min(1, "Passport number cannot be empty").optional(),
  passportExpiry: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  nationality: z.string().optional(),
  fullName: z.string().min(1, "Full name cannot be empty").optional(),
  phone: z.string().min(1, "Phone number cannot be empty").optional(),
  email: z
    .string()
    .email("Invalid email address")
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v))
    .optional()
    .nullable(),
  dateOfBirth: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  nidNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  trade: z.string().min(1, "Trade category cannot be empty").optional(),
  agentId: z.string().optional().nullable(),
  jobOrderId: z.string().optional().nullable(),
  isArchived: z.boolean().optional(),
});

/**
 * GET /api/applicants/[id]
 * Fetch a single candidate details. Enforces strict boundary scopes.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { userId, roleName } = decoded;

    // Fetch the applicant from database
    const applicant = await prisma.applicant.findUnique({
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

    if (!applicant) {
      return NextResponse.json({ error: "Applicant record not found." }, { status: 404 });
    }

    // Boundary check for Applicant users
    if (roleName === "Applicant") {
      const isOwnProfile = applicant.userId === userId || applicant.id === id; // Or matching linked profile
      // Check if this user actually owns this applicant profile
      const userProfile = await prisma.user.findUnique({
        where: { id: userId },
        include: { applicantProfile: true },
      });
      if (userProfile?.applicantProfile?.id !== id && !isOwnProfile) {
        return NextResponse.json(
          { error: "Forbidden. You can only view your own profile." },
          { status: 403 }
        );
      }
      return NextResponse.json(applicant);
    }

    // Boundary check for Agent users
    if (roleName === "Agent") {
      const agent = await prisma.agent.findUnique({
        where: { userId },
      });
      if (!agent || applicant.agentId !== agent.id) {
        return NextResponse.json(
          { error: "Forbidden. Sourcing boundaries restrict access to this file." },
          { status: 403 }
        );
      }
      return NextResponse.json(applicant);
    }

    // Staff check: Must hold VIEW_APPLICANTS permission if not Super/Ops Admin
    const permissions = await getUserPermissions(userId);
    const isSuperOrOps = roleName === "Super Admin" || roleName === "Operations Admin";
    if (!isSuperOrOps && !permissions.includes("VIEW_APPLICANTS")) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient permissions." },
        { status: 403 }
      );
    }

    return NextResponse.json(applicant);
  } catch (error) {
    console.error("GET /api/applicants/[id] Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

/**
 * PATCH /api/applicants/[id]
 * Update a candidate record. Enforces boundaries, Zod validation, and records audit logs.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { userId, roleName } = decoded;

    // Boundary Check: Applicants are forbidden from mutating records
    if (roleName === "Applicant") {
      return NextResponse.json(
        { error: "Forbidden. Candidates cannot edit applicant data." },
        { status: 403 }
      );
    }

    // Check RBAC permission for updates
    const permissions = await getUserPermissions(userId);
    const isSuperOrOps = roleName === "Super Admin" || roleName === "Operations Admin";
    if (!isSuperOrOps && !permissions.includes("UPDATE_APPLICANT")) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient permissions." },
        { status: 403 }
      );
    }

    // Fetch previous applicant state
    const previousApplicant = await prisma.applicant.findUnique({
      where: { id },
    });

    if (!previousApplicant) {
      return NextResponse.json({ error: "Applicant record not found." }, { status: 404 });
    }

    // Boundary Check: Agents are strictly scoped to their own applicants
    let enforcedAgentId: string | undefined = undefined;
    if (roleName === "Agent") {
      const agent = await prisma.agent.findUnique({
        where: { userId },
      });
      if (!agent || previousApplicant.agentId !== agent.id) {
        return NextResponse.json(
          { error: "Forbidden. Sourcing boundaries restrict access to this file." },
          { status: 403 }
        );
      }
      enforcedAgentId = agent.id;
    }

    const body = await request.json();
    const validatedData = UpdateApplicantSchema.parse(body);

    // Agents cannot reassign applicant to another agent
    if (enforcedAgentId) {
      delete validatedData.agentId;
    }

    // Check passport uniqueness if passport is changing
    if (
      validatedData.passportNumber &&
      validatedData.passportNumber.trim() !== previousApplicant.passportNumber
    ) {
      const existing = await prisma.applicant.findUnique({
        where: { passportNumber: validatedData.passportNumber.trim() },
      });
      if (existing) {
        return NextResponse.json(
          { error: "An applicant with this passport number already exists." },
          { status: 400 }
        );
      }
    }

    // Handle soft-archived logs logic
    if (validatedData.isArchived !== undefined && validatedData.isArchived !== previousApplicant.isArchived) {
      if (validatedData.isArchived) {
        (validatedData as any).archivedAt = new Date();
      } else {
        (validatedData as any).archivedAt = null;
      }
    }

    // Apply updates inside transaction to safely allocate / deallocate quotas
    const updatedApplicant = await prisma.$transaction(async (tx) => {
      const isJobOrderChanging = validatedData.jobOrderId !== undefined && validatedData.jobOrderId !== previousApplicant.jobOrderId;

      if (isJobOrderChanging) {
        // 1. If previous jobOrderId was defined, decrement its quota
        if (previousApplicant.jobOrderId) {
          const oldJob = await tx.jobOrder.findUnique({
            where: { id: previousApplicant.jobOrderId },
          });
          if (oldJob) {
            const nextQuota = Math.max(0, oldJob.allocatedQuota - 1);
            await tx.jobOrder.update({
              where: { id: oldJob.id },
              data: {
                allocatedQuota: nextQuota,
              },
            });
          }
        }

        // 2. If new jobOrderId is defined, validate and increment its quota
        if (validatedData.jobOrderId) {
          const newJob = await tx.jobOrder.findUnique({
            where: { id: validatedData.jobOrderId },
          });

          if (!newJob) {
            throw new Error("The specified Job Order placement does not exist.");
          }

          if (newJob.status !== "OPEN") {
            throw new Error("The selected Job Order is currently not open for recruitment placements.");
          }

          if (newJob.allocatedQuota >= newJob.totalQuota) {
            throw new Error(`The placement quota limit for this Job Order (${newJob.totalQuota}) has been fully filled.`);
          }

          // Increment the JobOrder allocatedQuota atomically
          await tx.jobOrder.update({
            where: { id: newJob.id },
            data: {
              allocatedQuota: {
                increment: 1,
              },
            },
          });
        }
      }

      // 3. Perform the actual candidate record update
      return await tx.applicant.update({
        where: { id },
        data: {
          ...validatedData,
          passportNumber: validatedData.passportNumber?.trim(),
        },
      });
    });

    // Create Audit Log entry recording delta
    await prisma.auditLog.create({
      data: {
        userId,
        roleName,
        actionType: "UPDATE_APPLICANT",
        tableName: "Applicant",
        recordId: id,
        delta: {
          before: previousApplicant,
          after: updatedApplicant,
        } as any,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json(updatedApplicant);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation failed." }, { status: 400 });
    }
    // Return custom business logic validation errors thrown in transaction as 400 Bad Request
    if (error instanceof Error && (
      error.message.includes("quota") ||
      error.message.includes("Job Order") ||
      error.message.includes("placement")
    )) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("PATCH /api/applicants/[id] Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
