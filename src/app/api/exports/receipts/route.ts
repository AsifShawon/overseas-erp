import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";
import { buildCsv, csvResponse } from "@/lib/csv";

export async function GET(request: Request) {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { userId, roleName } = decoded;

    // Block Agent and Applicant roles
    if (roleName === "Agent" || roleName === "Applicant") {
      return NextResponse.json(
        { error: "Forbidden. Corporate financial receipt records access restricted." },
        { status: 403 }
      );
    }

    // RBAC: Check accounts permissions
    const permissions = await getUserPermissions(userId);
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

    const whereClause: any = {};

    if (search) {
      const matchingApplicants = await prisma.applicant.findMany({
        where: {
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
          invoiceNo: { contains: search, mode: "insensitive" },
        },
        select: { id: true },
      });
      const invoiceIds = matchingInvoices.map((i) => i.id);

      whereClause.OR = [
        { applicantId: { in: applicantIds } },
        { invoiceId: { in: invoiceIds } },
        { receiptNo: { contains: search, mode: "insensitive" } },
        { referenceNo: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch receipts (no pagination limits for exports)
    const receipts = await prisma.receipt.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        applicant: {
          select: {
            fullName: true,
            passportNumber: true,
          },
        },
        invoice: {
          select: {
            invoiceNo: true,
          },
        },
      },
    });

    // Bulk resolve matching User names for receivedById
    const receivedByIds = receipts.map((r) => r.receivedById);
    const users = await prisma.user.findMany({
      where: { id: { in: receivedByIds } },
      select: { id: true, fullName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.fullName]));

    const headers = [
      "Receipt No",
      "Applicant Name",
      "Passport Number",
      "Invoice No",
      "Amount Paid",
      "Payment Method",
      "Reference No",
      "Received By",
      "Created At",
    ];

    const rows = receipts.map((rec) => [
      rec.receiptNo,
      rec.applicant?.fullName || "Unknown Candidate",
      rec.applicant?.passportNumber || "N/A",
      rec.invoice?.invoiceNo || "N/A",
      Number(rec.amountPaid).toFixed(2),
      rec.paymentMethod,
      rec.referenceNo || "Cash Counter Desk",
      userMap.get(rec.receivedById) || "Accounts Officer",
      rec.createdAt.toISOString().split("T")[0],
    ]);

    const csvText = buildCsv(headers, rows);
    return csvResponse(`receipts_export_${Date.now()}.csv`, csvText);
  } catch (error) {
    console.error("GET /api/exports/receipts Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred during receipt CSV generation." },
      { status: 500 }
    );
  }
}
