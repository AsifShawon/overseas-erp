// src/app/api/accounts/ledger/route.ts
// GET /api/accounts/ledger - Retrieve flattened double-entry ledger statement entries with candidate biodata, search, pagination, and transactional summaries.

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

    // Boundary Check: Explicitly block Agent and Applicant user roles from corporate financial records
    if (roleName === "Agent" || roleName === "Applicant") {
      return NextResponse.json(
        { error: "Forbidden. Sourced cohorts and candidates cannot access general ledger logs." },
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
        { error: "Forbidden. Insufficient administrative credentials to view accounts ledger." },
        { status: 403 }
      );
    }

    // Parse query params
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const transactionType = url.searchParams.get("transactionType") || "";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "50", 10);

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Build filters dynamically
    const whereClause: any = buildBranchWhere(activeCompanyId, branchScope);

    if (search) {
      // 1. Find applicant IDs where fullName or passportNumber matches search (case insensitive) within active company
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

      // 2. Find matching Invoices by invoiceNo within active company
      const matchingInvoices = await prisma.invoice.findMany({
        where: buildBranchWhere(activeCompanyId, branchScope, {
          invoiceNo: { contains: search, mode: "insensitive" },
        }),
        select: { id: true },
      });
      const invoiceIds = matchingInvoices.map((i) => i.id);

      // 3. Find matching Receipts by receiptNo within active company
      const matchingReceipts = await prisma.receipt.findMany({
        where: buildBranchWhere(activeCompanyId, branchScope, {
          receiptNo: { contains: search, mode: "insensitive" },
        }),
        select: { id: true },
      });
      const receiptIds = matchingReceipts.map((r) => r.id);

      const referenceIds = [...invoiceIds, ...receiptIds];

      whereClause.OR = [
        { applicantId: { in: applicantIds } },
        { referenceId: { in: referenceIds } },
      ];
    }

    if (transactionType && transactionType !== "ALL") {
      whereClause.transactionType = transactionType;
    }

    // Calculate dynamic stats scoped to activeCompanyId and active branch
    const billedAgg = await prisma.invoice.aggregate({
      where: buildBranchWhere(activeCompanyId, branchScope),
      _sum: { amount: true },
    });
    const totalBilled = Number(billedAgg._sum.amount || 0);

    const collectedAgg = await prisma.receipt.aggregate({
      where: buildBranchWhere(activeCompanyId, branchScope),
      _sum: { amountPaid: true },
    });
    const totalCollected = Number(collectedAgg._sum.amountPaid || 0);

    const outstandingAgg = await prisma.invoice.aggregate({
      where: buildBranchWhere(activeCompanyId, branchScope),
      _sum: { outstanding: true },
    });
    const totalOutstanding = Number(outstandingAgg._sum.outstanding || 0);

    const commissionAgg = await prisma.commission.aggregate({
      where: buildBranchWhere(activeCompanyId, branchScope, { status: "ACCRUED" }),
      _sum: { amount: true },
    });
    const totalCommissionsAccrued = Number(commissionAgg._sum.amount || 0);

    // Fetch entries
    const ledgerEntries = await prisma.ledgerEntry.findMany({
      where: whereClause,
      orderBy: { timestamp: "desc" },
      skip,
      take,
      include: {
        applicant: {
          select: {
            fullName: true,
            passportNumber: true,
          },
        },
      },
    });

    const totalLedgerEntries = await prisma.ledgerEntry.count({
      where: whereClause,
    });

    // Bulk resolve matching invoices/receipts for referenceId to supply invoiceNo/receiptNo and description
    const referenceIdsInPage = ledgerEntries.map((e) => e.referenceId);

    const invoices = await prisma.invoice.findMany({
      where: { id: { in: referenceIdsInPage }, companyId: activeCompanyId },
    });

    const receipts = await prisma.receipt.findMany({
      where: { id: { in: referenceIdsInPage }, companyId: activeCompanyId },
      include: {
        invoice: {
          select: {
            description: true,
          },
        },
      },
    });

    const invoiceMap = new Map(invoices.map((i) => [i.id, i]));
    const receiptMap = new Map(receipts.map((r) => [r.id, r]));

    const data = ledgerEntries.map((entry) => {
      let referenceNo = "N/A";
      let description = "";

      if (entry.transactionType === "INVOICE") {
        const inv = invoiceMap.get(entry.referenceId);
        if (inv) {
          referenceNo = inv.invoiceNo;
          description = inv.description;
        }
      } else if (entry.transactionType === "RECEIPT") {
        const rec = receiptMap.get(entry.referenceId);
        if (rec) {
          referenceNo = rec.receiptNo;
          description = rec.invoice?.description || "Direct Account Deposit";
        }
      }

      return {
        id: entry.id,
        applicantId: entry.applicantId,
        applicantName: entry.applicant?.fullName || "Unknown Candidate",
        passportNumber: entry.applicant?.passportNumber || "N/A",
        transactionType: entry.transactionType,
        referenceNo,
        description,
        debit: Number(entry.debit),
        credit: Number(entry.credit),
        runningBalance: Number(entry.runningBalance),
        timestamp: entry.timestamp.toISOString(),
      };
    });

    return NextResponse.json({
      data,
      stats: {
        totalBilled,
        totalCollected,
        totalOutstanding,
        totalCommissionsAccrued,
        totalLedgerEntries,
      },
      pagination: {
        total: totalLedgerEntries,
        page,
        pageSize,
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }
    console.error("GET /api/accounts/ledger Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred while retrieving forensic ledger logs." },
      { status: 500 }
    );
  }
}
