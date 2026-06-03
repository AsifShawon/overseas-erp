import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";
import { buildCsv, csvResponse } from "@/lib/csv";

export async function GET(request: Request) {
  try {
    const { activeCompanyId, userId, roleName, permissions } = await getCompanyContextOrThrow(request);

    // Block Agent and Applicant roles
    if (roleName === "Agent" || roleName === "Applicant") {
      return NextResponse.json(
        { error: "Forbidden. Corporate financial ledger access restricted." },
        { status: 403 }
      );
    }

    // RBAC: Check accounts permissions
    const isAuthorized =
      roleName === "Super Admin" ||
      roleName === "Operations Admin" ||
      roleName === "Accounts Officer" ||
      permissions.includes("VIEW_ACCOUNTS" as any) ||
      permissions.includes("MANAGE_ACCOUNTS" as any);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient accounts credentials." },
        { status: 403 }
      );
    }

    // Parse filters
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const transactionType = url.searchParams.get("transactionType") || "";

    const whereClause: any = {
      companyId: activeCompanyId,
    };

    if (search) {
      const matchingApplicants = await prisma.applicant.findMany({
        where: {
          companyId: activeCompanyId,
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { passportNumber: { contains: search, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      });
      const applicantIds = matchingApplicants.map((a) => a.id);

      const matchingInvoices = await prisma.invoice.findMany({
        where: {
          companyId: activeCompanyId,
          invoiceNo: { contains: search, mode: "insensitive" },
        },
        select: { id: true },
      });
      const invoiceIds = matchingInvoices.map((i) => i.id);

      const matchingReceipts = await prisma.receipt.findMany({
        where: {
          companyId: activeCompanyId,
          receiptNo: { contains: search, mode: "insensitive" },
        },
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

    // Fetch entries (no pagination limits for exports)
    const ledgerEntries = await prisma.ledgerEntry.findMany({
      where: whereClause,
      orderBy: { timestamp: "desc" },
      include: {
        applicant: {
          select: {
            fullName: true,
            passportNumber: true,
          },
        },
      },
    });

    // Bulk resolve matching invoices/receipts for referenceId to supply invoiceNo/receiptNo and description
    const referenceIds = ledgerEntries.map((e) => e.referenceId);

    const invoices = await prisma.invoice.findMany({
      where: { id: { in: referenceIds }, companyId: activeCompanyId },
    });

    const receipts = await prisma.receipt.findMany({
      where: { id: { in: referenceIds }, companyId: activeCompanyId },
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

    const headers = [
      "Timestamp",
      "Applicant Name",
      "Passport Number",
      "Transaction Type",
      "Reference No",
      "Description",
      "Debit",
      "Credit",
      "Running Balance",
    ];

    const rows = ledgerEntries.map((entry) => {
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

      return [
        entry.timestamp.toISOString(),
        entry.applicant?.fullName || "Unknown Candidate",
        entry.applicant?.passportNumber || "N/A",
        entry.transactionType,
        referenceNo,
        description,
        Number(entry.debit).toFixed(2),
        Number(entry.credit).toFixed(2),
        Number(entry.runningBalance).toFixed(2),
      ];
    });

    const csvText = buildCsv(headers, rows);
    return csvResponse(`ledger_export_${Date.now()}.csv`, csvText);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized access or inactive company workspace." },
        { status: 401 }
      );
    }
    console.error("GET /api/exports/ledger Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred during ledger CSV generation." },
      { status: 500 }
    );
  }
}
