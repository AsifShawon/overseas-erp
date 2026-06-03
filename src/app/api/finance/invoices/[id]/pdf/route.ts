// src/app/api/finance/invoices/[id]/pdf/route.ts
// GET /api/finance/invoices/[id]/pdf — Download invoice as PDF.

import { NextResponse } from "next/server";
import React from "react";
import { prisma } from "@/lib/db";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";
import { renderPdfToBuffer } from "@/lib/pdf/pdf-service";
import { InvoicePdfDocument } from "@/lib/pdf/templates/invoice-pdf";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { activeCompanyId } = await getCompanyContextOrThrow(request);
    const { id } = await params;

    // Fetch invoice — must belong to activeCompanyId
    const invoice = await prisma.invoice.findFirst({
      where: { id, companyId: activeCompanyId },
      include: {
        applicant: { select: { fullName: true, passportNumber: true, phone: true } },
        company:   { select: { name: true, address: true } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const amount      = Number(invoice.amount);
    const outstanding = Number(invoice.outstanding);
    const paid        = amount - outstanding;
    const status: "PAID" | "PARTIAL" | "DUE" =
      outstanding === 0 ? "PAID" : outstanding < amount ? "PARTIAL" : "DUE";

    const buffer = await renderPdfToBuffer(
      React.createElement(InvoicePdfDocument, {
        data: {
          invoiceNo:     invoice.invoiceNo,
          companyName:   invoice.company?.name ?? "VisaTek ERP",
          companyAddress:invoice.company?.address ?? undefined,
          applicantName: invoice.applicant?.fullName ?? "Applicant",
          passportNumber:invoice.applicant?.passportNumber ?? "—",
          phone:         invoice.applicant?.phone ?? undefined,
          description:   invoice.description,
          amount,
          outstanding,
          dueDate:       invoice.dueDate,
          createdAt:     invoice.createdAt,
          status,
        },
      })
    );

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNo}.pdf"`,
        "Content-Length":      buffer.length.toString(),
      },
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/finance/invoices/[id]/pdf Error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
