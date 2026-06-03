// src/app/api/reports/commissions/pdf/route.ts
// GET /api/reports/commissions/pdf — Commission report PDF.

import { NextResponse } from "next/server";
import React from "react";
import { prisma } from "@/lib/db";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";
import { renderPdfToBuffer } from "@/lib/pdf/pdf-service";
import { CommissionReportPdfDocument } from "@/lib/pdf/templates/commission-report-pdf";

export async function GET(request: Request) {
  try {
    const { activeCompanyId, roleName, userId, permissions } = await getCompanyContextOrThrow(request);

    const isAgent    = roleName === "Agent";
    const isAuthorized =
      roleName === "Super Admin" ||
      roleName === "Operations Admin" ||
      roleName === "Accounts Officer" ||
      isAgent ||
      permissions.includes("VIEW_COMMISSIONS") ||
      permissions.includes("VIEW_REPORTS");

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const where: any = { companyId: activeCompanyId };

    // Agent can only see their own commissions
    if (isAgent) {
      const agent = await prisma.agent.findFirst({
        where: { userId, companyId: activeCompanyId },
        select: { id: true },
      });
      if (!agent) {
        return NextResponse.json({ error: "Agent profile not found" }, { status: 403 });
      }
      where.agentId = agent.id;
    }

    const [company, commissions] = await Promise.all([
      prisma.company.findUnique({ where: { id: activeCompanyId }, select: { name: true } }),
      prisma.commission.findMany({
        where,
        include: {
          agent:     { select: { agentCode: true, user: { select: { fullName: true } } } },
          applicant: { select: { fullName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);

    const totalAccrued   = commissions.filter((c) => c.status === "ACCRUED")  .reduce((s, c) => s + Number(c.amount), 0);
    const totalPaid      = commissions.filter((c) => c.status === "PAID")     .reduce((s, c) => s + Number(c.amount), 0);
    const totalCancelled = commissions.filter((c) => c.status === "CANCELLED").reduce((s, c) => s + Number(c.amount), 0);

    let agentName: string | undefined;
    if (isAgent && commissions[0]) {
      agentName = commissions[0].agent?.user?.fullName;
    }

    const buffer = await renderPdfToBuffer(
      React.createElement(CommissionReportPdfDocument, {
        data: {
          companyName: company?.name ?? "VisaTek ERP",
          agentName,
          totalAccrued,
          totalPaid,
          totalCancelled,
          rows: commissions.map((c) => ({
            agentCode:     c.agent?.agentCode ?? "—",
            agentName:     c.agent?.user?.fullName ?? "—",
            applicantName: c.applicant?.fullName ?? "—",
            amount:        Number(c.amount),
            status:        c.status,
            createdAt:     c.createdAt,
            payoutDate:    c.payoutDate,
          })),
        },
      })
    );

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="commissions-report.pdf"`,
        "Content-Length":      buffer.length.toString(),
      },
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/reports/commissions/pdf Error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
