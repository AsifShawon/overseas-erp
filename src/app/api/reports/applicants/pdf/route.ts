// src/app/api/reports/applicants/pdf/route.ts
// GET /api/reports/applicants/pdf — Applicant report PDF.

import { NextResponse } from "next/server";
import React from "react";
import { prisma } from "@/lib/db";
import { requireBranchContext, buildBranchWhere } from "@/lib/branch-scope";
import { renderPdfToBuffer } from "@/lib/pdf/pdf-service";
import { ApplicantReportPdfDocument } from "@/lib/pdf/templates/applicant-report-pdf";

export async function GET(request: Request) {
  try {
    const branchScope = await requireBranchContext(request);
    const { activeCompanyId, roleName, permissions } = branchScope;

    const isAuthorized =
      roleName === "Super Admin" ||
      roleName === "Operations Admin" ||
      roleName === "HR Officer" ||
      roleName === "Documentation Officer" ||
      roleName === "Visa Officer" ||
      permissions.includes("VIEW_APPLICANTS") ||
      permissions.includes("VIEW_REPORTS");

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url    = new URL(request.url);
    const stage  = url.searchParams.get("stage")   || undefined;
    const search = url.searchParams.get("search")  || undefined;

    const baseWhere = buildBranchWhere(activeCompanyId, branchScope);
    const where: any = { ...baseWhere };
    if (stage)  where.currentStage = stage;
    if (search) {
      where.OR = [
        { fullName:       { contains: search, mode: "insensitive" } },
        { passportNumber: { contains: search, mode: "insensitive" } },
        { trade:          { contains: search, mode: "insensitive" } },
      ];
    }

    const [company, applicants] = await Promise.all([
      prisma.company.findUnique({ where: { id: activeCompanyId }, select: { name: true } }),
      prisma.applicant.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 200,
        include: { agent: { select: { agentCode: true } } },
      }),
    ]);

    const totalActive   = applicants.filter((a) => !a.isArchived).length;
    const totalArchived = applicants.filter((a) =>  a.isArchived).length;

    const buffer = await renderPdfToBuffer(
      React.createElement(ApplicantReportPdfDocument, {
        data: {
          companyName:  company?.name ?? "VisaTek ERP",
          filters:      [stage, search].filter(Boolean).join(", ") || undefined,
          totalActive,
          totalArchived,
          rows: applicants.map((a) => ({
            fullName:      a.fullName,
            passportNumber:a.passportNumber,
            trade:         a.trade,
            currentStage:  a.currentStage,
            agentCode:     a.agent?.agentCode ?? undefined,
            phone:         a.phone,
            createdAt:     a.createdAt,
            isArchived:    a.isArchived,
          })),
        },
      })
    );

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="applicants-report.pdf"`,
        "Content-Length":      buffer.length.toString(),
      },
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return NextResponse.json({ error: err.message === "FORBIDDEN" ? "Forbidden" : "Unauthorized" }, { status: err.message === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("GET /api/reports/applicants/pdf Error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
