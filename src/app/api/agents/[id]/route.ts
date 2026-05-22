// src/app/api/agents/[id]/route.ts
// PATCH /api/agents/[id] - Update sourcing agent profiles and suspension states

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";
import { z } from "zod";

// Zod validation schema for updating an agent
const UpdateAgentSchema = z.object({
  companyName: z.string().min(1, "Company name cannot be empty").optional(),
  licenseNo: z.string().optional().nullable(),
  tier: z.enum(["A", "B", "C"]).optional(),
  phone: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

/**
 * PATCH /api/agents/[id]
 * Update sourcing agent details and change licensing/active status.
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
    const hasManageAgents = permissions.includes("MANAGE_AGENTS");

    if (!isSuperOrOps && !hasManageAgents) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient permissions." },
        { status: 403 }
      );
    }

    // Retrieve existing Agent with User mapping
    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent record not found." }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const validatedData = UpdateAgentSchema.parse(body);

    // Apply updates atomically inside transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Prepare updates for Agent
      const agentUpdateData: any = {};
      if (validatedData.companyName !== undefined) agentUpdateData.companyName = validatedData.companyName.trim();
      if (validatedData.licenseNo !== undefined) agentUpdateData.licenseNo = validatedData.licenseNo;
      if (validatedData.tier !== undefined) agentUpdateData.tier = validatedData.tier;
      if (validatedData.phone !== undefined) agentUpdateData.phone = validatedData.phone;
      if (validatedData.isActive !== undefined) agentUpdateData.isActive = validatedData.isActive;

      const updatedAgent = await tx.agent.update({
        where: { id },
        data: agentUpdateData,
      });

      // 2. Sync changes with linked User account if phone or isActive is updated
      const userUpdateData: any = {};
      if (validatedData.phone !== undefined) userUpdateData.phone = validatedData.phone;
      if (validatedData.isActive !== undefined) userUpdateData.isActive = validatedData.isActive;

      let updatedUser = agent.user;
      if (Object.keys(userUpdateData).length > 0) {
        updatedUser = await tx.user.update({
          where: { id: agent.userId },
          data: userUpdateData,
        });
      }

      return { updatedAgent, updatedUser };
    });

    // 3. Create AuditLog entry documenting update changes
    await prisma.auditLog.create({
      data: {
        userId,
        roleName,
        actionType: "UPDATE_AGENT",
        tableName: "Agent",
        recordId: id,
        delta: {
          previous: {
            companyName: agent.companyName,
            licenseNo: agent.licenseNo,
            tier: agent.tier,
            phone: agent.phone,
            isActive: agent.isActive,
          },
          updated: validatedData,
        } as any,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    // 4. Return updated record payload
    return NextResponse.json({
      success: true,
      agent: {
        id: result.updatedAgent.id,
        agentCode: result.updatedAgent.agentCode,
        companyName: result.updatedAgent.companyName,
        licenseNo: result.updatedAgent.licenseNo || "",
        tier: result.updatedAgent.tier,
        fullName: result.updatedUser.fullName,
        email: result.updatedUser.email,
        phone: result.updatedAgent.phone || "",
        isActive: result.updatedAgent.isActive,
        createdAt: result.updatedAgent.createdAt,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation failed." }, { status: 400 });
    }
    console.error("PATCH /api/agents/[id] Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
