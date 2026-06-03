// src/app/api/applicant/portal/route.ts
// GET /api/applicant/portal - Live candidate dossier query

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";

export async function GET(request: Request) {
  try {
    // 1. Authenticate the request and retrieve company context
    const { activeCompanyId, userId, roleName } = await getCompanyContextOrThrow(request);

    // 2. Strict Role Verification: Scoped strictly to the logged-in Applicant
    if (roleName !== "Applicant") {
      return NextResponse.json(
        { error: "Forbidden. Scoped strictly to Applicant portal access." },
        { status: 403 }
      );
    }

    // 3. Locate applicant record in PostgreSQL linked directly to user session and active company
    const applicant = await prisma.applicant.findFirst({
      where: { userId, companyId: activeCompanyId },
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

    // 4. Return clear error if no linked applicant profile exists
    if (!applicant) {
      return NextResponse.json(
        { error: "No applicant profile is linked to this user account." },
        { status: 404 }
      );
    }

    // 5. Exclude private S3/local file system paths & map to secure streaming route
    const safeDocuments = applicant.documents.map((doc) => ({
      id: doc.id,
      documentType: doc.documentType,
      fileName: doc.fileName,
      status: doc.status,
      expiryDate: doc.expiryDate ? doc.expiryDate.toISOString().split("T")[0] : undefined,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      // Secure access URL requiring JWT authentication check
      fileUrl: `/api/documents/${doc.id}/download`,
    }));

    // 6. Map Invoices converting Prisma Decimals into standard float numbers
    const invoices = applicant.invoices.map((inv) => ({
      id: inv.id,
      invoiceNo: inv.invoiceNo,
      applicantId: inv.applicantId,
      amount: Number(inv.amount),
      outstanding: Number(inv.outstanding),
      dueDate: inv.dueDate.toISOString().split("T")[0],
      description: inv.description,
      createdAt: inv.createdAt.toISOString().split("T")[0],
    }));

    // 7. Resolve Accounts Officer names to display on official payment vouchers
    const userIds = applicant.receipts.map((r) => r.receivedById);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.fullName]));

    const receipts = applicant.receipts.map((rec) => ({
      id: rec.id,
      receiptNo: rec.receiptNo,
      applicantId: rec.applicantId,
      invoiceId: rec.invoiceId,
      amountPaid: Number(rec.amountPaid),
      paymentMethod: rec.paymentMethod,
      referenceNo: rec.referenceNo,
      receivedBy: userMap.get(rec.receivedById) || "Accounts Officer",
      createdAt: rec.createdAt.toISOString().split("T")[0],
    }));

    // 8. Construct stable ledger entries with reference numbers derived from mapped invoice/receipt IDs
    const invoicesMap = new Map(applicant.invoices.map((i) => [i.id, i.invoiceNo]));
    const receiptsMap = new Map(applicant.receipts.map((r) => [r.id, r.receiptNo]));

    const ledgerEntries = applicant.ledgerEntries.map((entry) => {
      const referenceNo =
        invoicesMap.get(entry.referenceId) ||
        receiptsMap.get(entry.referenceId) ||
        "REF-UNKNOWN";
      return {
        id: entry.id,
        applicantId: entry.applicantId,
        transactionType: entry.transactionType,
        referenceNo,
        debit: Number(entry.debit),
        credit: Number(entry.credit),
        runningBalance: Number(entry.runningBalance),
        timestamp: entry.timestamp.toISOString(),
      };
    });

    // 9. Return sanitized emigration dossier response
    return NextResponse.json({
      id: applicant.id,
      fullName: applicant.fullName,
      phone: applicant.phone,
      email: applicant.email,
      passportNumber: applicant.passportNumber,
      passportExpiry: applicant.passportExpiry.toISOString().split("T")[0],
      nationality: applicant.nationality,
      dateOfBirth: applicant.dateOfBirth.toISOString().split("T")[0],
      nidNumber: applicant.nidNumber,
      address: applicant.address,
      emergencyContact: applicant.emergencyContact,
      trade: applicant.trade,
      currentStage: applicant.currentStage,
      isArchived: applicant.isArchived,
      archivedAt: applicant.archivedAt ? applicant.archivedAt.toISOString() : null,
      agentId: applicant.agentId,
      jobOrderId: applicant.jobOrderId,
      userId: applicant.userId,
      documents: safeDocuments,
      invoices,
      receipts,
      ledgerEntries,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }
    console.error("GET /api/applicant/portal Error:", error);
    return NextResponse.json(
      { error: "An unexpected database error occurred on the server." },
      { status: 500 }
    );
  }
}
