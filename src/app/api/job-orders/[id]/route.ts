// src/app/api/job-orders/[id]/route.ts
// PATCH /api/job-orders/[id] - Modify corporate job order configurations and recruitment quotas

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";
import { z } from "zod";

// Zod validation schema for updating a Job Order
const UpdateJobOrderSchema = z.object({
  employerName: z.string().min(1, "Employer name cannot be empty").optional(),
  country: z.string().min(1, "Country cannot be empty").optional(),
  trade: z.string().min(1, "Trade category cannot be empty").optional(),
  salary: z.number().positive("Salary must be a positive number").optional(),
  totalQuota: z.number().int().positive("Quota must be a positive integer").optional(),
  commissionAmount: z.number().nonnegative("Commission amount must be a non-negative number").optional(),
  status: z.enum(["OPEN", "CLOSED", "COMPLETED"]).optional(),
});

/**
 * PATCH /api/job-orders/[id]
 * Modify corporate demand details and quota limits.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { userId, roleName } = decoded;

    // RBAC validation
    const permissions = await getUserPermissions(userId);
    const isSuperOrOps = roleName === "Super Admin" || roleName === "Operations Admin";
    const hasManage = permissions.includes("MANAGE_JOB_ORDERS" as any);

    if (!isSuperOrOps && !hasManage) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient administrative privileges to update job demands." },
        { status: 403 }
      );
    }

    // Retrieve existing Job Order
    const jobOrder = await prisma.jobOrder.findUnique({
      where: { id },
    });

    if (!jobOrder) {
      return NextResponse.json({ error: "Job order contract not found." }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const validatedData = UpdateJobOrderSchema.parse(body);

    // Business Constraint: Do not allow totalQuota to fall below currently allocatedQuota
    if (validatedData.totalQuota !== undefined && validatedData.totalQuota < jobOrder.allocatedQuota) {
      return NextResponse.json(
        {
          error: `Cannot reduce total quota capacity (${validatedData.totalQuota}) below the currently allocated quota slots (${jobOrder.allocatedQuota}).`,
        },
        { status: 400 }
      );
    }

    // Apply updates
    const updated = await prisma.jobOrder.update({
      where: { id },
      data: {
        employerName: validatedData.employerName?.trim(),
        country: validatedData.country?.trim(),
        trade: validatedData.trade?.trim(),
        salary: validatedData.salary,
        totalQuota: validatedData.totalQuota,
        commissionAmount: validatedData.commissionAmount,
        status: validatedData.status,
      },
    });

    // Create AuditLog entry
    await prisma.auditLog.create({
      data: {
        userId,
        roleName,
        actionType: "UPDATE_JOB_ORDER",
        tableName: "JobOrder",
        recordId: id,
        delta: {
          previous: {
            employerName: jobOrder.employerName,
            country: jobOrder.country,
            trade: jobOrder.trade,
            salary: Number(jobOrder.salary),
            totalQuota: jobOrder.totalQuota,
            commissionAmount: Number(jobOrder.commissionAmount),
            status: jobOrder.status,
          },
          updated: {
            employerName: updated.employerName,
            country: updated.country,
            trade: updated.trade,
            salary: Number(updated.salary),
            totalQuota: updated.totalQuota,
            commissionAmount: Number(updated.commissionAmount),
            status: updated.status,
          },
        } as any,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    const remainingQuota = updated.totalQuota - updated.allocatedQuota;
    const utilizationPercent = updated.totalQuota > 0 ? (updated.allocatedQuota / updated.totalQuota) * 100 : 0;

    return NextResponse.json({
      success: true,
      jobOrder: {
        ...updated,
        salary: Number(updated.salary),
        commissionAmount: Number(updated.commissionAmount),
        remainingQuota: remainingQuota < 0 ? 0 : remainingQuota,
        utilizationPercent: Math.round(utilizationPercent * 100) / 100,
      },
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation failed." }, { status: 400 });
    }
    console.error("PATCH /api/job-orders/[id] Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
