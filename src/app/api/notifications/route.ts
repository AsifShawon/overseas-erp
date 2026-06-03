import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";

export async function GET(request: Request) {
  try {
    // 1. Authenticate Request and resolve company context
    const { activeCompanyId, userId } = await getCompanyContextOrThrow(request);

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10));

    // 3. Build query filters
    const where: any = {
      userId,
      companyId: activeCompanyId, // FORCE TENANT ISOLATION
    };
    if (unreadOnly) {
      where.isRead = false;
    }

    const skip = (page - 1) * pageSize;

    // 4. Query counts and paginated notification list
    const [total, data, unread] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.notification.count({
        where: { userId, companyId: activeCompanyId, isRead: false },
      }),
    ]);

    // 5. Return JSON payload matching requested shape
    return NextResponse.json({
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      stats: {
        total,
        unread,
        channelStatus: "Healthy",
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }
    console.error("GET /api/notifications Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate Request and resolve company context
    const { activeCompanyId, userId } = await getCompanyContextOrThrow(request);

    // 2. Dev-only simulation guard
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Simulation alerts are locked in production environments." },
        { status: 403 }
      );
    }

    // 3. Create simulated notification row in the database
    const newNot = await prisma.notification.create({
      data: {
        userId,
        title: "Consulate Clearance Completed",
        message: `System audited candidate passport dossier. Emigration certificate issued successfully at ${new Date().toLocaleTimeString()}.`,
        isRead: false,
        companyId: activeCompanyId, // SET TENANT ID
      },
    });

    return NextResponse.json(newNot);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }
    console.error("POST /api/notifications Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
