import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";
import { getUserBranchScope, buildBranchWhere, validateWriteBranch } from "@/lib/branch-scope";
import { z } from "zod";

// Zod validation schema for creating a new candidate
const CreateApplicantSchema = z.object({
  passportNumber: z.string().min(1, "Passport number is required"),
  passportExpiry: z.string().transform((val) => new Date(val)),
  nationality: z.string().optional().default("Bangladesh"),
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z
    .string()
    .email("Invalid email address")
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v))
    .optional()
    .nullable(),
  dateOfBirth: z.string().transform((val) => new Date(val)),
  nidNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  trade: z.string().min(1, "Trade category is required"),
  agentId: z.string().optional().nullable(),
  jobOrderId: z.string().optional().nullable(),
  branchId: z.string().optional().nullable(),
});

/**
 * GET /api/applicants
 * List applicants with pagination and dynamic filtering.
 * Enforces boundaries for Super Admin, Operations, Staff (HR, Docs, Visa, Accounts), Agents, and Applicants.
 */
export async function GET(request: Request) {
  try {
    const { activeCompanyId, userId, roleName, permissions } = await getCompanyContextOrThrow(request);
    const branchScope = await getUserBranchScope(request);
    if (!branchScope) {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }

    if (branchScope.branchIds.includes("INACCESSIBLE_BRANCH")) {
      return NextResponse.json({ error: "Forbidden. Inaccessible branch scope." }, { status: 403 });
    }

    // Boundary Check: Applicants are forbidden from accessing the entire directory list
    if (roleName === "Applicant") {
      return NextResponse.json(
        { error: "Forbidden. Applicant directory access is restricted." },
        { status: 403 }
      );
    }

    // Boundary Check: Agents are strictly scoped to their own applicants within active company
    let enforcedAgentId: string | undefined = undefined;
    if (roleName === "Agent") {
      const agent = await prisma.agent.findFirst({
        where: { userId, companyId: activeCompanyId },
      });
      if (!agent) {
        // Return empty dataset gracefully if Agent profile doesn't exist
        return NextResponse.json({
          data: [],
          meta: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
        });
      }
      enforcedAgentId = agent.id;
    } else {
      // Staff roles check: Must hold VIEW_APPLICANTS permission if not Super/Ops Admin
      const isSuperOrOps = roleName === "Super Admin" || roleName === "Operations Admin";
      if (!isSuperOrOps && !permissions.includes("VIEW_APPLICANTS")) {
        return NextResponse.json(
          { error: "Forbidden. Insufficient permissions." },
          { status: 403 }
        );
      }
    }

    // Parse filters and parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const stage = searchParams.get("stage") || "";
    const trade = searchParams.get("trade") || "";
    const country = searchParams.get("country") || "";
    const agentId = searchParams.get("agentId") || "";
    const archivedStr = searchParams.get("archived") || "false";
    const archived = archivedStr === "true";

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "10"));
    const skip = (page - 1) * pageSize;

    // Build the query where clause
    const where: any = buildBranchWhere(activeCompanyId, branchScope, {
      isArchived: archived,
    });

    // Cohort boundary enforcement
    if (enforcedAgentId) {
      where.agentId = enforcedAgentId;
    } else if (agentId) {
      where.agentId = agentId;
    }

    if (stage && stage !== "ALL") {
      where.currentStage = stage;
    }

    if (trade && trade !== "ALL") {
      where.trade = trade;
    }

    if (country) {
      where.jobOrder = {
        country: {
          equals: country,
          mode: "insensitive",
        },
      };
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { passportNumber: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    // Query database with prisma
    const [total, applicants] = await Promise.all([
      prisma.applicant.count({ where }),
      prisma.applicant.findMany({
        where,
        include: {
          agent: {
            select: {
              id: true,
              agentCode: true,
              companyName: true,
            },
          },
          jobOrder: {
            select: {
              id: true,
              orderNumber: true,
              employerName: true,
              country: true,
              trade: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data: applicants,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }
    console.error("GET /api/applicants Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

/**
 * POST /api/applicants
 * Register a new candidate.
 * Enforces RBAC permissions and dynamic audit logging.
 */
export async function POST(request: Request) {
  try {
    const { activeCompanyId, userId, roleName, permissions } = await getCompanyContextOrThrow(request);
    const branchScope = await getUserBranchScope(request);
    if (!branchScope) {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }

    // Check RBAC permission for creation
    const isSuperOrOps = roleName === "Super Admin" || roleName === "Operations Admin";
    if (!isSuperOrOps && !permissions.includes("CREATE_APPLICANT")) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient permissions." },
        { status: 403 }
      );
    }

    // Resolve Agent if user is an Agent
    let enforcedAgentId: string | null = null;
    if (roleName === "Agent") {
      const agent = await prisma.agent.findFirst({
        where: { userId, companyId: activeCompanyId },
      });
      if (!agent) {
        return NextResponse.json({ error: "Agent profile not found for user in this company." }, { status: 400 });
      }
      enforcedAgentId = agent.id;
    }

    const body = await request.json();
    const validatedData = CreateApplicantSchema.parse(body);

    // Enforce Agent ID boundary if agent
    if (enforcedAgentId) {
      validatedData.agentId = enforcedAgentId;
    }

    // Resolve and Validate branchId
    let targetBranchId = validatedData.branchId;
    if (targetBranchId) {
      await validateWriteBranch(targetBranchId, activeCompanyId, branchScope);
    } else {
      if (branchScope.isAllBranches) {
        const hoBranch = await prisma.branch.findFirst({
          where: { companyId: activeCompanyId, isHeadOffice: true, status: "ACTIVE" },
        });
        if (!hoBranch) {
          return NextResponse.json({ error: "Head Office branch not found. Please specify a branchId." }, { status: 400 });
        }
        targetBranchId = hoBranch.id;
      } else if (branchScope.branchIds.length === 1) {
        targetBranchId = branchScope.branchIds[0];
      } else {
        return NextResponse.json({ error: "Multiple branches assigned. branchId is required in payload." }, { status: 400 });
      }
    }

    // Check passport uniqueness
    const existingApplicant = await prisma.applicant.findUnique({
      where: { passportNumber: validatedData.passportNumber.trim() },
    });

    if (existingApplicant) {
      return NextResponse.json(
        { error: "An applicant with this passport number already exists." },
        { status: 400 }
      );
    }

    // Verify jobOrderId belongs to activeCompanyId and accessible branch
    if (validatedData.jobOrderId) {
      const jobOrder = await prisma.jobOrder.findFirst({
        where: { id: validatedData.jobOrderId, companyId: activeCompanyId },
      });
      if (!jobOrder) {
        return NextResponse.json({ error: "The specified Job Order does not exist in this company." }, { status: 400 });
      }
      if (jobOrder.branchId && jobOrder.branchId !== targetBranchId) {
        const isJobBranchAccessible = branchScope.isAllBranches || branchScope.branchIds.includes(jobOrder.branchId);
        if (!isJobBranchAccessible) {
          return NextResponse.json({ error: "The selected Job Order belongs to a branch that is not accessible to you." }, { status: 403 });
        }
      }
    }

    // Verify agentId belongs to activeCompanyId and accessible branch
    if (validatedData.agentId) {
      const agent = await prisma.agent.findFirst({
        where: { id: validatedData.agentId, companyId: activeCompanyId },
      });
      if (!agent) {
        return NextResponse.json({ error: "The specified Agent does not exist in this company." }, { status: 400 });
      }
      if (agent.branchId && agent.branchId !== targetBranchId) {
        const isAgentBranchAccessible = branchScope.isAllBranches || branchScope.branchIds.includes(agent.branchId);
        if (!isAgentBranchAccessible) {
          return NextResponse.json({ error: "The selected Agent belongs to a branch that is not accessible to you." }, { status: 403 });
        }
      }
    }

    // Create candidate inside transaction to handle atomic quota validation & increment
    const applicant = await prisma.$transaction(async (tx) => {
      if (validatedData.jobOrderId) {
        const jobOrder = await tx.jobOrder.findFirst({
          where: { id: validatedData.jobOrderId, companyId: activeCompanyId },
        });

        if (!jobOrder) {
          throw new Error("The specified Job Order placement does not exist.");
        }

        if (jobOrder.status !== "OPEN") {
          throw new Error("The selected Job Order is currently not open for recruitment placements.");
        }

        if (jobOrder.allocatedQuota >= jobOrder.totalQuota) {
          throw new Error(`The placement quota limit for this Job Order (${jobOrder.totalQuota}) has been fully filled.`);
        }

        await tx.jobOrder.update({
          where: { id: jobOrder.id },
          data: {
            allocatedQuota: {
              increment: 1,
            },
          },
        });
      }

      return await tx.applicant.create({
        data: {
          ...validatedData,
          passportNumber: validatedData.passportNumber.trim(),
          companyId: activeCompanyId, // ASSIGN TENANT
          branchId: targetBranchId,   // ASSIGN BRANCH
        },
      });
    });

    // Notify staff users (Super Admin, Operations Admin, HR Officer)
    try {
      const staffUsers = await prisma.user.findMany({
        where: {
          memberships: {
            some: {
              companyId: activeCompanyId,
              role: {
                name: {
                  in: ["Super Admin", "Operations Admin", "HR Officer"],
                },
              },
            },
          },
        },
        select: {
          id: true,
        },
      });

      if (staffUsers.length > 0) {
        await prisma.notification.createMany({
          data: staffUsers.map((u) => ({
            userId: u.id,
            title: "New Candidate Registered",
            message: `${applicant.fullName} (${applicant.trade}) has been registered by ${roleName}.`,
            isRead: false,
            companyId: activeCompanyId,
          })),
        });
      }
    } catch (notifErr) {
      console.error("Error creating registration notifications:", notifErr);
    }

    // Create Audit Log entry
    await prisma.auditLog.create({
      data: {
        userId,
        roleName,
        actionType: "CREATE_APPLICANT",
        tableName: "Applicant",
        recordId: applicant.id,
        delta: applicant as any,
        companyId: activeCompanyId,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json(applicant, { status: 201 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message === "FORBIDDEN" ? "Forbidden" : "Unauthorized" }, { status: error.message === "FORBIDDEN" ? 403 : 401 });
    }
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
    console.error("POST /api/applicants Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
