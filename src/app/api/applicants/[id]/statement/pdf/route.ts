// src/app/api/applicants/[id]/statement/pdf/route.ts
// GET /api/applicants/[id]/statement/pdf — Download applicant account statement as PDF.

import { NextResponse } from "next/server";
import React from "react";
import { prisma } from "@/lib/db";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";
import { renderPdfToBuffer } from "@/lib/pdf/pdf-service";
import { StatementPdfDocument } from "@/lib/pdf/templates/statement-pdf";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { activeCompanyId } = await getCompanyContextOrThrow(request);
    const { id } = await params;

    // Fetch applicant details with company, invoices, receipts, and ledger entries
    const applicant = await prisma.applicant.findFirst({
      where: { id, companyId: activeCompanyId },
      include: {
        company: { select: { name: true, address: true } },
        ledgerEntries: {
          orderBy: { timestamp: "asc" },
        },
        invoices: {
          select: { id: true, invoiceNo: true, outstanding: true }
        },
        receipts: {
          select: { id: true, receiptNo: true }
        }
      }
    });

    if (!applicant) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    const outstandingBalance = applicant.invoices.reduce((acc, inv) => acc + Number(inv.outstanding), 0);

    const entries = applicant.ledgerEntries.map((entry) => {
      const referenceNo =
        applicant.invoices.find((i) => i.id === entry.referenceId)?.invoiceNo ||
        applicant.receipts.find((r) => r.id === entry.referenceId)?.receiptNo ||
        entry.referenceId;

      return {
        timestamp: entry.timestamp,
        transactionType: entry.transactionType,
        referenceNo,
        debit: Number(entry.debit),
        credit: Number(entry.credit),
        runningBalance: Number(entry.runningBalance)
      };
    });

    const buffer = await renderPdfToBuffer(
      React.createElement(StatementPdfDocument, {
        data: {
          companyName: applicant.company?.name ?? "VisaTek ERP",
          companyAddress: applicant.company?.address ?? undefined,
          applicantName: applicant.fullName,
          passportNumber: applicant.passportNumber,
          trade: applicant.trade,
          outstandingBalance,
          entries
        }
      })
    );

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="statement-${applicant.fullName.replace(/\s+/g, "_")}.pdf"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/applicants/[id]/statement/pdf Error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
