// src/app/api/finance/receipts/[id]/pdf/route.ts
// GET /api/finance/receipts/[id]/pdf — Download receipt as PDF.

import { NextResponse } from "next/server";
import React from "react";
import { prisma } from "@/lib/db";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";
import { renderPdfToBuffer } from "@/lib/pdf/pdf-service";
import { ReceiptPdfDocument } from "@/lib/pdf/templates/receipt-pdf";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { activeCompanyId } = await getCompanyContextOrThrow(request);
    const { id } = await params;

    const receipt = await prisma.receipt.findFirst({
      where: { id, companyId: activeCompanyId },
      include: {
        applicant: { select: { fullName: true, passportNumber: true, phone: true } },
        invoice:   { select: { invoiceNo: true } },
        company:   { select: { name: true, address: true } },
      },
    });

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    // Resolve receivedBy name
    let receivedBy: string | undefined;
    if (receipt.receivedById) {
      const receiver = await prisma.user.findUnique({
        where: { id: receipt.receivedById },
        select: { fullName: true },
      });
      receivedBy = receiver?.fullName;
    }

    const buffer = await renderPdfToBuffer(
      React.createElement(ReceiptPdfDocument, {
        data: {
          receiptNo:      receipt.receiptNo,
          companyName:    receipt.company?.name ?? "VisaTek ERP",
          companyAddress: receipt.company?.address ?? undefined,
          applicantName:  receipt.applicant?.fullName ?? "Applicant",
          passportNumber: receipt.applicant?.passportNumber ?? "—",
          phone:          receipt.applicant?.phone ?? undefined,
          invoiceNo:      receipt.invoice?.invoiceNo ?? undefined,
          amountPaid:     Number(receipt.amountPaid),
          paymentMethod:  receipt.paymentMethod,
          referenceNo:    receipt.referenceNo ?? undefined,
          receivedBy,
          createdAt:      receipt.createdAt,
        },
      })
    );

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="receipt-${receipt.receiptNo}.pdf"`,
        "Content-Length":      buffer.length.toString(),
      },
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/finance/receipts/[id]/pdf Error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
