// src/app/api/finance/receipts/route.ts
// GET /api/finance/receipts - Retrieve paginated and filtered candidate payments with joined applicant bio and parent invoice details.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";
import { getUserBranchScope, buildBranchWhere } from "@/lib/branch-scope";

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

    // Boundary Check: Explicitly block Agent and Applicant user roles
    if (roleName === "Agent" || roleName === "Applicant") {
      return NextResponse.json(
        { error: "Forbidden. Sourced cohorts and candidates cannot access corporate payment records." },
        { status: 403 }
      );
    }

    // RBAC: Check permissions
    const isAuthorized =
      roleName === "Super Admin" ||
      roleName === "Operations Admin" ||
      roleName === "Accounts Officer" ||
      permissions.includes("VIEW_ACCOUNTS") ||
      permissions.includes("MANAGE_ACCOUNTS");

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient administrative permissions to view payment records." },
        { status: 403 }
      );
    }

    // Parse query params
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "50", 10);

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Build filters dynamically
    const whereClause: any = buildBranchWhere(activeCompanyId, branchScope);

    if (search) {
      const matchingApplicants = await prisma.applicant.findMany({
        where: buildBranchWhere(activeCompanyId, branchScope, {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { passportNumber: { contains: search, mode: "insensitive" } },
          ],
        }),
        select: { id: true },
      });
      const applicantIds = matchingApplicants.map((a) => a.id);

      const matchingInvoices = await prisma.invoice.findMany({
        where: buildBranchWhere(activeCompanyId, branchScope, {
          invoiceNo: { contains: search, mode: "insensitive" },
        }),
        select: { id: true },
      });
      const invoiceIds = matchingInvoices.map((i) => i.id);

      whereClause.OR = [
        { applicantId: { in: applicantIds } },
        { invoiceId: { in: invoiceIds } },
        { receiptNo: { contains: search, mode: "insensitive" } },
        { referenceNo: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch receipts
    const receipts = await prisma.receipt.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        applicant: {
          select: {
            fullName: true,
            passportNumber: true,
            phone: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNo: true,
            amount: true,
            outstanding: true,
            description: true,
            createdAt: true,
          },
        },
      },
    });

    const totalCount = await prisma.receipt.count({
      where: whereClause,
    });

    // Bulk resolve matching User names for receivedById
    const receivedByIds = receipts.map((r) => r.receivedById);
    const users = await prisma.user.findMany({
      where: { id: { in: receivedByIds } },
      select: { id: true, fullName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.fullName]));

    // Map database models to representation expected by UI and printable vouchers
    const data = receipts.map((rec) => {
      return {
        id: rec.id,
        receiptNo: rec.receiptNo,
        applicantId: rec.applicantId,
        applicantName: rec.applicant?.fullName || "Unknown Candidate",
        passportNumber: rec.applicant?.passportNumber || "N/A",
        applicantPhone: rec.applicant?.phone || "N/A",
        invoiceId: rec.invoiceId,
        linkedInvoiceNo: rec.invoice?.invoiceNo || "N/A",
        invoiceDescription: rec.invoice?.description || "Direct Account Deposit",
        amountPaid: Number(rec.amountPaid),
        paymentMethod: rec.paymentMethod,
        referenceNo: rec.referenceNo || "Cash Counter Desk",
        receivedBy: userMap.get(rec.receivedById) || "Accounts Officer",
        createdAt: rec.createdAt.toISOString().split("T")[0],
        invoice: rec.invoice
          ? {
              id: rec.invoice.id,
              invoiceNo: rec.invoice.invoiceNo,
              amount: Number(rec.invoice.amount),
              outstanding: Number(rec.invoice.outstanding),
              description: rec.invoice.description,
              createdAt: rec.invoice.createdAt.toISOString().split("T")[0],
            }
          : undefined,
      };
    });

    return NextResponse.json({
      data,
      pagination: {
        total: totalCount,
        page,
        pageSize,
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }
    console.error("GET /api/finance/receipts Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred while retrieving payment logs." },
      { status: 500 }
    );
  }
}
