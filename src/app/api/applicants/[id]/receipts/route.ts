// src/app/api/applicants/[id]/receipts/route.ts
// POST /api/applicants/[id]/receipts - Record candidate receipt and post matching credit entry into the applicant ledger

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";
import { generateReceiptNumber } from "@/lib/sequence";
import { z } from "zod";

// Zod validation schema for custom receipt payment recording
const ReceiptCreateSchema = z.object({
  invoiceId: z.string().uuid("Invalid invoice identifier."),
  amountPaid: z.number().positive("Receipt amount must be greater than zero."),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "MOBILE_BANKING", "CHEQUE"]),
  referenceNo: z.string().trim().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { userId, roleName } = decoded;

    // Boundary Check: Explicitly block Agent and Applicant user roles
    if (roleName === "Agent" || roleName === "Applicant") {
      return NextResponse.json(
        { error: "Forbidden. Candidates and agents cannot record payment receipts." },
        { status: 403 }
      );
    }

    // RBAC: Verify if user holds authorized role or dynamic permissions
    const permissions = await getUserPermissions(userId);
    const isAuthorized =
      roleName === "Super Admin" ||
      roleName === "Operations Admin" ||
      roleName === "Accounts Officer" ||
      permissions.includes("RECORD_RECEIPT" as any) ||
      permissions.includes("MANAGE_ACCOUNTS" as any);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient administrative permissions to record payment receipts." },
        { status: 403 }
      );
    }

    // Parse and validate incoming payload
    const body = await request.json();
    const validatedData = ReceiptCreateSchema.parse(body);
    const { invoiceId, amountPaid, paymentMethod, referenceNo } = validatedData;

    let transactionError: string | null = null;
    let createdReceipt: any = null;

    // Run interactive transaction
    await prisma.$transaction(async (tx) => {
      // 1. Fetch applicant details
      const applicant = await tx.applicant.findUnique({
        where: { id },
        include: {
          agent: true,
        },
      });

      if (!applicant) {
        transactionError = "NOT_FOUND";
        throw new Error("NOT_FOUND");
      }

      // Business check: Prevent invoicing or receipting archived profiles
      if (applicant.isArchived) {
        transactionError = "BAD_REQUEST:Cannot record payment receipts for archived candidate dossiers.";
        throw new Error("BAD_REQUEST");
      }

      // 2. Fetch invoice and verify ownership
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        transactionError = "BAD_REQUEST:Target invoice not found.";
        throw new Error("BAD_REQUEST");
      }

      if (invoice.applicantId !== id) {
        transactionError = "BAD_REQUEST:Target invoice does not belong to this applicant dossier.";
        throw new Error("BAD_REQUEST");
      }

      const outstandingNum = Number(invoice.outstanding);
      if (outstandingNum <= 0) {
        transactionError = "BAD_REQUEST:Target invoice is already fully paid.";
        throw new Error("BAD_REQUEST");
      }

      // Override Check: Prevent paying more than outstanding unless Admin override applies
      if (amountPaid > outstandingNum) {
        const isStaffOverride = roleName === "Super Admin" || roleName === "Operations Admin";
        if (!isStaffOverride) {
          transactionError = `BAD_REQUEST:Receipt payment amount ($${amountPaid.toLocaleString()}) exceeds the invoice outstanding amount ($${outstandingNum.toLocaleString()}) without administrator override.`;
          throw new Error("BAD_REQUEST");
        }
      }

      // 3. Generate sequential receipt number
      const receiptNo = await generateReceiptNumber(tx);

      // 4. Compute latest running balance from LedgerEntry
      const lastLedger = await tx.ledgerEntry.findFirst({
        where: { applicantId: id },
        orderBy: { timestamp: "desc" },
      });

      const previousBalance = lastLedger ? Number(lastLedger.runningBalance) : 0;
      const newBalance = Number((previousBalance - amountPaid).toFixed(2)); // Credits decrease balance

      // 5. Create Receipt entry
      createdReceipt = await tx.receipt.create({
        data: {
          applicantId: id,
          invoiceId,
          receiptNo,
          amountPaid,
          paymentMethod,
          referenceNo: referenceNo || null,
          receivedById: userId,
        },
      });

      // 6. Update Invoice outstanding
      const finalOutstanding = Number(Math.max(0, outstandingNum - amountPaid).toFixed(2));
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          outstanding: finalOutstanding,
        },
      });

      // 7. Create LedgerEntry matching credit posting
      const ledgerEntry = await tx.ledgerEntry.create({
        data: {
          applicantId: id,
          transactionType: "RECEIPT",
          referenceId: createdReceipt.id,
          debit: 0,
          credit: amountPaid,
          runningBalance: newBalance,
        },
      });

      // 8. Create Notification row for applicant user if linked
      if (applicant.userId) {
        await tx.notification.create({
          data: {
            userId: applicant.userId,
            title: "Payment Received",
            message: `Your payment of $${amountPaid.toLocaleString()} for Invoice ${invoice.invoiceNo} has been successfully recorded under Receipt Voucher ${receiptNo}.`,
          },
        });
      }

      // 9. Create Notification row for agent user if linked
      if (applicant.agent?.userId) {
        await tx.notification.create({
          data: {
            userId: applicant.agent.userId,
            title: "Candidate Payment Recorded",
            message: `A payment of $${amountPaid.toLocaleString()} was successfully recorded for candidate ${applicant.fullName} under Receipt ${receiptNo}.`,
          },
        });
      }

      // 10. Create AuditLog row tracking database change snapshot
      await tx.auditLog.create({
        data: {
          userId,
          roleName,
          actionType: "RECORD_RECEIPT",
          tableName: "Receipt",
          recordId: createdReceipt.id,
          delta: {
            before: null,
            after: {
              id: createdReceipt.id,
              receiptNo: createdReceipt.receiptNo,
              amountPaid: Number(createdReceipt.amountPaid),
              paymentMethod: createdReceipt.paymentMethod,
              referenceNo: createdReceipt.referenceNo,
              receivedById: createdReceipt.receivedById,
            },
            invoiceUpdate: {
              id: invoice.id,
              previousOutstanding: outstandingNum,
              newOutstanding: finalOutstanding,
            },
            ledgerEntry: {
              id: ledgerEntry.id,
              debit: Number(ledgerEntry.debit),
              credit: Number(ledgerEntry.credit),
              runningBalance: Number(ledgerEntry.runningBalance),
            },
          } as any,
          ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
        },
      });
    });

    // Fetch updated applicant dossier matching GET details for immediate frontend sync
    const updatedApplicant = await prisma.applicant.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            agentCode: true,
            companyName: true,
          },
        },
        jobOrder: true,
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

    // Transform Decimal instances to plain numeric values to maintain consistency with frontend mappings
    const receiptData = createdReceipt ? {
      ...createdReceipt,
      amountPaid: Number(createdReceipt.amountPaid),
    } : null;

    return NextResponse.json({
      receipt: receiptData,
      applicant: updatedApplicant,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed." },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return NextResponse.json({ error: "Applicant record not found." }, { status: 404 });
      }
      if (error.message.startsWith("BAD_REQUEST:")) {
        return NextResponse.json(
          { error: error.message.replace("BAD_REQUEST:", "") },
          { status: 400 }
        );
      }
    }

    console.error("POST /api/applicants/[id]/receipts Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred while processing the transaction." },
      { status: 500 }
    );
  }
}
