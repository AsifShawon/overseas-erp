// src/app/api/reports/dashboard/route.ts
// GET /api/reports/dashboard - Fetch role-aware analytical aggregates from PostgreSQL database

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";

export async function GET(request: Request) {
  try {
    // 1. Authenticate and resolve company context
    const { activeCompanyId, userId, roleName } = await getCompanyContextOrThrow(request);

    // 2. Bound Applicant access completely
    if (roleName === "Applicant") {
      return NextResponse.json(
        { error: "Forbidden. Applicant role does not have access to management dashboards." },
        { status: 403 }
      );
    }

    // 3. Return payload customized for the authenticated user's role

    // -------------------------------------------------------------
    // SUPER ADMIN / OPERATIONS ADMIN COHORT
    // -------------------------------------------------------------
    if (roleName === "Super Admin" || roleName === "Operations Admin") {
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

      const [
        activeApplicants,
        archivedApplicants,
        totalAgents,
        activeAgents,
        totalJobOrders,
        openJobOrders,
        totalQuotaAgg,
        allocatedQuotaAgg,
        totalInvoicedAgg,
        totalCollectedAgg,
        totalOutstandingAgg,
        accruedCommAgg,
        paidCommAgg,
        applicantsByStage,
        recentAuditLogsRaw,
        recentNotifications,
        passportExpiryWarningsRaw,
        documentPendingCount,
        jobOrdersRaw,
      ] = await Promise.all([
        prisma.applicant.count({ where: { isArchived: false, companyId: activeCompanyId } }),
        prisma.applicant.count({ where: { isArchived: true, companyId: activeCompanyId } }),
        prisma.agent.count({ where: { companyId: activeCompanyId } }),
        prisma.agent.count({ where: { isActive: true, companyId: activeCompanyId } }),
        prisma.jobOrder.count({ where: { companyId: activeCompanyId } }),
        prisma.jobOrder.count({ where: { status: "OPEN", companyId: activeCompanyId } }),
        prisma.jobOrder.aggregate({ where: { companyId: activeCompanyId }, _sum: { totalQuota: true } }),
        prisma.jobOrder.aggregate({ where: { companyId: activeCompanyId }, _sum: { allocatedQuota: true } }),
        prisma.invoice.aggregate({ where: { companyId: activeCompanyId }, _sum: { amount: true } }),
        prisma.receipt.aggregate({ where: { companyId: activeCompanyId }, _sum: { amountPaid: true } }),
        prisma.invoice.aggregate({ where: { companyId: activeCompanyId }, _sum: { outstanding: true } }),
        prisma.commission.aggregate({ where: { status: "ACCRUED", companyId: activeCompanyId }, _sum: { amount: true } }),
        prisma.commission.aggregate({ where: { status: "PAID", companyId: activeCompanyId }, _sum: { amount: true } }),
        prisma.applicant.groupBy({
          by: ["currentStage"],
          where: { isArchived: false, companyId: activeCompanyId },
          _count: { id: true },
        }),
        prisma.auditLog.findMany({
          where: { companyId: activeCompanyId },
          orderBy: { timestamp: "desc" },
          take: 10,
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        }),
        prisma.notification.findMany({
          where: { companyId: activeCompanyId },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.applicant.findMany({
          where: {
            isArchived: false,
            companyId: activeCompanyId,
            passportExpiry: { lte: sixMonthsFromNow },
          },
          select: {
            id: true,
            fullName: true,
            passportNumber: true,
            passportExpiry: true,
          },
          orderBy: { passportExpiry: "asc" },
          take: 5,
        }),
        prisma.document.count({
          where: { status: "PENDING_VERIFICATION", companyId: activeCompanyId },
        }),
        prisma.jobOrder.findMany({
          where: { companyId: activeCompanyId },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      const totalQuota = totalQuotaAgg._sum.totalQuota || 0;
      const allocatedQuota = allocatedQuotaAgg._sum.allocatedQuota || 0;
      const totalInvoiced = Number(totalInvoicedAgg._sum.amount || 0);
      const totalCollected = Number(totalCollectedAgg._sum.amountPaid || 0);
      const totalOutstanding = Number(totalOutstandingAgg._sum.outstanding || 0);
      const pendingCommission = Number(accruedCommAgg._sum.amount || 0);
      const totalCommissionPaid = Number(paidCommAgg._sum.amount || 0);
      const totalCommissionAccrued = pendingCommission + totalCommissionPaid;

      // Group stage counts
      const stageCounts: Record<string, number> = {};
      applicantsByStage.forEach((group) => {
        stageCounts[group.currentStage] = group._count.id;
      });

      // Flatten Audit Logs to match mock structure
      const recentAuditLogs = recentAuditLogsRaw.map((log) => ({
        id: log.id,
        userId: log.user?.fullName || log.userId || "System",
        roleName: log.roleName,
        actionType: log.actionType,
        tableName: log.tableName,
        recordId: log.recordId,
        delta: log.delta ? JSON.stringify(log.delta) : null,
        ipAddress: log.ipAddress,
        timestamp: log.timestamp.toISOString(),
      }));

      // Flatten passport warnings
      const passportExpiryWarnings = passportExpiryWarningsRaw.map((app) => ({
        id: app.id,
        fullName: app.fullName,
        passportNumber: app.passportNumber,
        passportExpiry: app.passportExpiry.toISOString().split("T")[0],
      }));

      // Flatten Job Orders list
      const jobOrders = jobOrdersRaw.map((jo) => ({
        id: jo.id,
        orderNumber: jo.orderNumber,
        employerName: jo.employerName,
        country: jo.country,
        trade: jo.trade,
        salary: Number(jo.salary),
        totalQuota: jo.totalQuota,
        allocatedQuota: jo.allocatedQuota,
        commissionAmount: Number(jo.commissionAmount),
        status: jo.status,
      }));

      return NextResponse.json({
        activeApplicants,
        archivedApplicants,
        totalAgents,
        activeAgents,
        totalJobOrders,
        openJobOrders,
        totalQuota,
        allocatedQuota,
        totalInvoiced,
        totalCollected,
        totalOutstanding,
        totalCommissionAccrued,
        totalCommissionPaid,
        pendingCommission,
        stageCounts,
        recentAuditLogs,
        recentNotifications,
        passportExpiryWarnings,
        documentPendingCount,
        jobOrders,
      });
    }

    // -------------------------------------------------------------
    // HR OFFICER COHORT
    // -------------------------------------------------------------
    if (roleName === "HR Officer") {
      const [appliedCount, interviewedCount, selectedCount, recruitmentQueueRaw, openJobOrders, totalQuotaAgg, allocatedQuotaAgg, totalPlacedCount] = await Promise.all([
        prisma.applicant.count({ where: { isArchived: false, currentStage: "APPLIED", companyId: activeCompanyId } }),
        prisma.applicant.count({ where: { isArchived: false, currentStage: "INTERVIEWED", companyId: activeCompanyId } }),
        prisma.applicant.count({ where: { isArchived: false, currentStage: "SELECTED", companyId: activeCompanyId } }),
        prisma.applicant.findMany({
          where: {
            isArchived: false,
            companyId: activeCompanyId,
            currentStage: { in: ["APPLIED", "INTERVIEWED"] },
          },
          select: {
            id: true,
            fullName: true,
            passportNumber: true,
            trade: true,
            currentStage: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.jobOrder.count({ where: { status: "OPEN", companyId: activeCompanyId } }),
        prisma.jobOrder.aggregate({ where: { companyId: activeCompanyId }, _sum: { totalQuota: true } }),
        prisma.jobOrder.aggregate({ where: { companyId: activeCompanyId }, _sum: { allocatedQuota: true } }),
        prisma.applicant.count({ where: { companyId: activeCompanyId } }),
      ]);

      const recruitmentQueue = recruitmentQueueRaw.map((app) => ({
        id: app.id,
        fullName: app.fullName,
        passportNumber: app.passportNumber,
        trade: app.trade,
        currentStage: app.currentStage,
        createdAt: app.createdAt.toISOString().split("T")[0],
      }));

      return NextResponse.json({
        appliedCount,
        interviewedCount,
        selectedCount,
        recruitmentQueue,
        openJobOrders,
        totalQuota: totalQuotaAgg._sum.totalQuota || 0,
        allocatedQuota: allocatedQuotaAgg._sum.allocatedQuota || 0,
        totalPlacedCount,
      });
    }

    // -------------------------------------------------------------
    // DOCUMENTATION OFFICER COHORT
    // -------------------------------------------------------------
    if (roleName === "Documentation Officer") {
      const [
        pendingDocumentCount,
        verifiedDocumentCount,
        medicalWaitingCount,
        medicalFitCount,
        pendingDocumentApplicantsRaw,
      ] = await Promise.all([
        prisma.document.count({ where: { status: "PENDING_VERIFICATION", companyId: activeCompanyId } }),
        prisma.document.count({ where: { status: "VERIFIED", companyId: activeCompanyId } }),
        prisma.applicant.count({ where: { isArchived: false, currentStage: "MEDICAL_WAITING", companyId: activeCompanyId } }),
        prisma.applicant.count({ where: { isArchived: false, currentStage: "MEDICAL_FIT", companyId: activeCompanyId } }),
        prisma.applicant.findMany({
          where: {
            isArchived: false,
            companyId: activeCompanyId,
            documents: {
              some: { status: "PENDING_VERIFICATION", companyId: activeCompanyId },
            },
          },
          select: {
            id: true,
            fullName: true,
            passportNumber: true,
            trade: true,
            documents: {
              where: { status: "PENDING_VERIFICATION", companyId: activeCompanyId },
              select: {
                id: true,
                documentType: true,
                fileName: true,
                status: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        }),
      ]);

      const pendingDocumentApplicants = pendingDocumentApplicantsRaw.map((app) => ({
        id: app.id,
        fullName: app.fullName,
        passportNumber: app.passportNumber,
        trade: app.trade,
        documents: app.documents.map((d) => ({
          id: d.id,
          documentType: d.documentType,
          fileName: d.fileName,
          status: d.status,
        })),
      }));

      return NextResponse.json({
        pendingDocumentCount,
        verifiedDocumentCount,
        medicalWaitingCount,
        medicalFitCount,
        pendingDocumentApplicants,
      });
    }

    // -------------------------------------------------------------
    // VISA OFFICER COHORT
    // -------------------------------------------------------------
    if (roleName === "Visa Officer") {
      const [
        visaSubmittedCount,
        visaStampedCount,
        visaRejectedCount,
        clearedForVisaCount,
        visaQueueRaw,
      ] = await Promise.all([
        prisma.applicant.count({ where: { isArchived: false, currentStage: "VISA_SUBMITTED", companyId: activeCompanyId } }),
        prisma.applicant.count({ where: { isArchived: false, currentStage: "VISA_STAMPED", companyId: activeCompanyId } }),
        prisma.applicant.count({ where: { isArchived: false, currentStage: "VISA_REJECTED", companyId: activeCompanyId } }),
        prisma.applicant.count({
          where: {
            isArchived: false,
            companyId: activeCompanyId,
            currentStage: { in: ["MEDICAL_FIT", "TRAINING_COMPLETED"] },
          },
        }),
        prisma.applicant.findMany({
          where: {
            isArchived: false,
            companyId: activeCompanyId,
            currentStage: { in: ["VISA_SUBMITTED", "VISA_STAMPED", "VISA_REJECTED"] },
          },
          select: {
            id: true,
            fullName: true,
            passportNumber: true,
            passportExpiry: true,
            currentStage: true,
            jobOrder: {
              select: {
                country: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        }),
      ]);

      const visaQueue = visaQueueRaw.map((app) => ({
        id: app.id,
        fullName: app.fullName,
        passportNumber: app.passportNumber,
        passportExpiry: app.passportExpiry.toISOString().split("T")[0],
        currentStage: app.currentStage,
        country: app.jobOrder?.country || "N/A",
      }));

      return NextResponse.json({
        visaSubmittedCount,
        visaStampedCount,
        visaRejectedCount,
        clearedForVisaCount,
        visaQueue,
      });
    }

    // -------------------------------------------------------------
    // ACCOUNTS OFFICER COHORT
    // -------------------------------------------------------------
    if (roleName === "Accounts Officer") {
      const [
        totalInvoicedAgg,
        totalCollectedAgg,
        totalOutstandingAgg,
        invoiceDueCount,
        pendingInvoicesRaw,
        accruedCommAgg,
        paidCommAgg,
      ] = await Promise.all([
        prisma.invoice.aggregate({ where: { companyId: activeCompanyId }, _sum: { amount: true } }),
        prisma.receipt.aggregate({ where: { companyId: activeCompanyId }, _sum: { amountPaid: true } }),
        prisma.invoice.aggregate({ where: { companyId: activeCompanyId }, _sum: { outstanding: true } }),
        prisma.invoice.count({
          where: {
            companyId: activeCompanyId,
            outstanding: { gt: 0 },
            dueDate: { lt: new Date() },
          },
        }),
        prisma.invoice.findMany({
          where: { companyId: activeCompanyId },
          orderBy: { createdAt: "desc" },
          include: {
            applicant: {
              select: {
                fullName: true,
              },
            },
          },
        }),
        prisma.commission.aggregate({ where: { status: "ACCRUED", companyId: activeCompanyId }, _sum: { amount: true } }),
        prisma.commission.aggregate({ where: { status: "PAID", companyId: activeCompanyId }, _sum: { amount: true } }),
      ]);

      const totalInvoiced = Number(totalInvoicedAgg._sum.amount || 0);
      const totalCollected = Number(totalCollectedAgg._sum.amountPaid || 0);
      const totalOutstanding = Number(totalOutstandingAgg._sum.outstanding || 0);
      const pendingCommissions = Number(accruedCommAgg._sum.amount || 0);
      const paidCommissions = Number(paidCommAgg._sum.amount || 0);

      const pendingInvoices = pendingInvoicesRaw.map((inv) => ({
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        applicantId: inv.applicant?.fullName || inv.applicantId,
        amount: Number(inv.amount),
        outstanding: Number(inv.outstanding),
        dueDate: inv.dueDate.toISOString().split("T")[0],
        description: inv.description,
        createdAt: inv.createdAt.toISOString().split("T")[0],
      }));

      return NextResponse.json({
        totalInvoiced,
        totalCollected,
        totalOutstanding,
        invoiceDueCount,
        pendingInvoices,
        pendingCommissions,
        paidCommissions,
      });
    }

    // -------------------------------------------------------------
    // sourcing agent cohort
    // -------------------------------------------------------------
    if (roleName === "Agent") {
      const agent = await prisma.agent.findFirst({
        where: { userId, companyId: activeCompanyId },
      });

      if (!agent) {
        return NextResponse.json({
          ownTotalApplicants: 0,
          ownActiveApplicants: 0,
          ownDeployedApplicants: 0,
          ownCommissionAccrued: 0,
          ownCommissionPaid: 0,
          ownApplicants: [],
        });
      }

      const agentId = agent.id;

      const [
        ownTotalApplicants,
        ownActiveApplicants,
        ownDeployedApplicants,
        accruedCommAgg,
        paidCommAgg,
        ownApplicantsRaw,
      ] = await Promise.all([
        prisma.applicant.count({ where: { agentId, companyId: activeCompanyId } }),
        prisma.applicant.count({ where: { agentId, isArchived: false, companyId: activeCompanyId } }),
        prisma.applicant.count({ where: { agentId, currentStage: "DEPLOYED", companyId: activeCompanyId } }),
        prisma.commission.aggregate({ where: { agentId, status: "ACCRUED", companyId: activeCompanyId }, _sum: { amount: true } }),
        prisma.commission.aggregate({ where: { agentId, status: "PAID", companyId: activeCompanyId }, _sum: { amount: true } }),
        prisma.applicant.findMany({
          where: { agentId, companyId: activeCompanyId },
          select: {
            id: true,
            fullName: true,
            passportNumber: true,
            trade: true,
            currentStage: true,
            isArchived: true,
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      const ownCommissionPaid = Number(paidCommAgg._sum.amount || 0);
      const ownCommissionAccrued = Number(accruedCommAgg._sum.amount || 0) + ownCommissionPaid;

      const ownApplicants = ownApplicantsRaw.map((app) => ({
        id: app.id,
        fullName: app.fullName,
        passportNumber: app.passportNumber,
        trade: app.trade,
        currentStage: app.currentStage,
        isArchived: app.isArchived,
      }));

      return NextResponse.json({
        ownTotalApplicants,
        ownActiveApplicants,
        ownDeployedApplicants,
        ownCommissionAccrued,
        ownCommissionPaid,
        ownApplicants,
      });
    }

    // fallback
    return NextResponse.json({ error: "Role not recognized." }, { status: 400 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }
    console.error("GET /api/reports/dashboard Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
