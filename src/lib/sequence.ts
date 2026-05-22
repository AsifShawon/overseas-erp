// src/lib/sequence.ts
// Sequential Invoice Number Generator Utility for Overseas Manpower ERP
// Generates: INV-YYYY-00001, INV-YYYY-00002, etc.

import { prisma } from "@/lib/db";

/**
 * Generates the next sequential invoice number for the current calendar year.
 * Performs database lookup inside the provided Prisma transaction (or defaults to the global prisma client).
 * 
 * @param tx Option Prisma transaction or client instance to prevent race conditions
 * @returns {Promise<string>} Next invoice sequence number (e.g. "INV-2026-00042")
 */
export async function generateInvoiceNumber(tx?: any): Promise<string> {
  const db = tx || prisma;
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;

  // Query the database for the latest invoice in the current year
  const latestInvoice = await db.invoice.findFirst({
    where: {
      invoiceNo: {
        startsWith: prefix,
      },
    },
    orderBy: {
      invoiceNo: "desc",
    },
    select: {
      invoiceNo: true,
    },
  });

  let nextSequence = 1;

  if (latestInvoice && latestInvoice.invoiceNo) {
    const parts = latestInvoice.invoiceNo.split("-");
    // Format: ["INV", "YYYY", "XXXXX"]
    if (parts.length === 3) {
      const lastSeqString = parts[2];
      const parsedSeq = parseInt(lastSeqString, 10);
      if (!isNaN(parsedSeq)) {
        nextSequence = parsedSeq + 1;
      }
    }
  }

  const paddedSeq = String(nextSequence).padStart(5, "0");
  return `${prefix}${paddedSeq}`;
}
