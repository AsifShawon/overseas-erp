// src/app/api/job-orders/route.ts
// GET /api/job-orders - Retrieve live corporate job orders, query aggregates, and metrics
// POST /api/job-orders - Provision a new corporate job demand contract and sequential order reference number

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";
import { z } from "zod";

// Zod validation schema for creating a new Job Order
const CreateJobOrderSchema = z.object({
  employerName: z.string().min(1, "Employer name is required"),
  country: z.string().min(1, "Country is required"),
  trade: z.string().min(1, "Trade role is required"),
  salary: z.number().positive("Salary must be a positive number"),
  currency: z.string().optional().nullable(), // accepted to preserve contract API signature but documented as schema gap
  totalQuota: z.number().int().positive("Total quota capacity must be a positive integer"),
  commissionAmount: z.number().nonnegative("Commission amount per candidate must be a non-negative number"),
  orderNumber: z.string().optional().nullable(),
  status: z.enum(["OPEN", "CLOSED", "COMPLETED"]).optional().default("OPEN"),
});

// Helper to resolve ISO-like Country Codes
function getCountryCode(country: string): string {
  const c = country.trim().toLowerCase();
  if (c.includes("saudi") || c.includes("ksa")) return "KSA";
  if (c.includes("emirates") || c.includes("uae") || c.includes("dubai")) return "UAE";
  if (c.includes("malaysia") || c.includes("mys")) return "MYS";
  if (c.includes("qatar") || c.includes("qat")) return "QAT";
  if (c.includes("oman") || c.includes("omn")) return "OMN";
  if (c.includes("singapore") || c.includes("sgp")) return "SGP";
  if (c.includes("kuwait") || c.includes("kwt")) return "KWT";
  if (c.includes("bahrain") || c.includes("bhr")) return "BHR";
  return country.replace(/[^a-zA-Z]/g, "").substring(0, 3).toUpperCase() || "JO";
}

// Sequential Job Order Number Generator (e.g. JO-KSA-2026-042)
async function generateJobOrderNumber(country: string, activeCompanyId: string, tx: any): Promise<string> {
  const db = tx || prisma;
  const countryCode = getCountryCode(country);
  const currentYear = new Date().getFullYear();
  const prefix = `JO-${countryCode}-${currentYear}-`;

  const orders = await db.jobOrder.findMany({
    where: {
      companyId: activeCompanyId,
      orderNumber: {
        startsWith: prefix,
      },
    },
    select: {
      orderNumber: true,
    },
  });

  let nextSequence = 1;

  if (orders && orders.length > 0) {
    const sequences = orders.map((o: { orderNumber: string }) => {
      const parts = o.orderNumber.split("-");
      // Format: ["JO", "COUNTRYCODE", "YYYY", "XXX"]
      if (parts.length === 4) {
        const lastPart = parts[3];
        const parsed = parseInt(lastPart, 10);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    });
    const maxSeq = Math.max(0, ...sequences);
    nextSequence = maxSeq + 1;
  }

  const paddedSeq = String(nextSequence).padStart(3, "0");
  return `${prefix}${paddedSeq}`;
}

/**
 * GET /api/job-orders
 * List live Job Orders and return dashboard Vacancy Statistics.
 */
export async function GET(request: Request) {
  try {
    const { activeCompanyId, userId, roleName, permissions } = await getCompanyContextOrThrow(request);

    // Boundary Check: Placed candidates (Applicants) strictly forbidden
    if (roleName === "Applicant") {
      return NextResponse.json(
        { error: "Forbidden. Applicant role does not possess permissions to view demands." },
        { status: 403 }
      );
    }

    const isSuperOrOps = roleName === "Super Admin" || roleName === "Operations Admin";
    const hasViewAccess =
      isSuperOrOps ||
      roleName === "HR Officer" ||
      roleName === "Accounts Officer" ||
      permissions.includes("VIEW_APPLICANTS") ||
      permissions.includes("MANAGE_JOB_ORDERS");

    let enforcedOpenOnly = false;

    // Boundary Check: Sourcing Agents can only see active OPEN vacancies
    if (roleName === "Agent") {
      enforcedOpenOnly = true;
    } else if (!hasViewAccess) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient permissions to view demand contracts." },
        { status: 403 }
      );
    }

    // Parse filters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const country = searchParams.get("country") || "";
    const trade = searchParams.get("trade") || "";

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "100")); // large default for dashboard lists
    const skip = (page - 1) * pageSize;

    const where: any = {
      companyId: activeCompanyId, // FORCE TENANT ISOLATION
    };

    if (enforcedOpenOnly) {
      where.status = "OPEN";
    } else if (status && status !== "ALL") {
      where.status = status;
    }

    if (country) {
      where.country = { equals: country, mode: "insensitive" };
    }

    if (trade && trade !== "ALL") {
      where.trade = { equals: trade, mode: "insensitive" };
    }

    if (search) {
      where.OR = [
        { employerName: { contains: search, mode: "insensitive" } },
        { orderNumber: { contains: search, mode: "insensitive" } },
        { country: { contains: search, mode: "insensitive" } },
        { trade: { contains: search, mode: "insensitive" } },
      ];
    }

    // Query database for paginated list and system aggregates
    const [total, jobOrders, statsData] = await Promise.all([
      prisma.jobOrder.count({ where }),
      prisma.jobOrder.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: pageSize,
      }),
      prisma.$transaction(async (tx) => {
        const aggregates = await tx.jobOrder.aggregate({
          where: { companyId: activeCompanyId },
          _sum: {
            totalQuota: true,
            allocatedQuota: true,
          },
        });
        const openOrders = await tx.jobOrder.count({ where: { companyId: activeCompanyId, status: "OPEN" } });
        const closedOrders = await tx.jobOrder.count({ where: { companyId: activeCompanyId, status: "CLOSED" } });
        const completedOrders = await tx.jobOrder.count({ where: { companyId: activeCompanyId, status: "COMPLETED" } });
        return {
          totalQuota: aggregates._sum.totalQuota || 0,
          allocatedQuota: aggregates._sum.allocatedQuota || 0,
          openOrders,
          closedOrders,
          completedOrders,
        };
      }),
    ]);

    // Map computed fields
    const mappedOrders = jobOrders.map((jo) => {
      const remainingQuota = jo.totalQuota - jo.allocatedQuota;
      const utilizationPercent = jo.totalQuota > 0 ? (jo.allocatedQuota / jo.totalQuota) * 100 : 0;
      return {
        id: jo.id,
        orderNumber: jo.orderNumber,
        employerName: jo.employerName,
        country: jo.country,
        trade: jo.trade,
        salary: Number(jo.salary),
        totalQuota: jo.totalQuota,
        allocatedQuota: jo.allocatedQuota,
        remainingQuota: remainingQuota < 0 ? 0 : remainingQuota,
        utilizationPercent: Math.round(utilizationPercent * 100) / 100,
        commissionAmount: Number(jo.commissionAmount),
        status: jo.status,
        createdAt: jo.createdAt,
        updatedAt: jo.updatedAt,
      };
    });

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data: mappedOrders,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
      stats: {
        totalQuota: statsData.totalQuota,
        allocatedQuota: statsData.allocatedQuota,
        remainingQuota: Math.max(0, statsData.totalQuota - statsData.allocatedQuota),
        openOrders: statsData.openOrders,
        closedOrders: statsData.closedOrders,
        completedOrders: statsData.completedOrders,
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }
    console.error("GET /api/job-orders Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

/**
 * POST /api/job-orders
 * Create a live Corporate Demand Order and log audit trail.
 */
export async function POST(request: Request) {
  try {
    const { activeCompanyId, userId, roleName, permissions } = await getCompanyContextOrThrow(request);

    // RBAC permission check
    const isSuperOrOps = roleName === "Super Admin" || roleName === "Operations Admin";
    const hasManage = permissions.includes("MANAGE_JOB_ORDERS");

    if (!isSuperOrOps && !hasManage) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient administrative permissions to register job demands." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validatedData = CreateJobOrderSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // Resolve sequential order number
      let finalOrderNumber = validatedData.orderNumber?.trim();
      if (!finalOrderNumber) {
        finalOrderNumber = await generateJobOrderNumber(validatedData.country, activeCompanyId, tx);
      } else {
        const conflict = await tx.jobOrder.findUnique({
          where: { orderNumber: finalOrderNumber },
        });
        if (conflict) {
          throw new Error(`A corporate job demand with reference number "${finalOrderNumber}" already exists.`);
        }
      }

      // Create JobOrder record
      const jobOrder = await tx.jobOrder.create({
        data: {
          orderNumber: finalOrderNumber,
          employerName: validatedData.employerName.trim(),
          country: validatedData.country.trim(),
          trade: validatedData.trade.trim(),
          salary: validatedData.salary,
          totalQuota: validatedData.totalQuota,
          allocatedQuota: 0, // Set explicitly to 0 on initialization
          commissionAmount: validatedData.commissionAmount,
          status: validatedData.status || "OPEN",
          companyId: activeCompanyId, // SET TENANT ID
        },
      });

      // Dispatch notifications to related internal staff
      const staff = await tx.user.findMany({
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
        select: { id: true },
      });

      if (staff.length > 0) {
        await tx.notification.createMany({
          data: staff.map((s) => ({
            userId: s.id,
            title: "New Job Demand Sourced",
            message: `Vacancies for ${jobOrder.trade} (${jobOrder.totalQuota} slots) at ${jobOrder.employerName} have been registered under ref: ${jobOrder.orderNumber}.`,
            isRead: false,
            companyId: activeCompanyId,
          })),
        });
      }

      return jobOrder;
    });

    // Create AuditLog entry
    await prisma.auditLog.create({
      data: {
        userId,
        roleName,
        actionType: "CREATE_JOB_ORDER",
        tableName: "JobOrder",
        recordId: result.id,
        delta: {
          id: result.id,
          orderNumber: result.orderNumber,
          employerName: result.employerName,
          country: result.country,
          trade: result.trade,
          salary: Number(result.salary),
          totalQuota: result.totalQuota,
          allocatedQuota: result.allocatedQuota,
          commissionAmount: Number(result.commissionAmount),
          status: result.status,
        } as any,
        companyId: activeCompanyId,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json({
      success: true,
      jobOrder: {
        ...result,
        salary: Number(result.salary),
        commissionAmount: Number(result.commissionAmount),
        remainingQuota: result.totalQuota,
        utilizationPercent: 0,
      },
    }, { status: 201 });

  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation failed." }, { status: 400 });
    }
    // Handle thrown uniqueness conflicts cleanly
    if (error.message && error.message.includes("exists")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("POST /api/job-orders Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
