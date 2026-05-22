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

  // Fetch all invoices for the current year
  const invoices = await db.invoice.findMany({
    where: {
      invoiceNo: {
        startsWith: prefix,
      },
    },
    select: {
      invoiceNo: true,
    },
  });

  let nextSequence = 1;

  if (invoices && invoices.length > 0) {
    const sequences = invoices.map((inv: { invoiceNo: string }) => {
      const parts = inv.invoiceNo.split("-");
      // Format: ["INV", "YYYY", "XXXXX"] or ["INV", "YYYY", "XXX"]
      if (parts.length === 3) {
        const lastSeqString = parts[2];
        const parsedSeq = parseInt(lastSeqString, 10);
        return isNaN(parsedSeq) ? 0 : parsedSeq;
      }
      return 0;
    });

    const maxSeq = Math.max(0, ...sequences);
    nextSequence = maxSeq + 1;
  }

  const paddedSeq = String(nextSequence).padStart(5, "0");
  return `${prefix}${paddedSeq}`;
}

/**
 * Generates the next sequential receipt number for the current calendar year.
 * Performs database lookup inside the provided Prisma transaction (or defaults to the global prisma client).
 * 
 * @param tx Optional Prisma transaction or client instance to prevent race conditions
 * @returns {Promise<string>} Next receipt sequence number (e.g. "REC-2026-00042")
 */
export async function generateReceiptNumber(tx?: any): Promise<string> {
  const db = tx || prisma;
  const currentYear = new Date().getFullYear();
  const prefix = `REC-${currentYear}-`;

  // Fetch all receipts for the current year
  const receipts = await db.receipt.findMany({
    where: {
      receiptNo: {
        startsWith: prefix,
      },
    },
    select: {
      receiptNo: true,
    },
  });

  let nextSequence = 1;

  if (receipts && receipts.length > 0) {
    const sequences = receipts.map((rec: { receiptNo: string }) => {
      const parts = rec.receiptNo.split("-");
      // Format: ["REC", "YYYY", "XXXXX"] or ["REC", "YYYY", "XXX"]
      if (parts.length === 3) {
        const lastSeqString = parts[2];
        const parsedSeq = parseInt(lastSeqString, 10);
        return isNaN(parsedSeq) ? 0 : parsedSeq;
      }
      return 0;
    });

    const maxSeq = Math.max(0, ...sequences);
    nextSequence = maxSeq + 1;
  }

  const paddedSeq = String(nextSequence).padStart(5, "0");
  return `${prefix}${paddedSeq}`;
}
