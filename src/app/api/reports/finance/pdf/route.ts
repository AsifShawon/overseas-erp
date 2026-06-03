// src/app/api/reports/finance/pdf/route.ts
// GET /api/reports/finance/pdf — Finance summary report PDF.

import { NextResponse } from "next/server";
import React from "react";
import { prisma } from "@/lib/db";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";
import { renderPdfToBuffer } from "@/lib/pdf/pdf-service";
import { FinanceSummaryPdfDocument } from "@/lib/pdf/templates/finance-summary-pdf";

export async function GET(request: Request) {
  try {
    const { activeCompanyId, roleName, permissions } = await getCompanyContextOrThrow(request);

    const isAuthorized =
      roleName === "Super Admin" ||
      roleName === "Operations Admin" ||
      roleName === "Accounts Officer" ||
      permissions.includes("VIEW_ACCOUNTS") ||
      permissions.includes("VIEW_REPORTS");

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const dateFrom = url.searchParams.get("dateFrom") || undefined;
    const dateTo   = url.searchParams.get("dateTo")   || undefined;

    const where: any = { companyId: activeCompanyId };
    if (dateFrom) where.createdAt = { ...(where.createdAt ?? {}), gte: new Date(dateFrom) };
    if (dateTo)   where.createdAt = { ...(where.createdAt ?? {}), lte: new Date(dateTo + "T23:59:59Z") };

    const [company, invoices, receipts] = await Promise.all([
      prisma.company.findUnique({ where: { id: activeCompanyId }, select: { name: true } }),
      prisma.invoice.findMany({
        where,
        include: { applicant: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.receipt.findMany({ where, select: { amountPaid: true } }),
    ]);

    const totalInvoiced    = invoices.reduce((s, i) => s + Number(i.amount), 0);
    const totalOutstanding = invoices.reduce((s, i) => s + Number(i.outstanding), 0);
    const totalCollected   = receipts.reduce((s, r) => s + Number(r.amountPaid), 0);

    const buffer = await renderPdfToBuffer(
      React.createElement(FinanceSummaryPdfDocument, {
        data: {
          companyName:      company?.name ?? "VisaTek ERP",
          dateFrom,
          dateTo,
          totalInvoiced,
          totalCollected,
          totalOutstanding,
          invoiceCount:     invoices.length,
          receiptCount:     receipts.length,
          topInvoices:      invoices.slice(0, 50).map((inv) => ({
            invoiceNo:     inv.invoiceNo,
            applicantName: inv.applicant?.fullName ?? "—",
            amount:        Number(inv.amount),
            outstanding:   Number(inv.outstanding),
            status:        Number(inv.outstanding) === 0 ? "PAID" : Number(inv.outstanding) < Number(inv.amount) ? "PARTIAL" : "DUE",
          })),
        },
      })
    );

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="finance-report.pdf"`,
        "Content-Length":      buffer.length.toString(),
      },
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/reports/finance/pdf Error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
