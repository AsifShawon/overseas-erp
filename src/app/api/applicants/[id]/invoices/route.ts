// src/app/api/applicants/[id]/invoices/route.ts
// POST /api/applicants/[id]/invoices - Issue service invoice and record matching ledger debit entry

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";
import { generateInvoiceNumber } from "@/lib/sequence";
import { z } from "zod";

// Zod validation schema for custom service invoice creation
const InvoiceCreateSchema = z.object({
  amount: z.number().positive("Invoice amount must be greater than zero."),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid due date format.",
  }),
  description: z.string().trim().min(1, "Billing description is required."),
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
        { error: "Forbidden. Candidates and agents cannot issue service invoices." },
        { status: 403 }
      );
    }

    // RBAC: Verify if user holds authorized role or dynamic permissions
    const permissions = await getUserPermissions(userId);
    const isAuthorized =
      roleName === "Super Admin" ||
      roleName === "Operations Admin" ||
      roleName === "Accounts Officer" ||
      permissions.includes("CREATE_INVOICE" as any) ||
      permissions.includes("MANAGE_ACCOUNTS" as any);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient administrative permissions to issue service invoices." },
        { status: 403 }
      );
    }

    // Parse and validate incoming payload
    const body = await request.json();
    const validatedData = InvoiceCreateSchema.parse(body);
    const { amount, dueDate, description } = validatedData;

    let transactionError: string | null = null;

    // Run transaction
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

      // Business check: Prevent invoicing archived profiles
      if (applicant.isArchived) {
        transactionError = "BAD_REQUEST:Cannot issue service invoices for archived candidate dossiers.";
        throw new Error("BAD_REQUEST");
      }

      // 2. Generate thread-safe sequential invoice number
      const invoiceNo = await generateInvoiceNumber(tx);

      // 3. Compute latest running balance from LedgerEntry
      const lastLedger = await tx.ledgerEntry.findFirst({
        where: { applicantId: id },
        orderBy: { timestamp: "desc" },
      });

      const previousBalance = lastLedger ? Number(lastLedger.runningBalance) : 0;
      const newBalance = Number((previousBalance + amount).toFixed(2));

      // 4. Create Invoice entry with amount outstanding = amount
      const invoice = await tx.invoice.create({
        data: {
          applicantId: id,
          invoiceNo,
          amount,
          outstanding: amount,
          dueDate: new Date(dueDate),
          description,
        },
      });

      // 5. Create LedgerEntry matching invoice debit posting
      const ledgerEntry = await tx.ledgerEntry.create({
        data: {
          applicantId: id,
          transactionType: "INVOICE",
          referenceId: invoice.id,
          debit: amount,
          credit: 0,
          runningBalance: newBalance,
        },
      });

      // 6. Create Notification row for applicant user if linked
      if (applicant.userId) {
        await tx.notification.create({
          data: {
            userId: applicant.userId,
            title: "New Invoice Issued",
            message: `A new service invoice (${invoiceNo}) for $${amount.toLocaleString()} has been issued with a due date of ${new Date(dueDate).toLocaleDateString()}.`,
          },
        });
      }

      // 7. Create Notification row for agent user if linked
      if (applicant.agent?.userId) {
        await tx.notification.create({
          data: {
            userId: applicant.agent.userId,
            title: "Candidate Invoice Issued",
            message: `A service invoice (${invoiceNo}) for $${amount.toLocaleString()} has been issued for candidate ${applicant.fullName}.`,
          },
        });
      }

      // 8. Create AuditLog row tracking database change snapshot
      await tx.auditLog.create({
        data: {
          userId,
          roleName,
          actionType: "CREATE_INVOICE",
          tableName: "Invoice",
          recordId: invoice.id,
          delta: {
            before: null,
            after: {
              id: invoice.id,
              invoiceNo: invoice.invoiceNo,
              amount: Number(invoice.amount),
              outstanding: Number(invoice.outstanding),
              dueDate: invoice.dueDate,
              description: invoice.description,
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

    return NextResponse.json(updatedApplicant);
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

    console.error("POST /api/applicants/[id]/invoices Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred while processing the transaction." },
      { status: 500 }
    );
  }
}
