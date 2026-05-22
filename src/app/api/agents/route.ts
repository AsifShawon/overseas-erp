// src/app/api/agents/route.ts
// GET /api/agents - Fetch agents with active filter and security permissions
// POST /api/agents - Register a new sourcing partner and provision their login credentials

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";
import { generateAgentCode } from "@/lib/sequence";
import * as argon2 from "argon2";
import { z } from "zod";
import crypto from "crypto";

// Zod validation schema for creating a new agent
const CreateAgentSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  companyName: z.string().min(1, "Company name is required"),
  licenseNo: z.string().optional().nullable(),
  tier: z.enum(["A", "B", "C"]),
  agentCode: z.string().optional().nullable(),
  accessMode: z.enum(["INVITE_LINK", "TEMP_PASSWORD"]),
});

/**
 * GET /api/agents
 * List sourcing agents. Enforces strict RBAC and boundaries.
 */
export async function GET(request: Request) {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { userId, roleName } = decoded;

    // Boundary Check: Applicants are strictly forbidden
    if (roleName === "Applicant") {
      return NextResponse.json(
        { error: "Forbidden. Applicant access is restricted." },
        { status: 403 }
      );
    }

    const permissions = await getUserPermissions(userId);
    const isSuperOrOps = roleName === "Super Admin" || roleName === "Operations Admin";
    const hasManageAgents = permissions.includes("MANAGE_AGENTS");
    const hasViewCommissions = permissions.includes("VIEW_COMMISSIONS");
    const hasCreateApplicant = permissions.includes("CREATE_APPLICANT");
    const hasViewApplicants = permissions.includes("VIEW_APPLICANTS");

    let enforcedUserId: string | undefined = undefined;

    // Boundary Check: Agent is strictly scoped to their own profile
    if (roleName === "Agent") {
      enforcedUserId = userId;
    } else if (
      !isSuperOrOps &&
      !hasManageAgents &&
      !hasViewCommissions &&
      !hasCreateApplicant &&
      !hasViewApplicants
    ) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient permissions." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }

    if (enforcedUserId) {
      where.userId = enforcedUserId;
    }

    const agents = await prisma.agent.findMany({
      where,
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        companyName: "asc",
      },
    });

    // Map database relational structure to flat objects expected by page.tsx
    const mappedAgents = agents.map((agt) => ({
      id: agt.id,
      agentCode: agt.agentCode,
      companyName: agt.companyName,
      licenseNo: agt.licenseNo || "",
      tier: agt.tier as "A" | "B" | "C",
      fullName: agt.user?.fullName || "",
      email: agt.user?.email || "",
      phone: agt.phone || "",
      isActive: agt.isActive,
      createdAt: agt.createdAt,
    }));

    return NextResponse.json({ data: mappedAgents });
  } catch (error) {
    console.error("GET /api/agents Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

/**
 * POST /api/agents
 * Create a live sourcing agent record and linked system User account.
 */
export async function POST(request: Request) {
  try {
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

    const body = await request.json().catch(() => ({}));
    const validatedData = CreateAgentSchema.parse(body);

    const finalEmail = validatedData.email.trim().toLowerCase();

    // 1. Email uniqueness validation across system Users
    const emailConflict = await prisma.user.findUnique({
      where: { email: finalEmail },
    });
    if (emailConflict) {
      return NextResponse.json(
        { error: "A user account with this email address already exists." },
        { status: 400 }
      );
    }

    // 2. Custom Agent Code uniqueness validation (if provided)
    if (validatedData.agentCode?.trim()) {
      const codeConflict = await prisma.agent.findUnique({
        where: { agentCode: validatedData.agentCode.trim() },
      });
      if (codeConflict) {
        return NextResponse.json(
          { error: "A sourcing partner with this agent code already exists." },
          { status: 400 }
        );
      }
    }

    // 3. Resolve 'Agent' role ID from DB
    const agentRole = await prisma.role.findUnique({
      where: { name: "Agent" },
    });
    if (!agentRole) {
      return NextResponse.json(
        { error: "Internal Configuration Error: 'Agent' role is not defined in the system." },
        { status: 500 }
      );
    }

    let tempPasswordPlain: string | undefined = undefined;
    let passwordHash = "";
    let devActivationLink: string | undefined = undefined;

    if (validatedData.accessMode === "INVITE_LINK") {
      // Create user with a random unusable initial password hash
      const randomUnusablePassword = crypto.randomUUID() + "-" + crypto.randomUUID();
      passwordHash = await argon2.hash(randomUnusablePassword);
      
      const mockToken = crypto.randomBytes(32).toString("hex");
      if (process.env.NODE_ENV !== "production") {
        devActivationLink = `/activate?token=${mockToken}&email=${encodeURIComponent(finalEmail)}`;
      }
    } else {
      // TEMP_PASSWORD mode: generate a strong 12-char random temporary password
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
      let pass = "";
      for (let i = 0; i < 12; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      tempPasswordPlain = pass;
      passwordHash = await argon2.hash(tempPasswordPlain);
    }

    // 4. Atomic transaction to create User & Agent profile
    const result = await prisma.$transaction(async (tx) => {
      // Create User record with role 'Agent'
      const newUser = await tx.user.create({
        data: {
          email: finalEmail,
          passwordHash,
          fullName: validatedData.fullName.trim(),
          phone: validatedData.phone || null,
          roleId: agentRole.id,
          isActive: true,
        },
      });

      // Resolve final unique agent code
      let finalAgentCode = validatedData.agentCode?.trim();
      if (!finalAgentCode) {
        finalAgentCode = await generateAgentCode(tx);
      }

      // Create Agent profile linked to User
      const newAgent = await tx.agent.create({
        data: {
          userId: newUser.id,
          agentCode: finalAgentCode,
          companyName: validatedData.companyName.trim(),
          licenseNo: validatedData.licenseNo || null,
          tier: validatedData.tier,
          phone: validatedData.phone || null,
          isActive: true,
        },
      });

      // Create initial notification in-system for the new User
      await tx.notification.create({
        data: {
          userId: newUser.id,
          title: "Sourcing Portal Access Configured",
          message: `Your sourcing partner profile for ${validatedData.companyName} has been successfully provisioned.`,
          isRead: false,
        },
      });

      return { newUser, newAgent };
    });

    // 5. Create AuditLog entry recording this event (excluding credentials)
    await prisma.auditLog.create({
      data: {
        userId,
        roleName,
        actionType: "CREATE_AGENT",
        tableName: "User/Agent",
        recordId: result.newAgent.id,
        delta: {
          agentId: result.newAgent.id,
          userId: result.newUser.id,
          agentCode: result.newAgent.agentCode,
          companyName: result.newAgent.companyName,
          licenseNo: result.newAgent.licenseNo,
          tier: result.newAgent.tier,
          email: result.newUser.email,
          fullName: result.newUser.fullName,
          phone: result.newUser.phone,
          accessMode: validatedData.accessMode,
        } as any,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    // 6. Return response with credentials (returned only once)
    return NextResponse.json({
      success: true,
      agent: {
        id: result.newAgent.id,
        agentCode: result.newAgent.agentCode,
        companyName: result.newAgent.companyName,
        licenseNo: result.newAgent.licenseNo || "",
        tier: result.newAgent.tier,
        fullName: result.newUser.fullName,
        email: result.newUser.email,
        phone: result.newAgent.phone || "",
        isActive: result.newAgent.isActive,
        createdAt: result.newAgent.createdAt,
      },
      username: finalEmail,
      tempPassword: tempPasswordPlain, // Returned ONLY once in this response
      devActivationLink, // Returned only in development mode
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation failed." }, { status: 400 });
    }
    console.error("POST /api/agents Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
