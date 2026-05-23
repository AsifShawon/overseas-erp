// src/app/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMockAuth } from "@/context/MockAuthContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable } from "@/components/shared/DataTable";
import { useT } from "@/i18n/useT";
import { formatDate, formatDateTime, formatNumber, formatCurrency } from "@/i18n/format";
import {
  WORKFLOW_LABELS,
  WorkflowStage,
} from "@/lib/mockData";
import {
  TrendingUp,
  AlertTriangle,
  History,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const { user, accessToken } = useMockAuth();
  const router = useRouter();
  const { t, locale } = useT();

  // If Applicant, redirect to their personal portal immediately
  useEffect(() => {
    if (user?.roleName === "Applicant") {
      router.push("/applicant/portal");
    }
  }, [user, router]);

  // Client states for live API data
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const res = await fetch("/api/reports/dashboard", {
        method: "GET",
        headers,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to load dashboard metrics.");
      }

      const payload = await res.json();
      setData(payload);
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "An unexpected error occurred while querying operations database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.roleName !== "Applicant") {
      fetchDashboardData();
    }
  }, [accessToken, user?.roleName]);

  if (user?.roleName === "Applicant") {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mx-auto"></div>
          <p className="text-xs text-slate-500">{t("dashboard.redirectingPortal")}</p>
        </div>
      </div>
    );
  }

  // State-of-the-art Loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title={t("dashboard.pageTitle")}
          description={t("dashboard.fetchingMetrics")}
          breadcrumbs={[{ label: "ERP Hub", href: "/dashboard" }, { label: t("nav.dashboard") }]}
        />
        <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-border-theme bg-surface p-5 shadow-sm space-y-4">
          <div className="relative h-12 w-12 rounded-2xl bg-surface border border-border-theme flex items-center justify-center shadow-lg animate-pulse">
            <Loader2 className="h-6 w-6 text-primary-theme animate-spin" />
          </div>
          <p className="text-xs text-text-soft font-bold animate-pulse">{t("common.loadingData")}</p>
        </div>
      </div>
    );
  }

  // State-of-the-art Error fallback
  if (error) {
    return (
      <div className="space-y-8">
        <PageHeader
          title={t("dashboard.pageTitle")}
          description="Service Connection Interrupted"
          breadcrumbs={[{ label: "ERP Hub", href: "/dashboard" }, { label: t("nav.dashboard") }]}
        />
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-rose-100 bg-rose-50/50 p-6 text-center shadow-sm dark:border-rose-950/10 dark:bg-rose-950/5 space-y-4">
          <AlertTriangle className="h-10 w-10 text-rose-500" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-rose-900 dark:text-rose-400">{t("dashboard.failedToLoad")}</h3>
            <p className="text-xs text-rose-700/80 dark:text-rose-400/70 max-w-md">{error}</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-sm"
          >
            {t("dashboard.retryBtn")}
          </button>
        </div>
      </div>
    );
  }

  // --- Live calculations destructured from DB response ---
  const {
    activeApplicants = 0,
    archivedApplicants = 0,
    totalAgents = 0,
    activeAgents = 0,
    totalJobOrders = 0,
    openJobOrders = 0,
    totalQuota = 0,
    allocatedQuota = 0,
    totalInvoiced = 0,
    totalCollected = 0,
    totalOutstanding = 0,
    passportExpiryWarnings = [],
    documentPendingCount = 0,
    jobOrders = [],
    appliedCount = 0,
    interviewedCount = 0,
    selectedCount = 0,
    recruitmentQueue = [],
    pendingDocumentCount = 0,
    verifiedDocumentCount = 0,
    medicalWaitingCount = 0,
    medicalFitCount = 0,
    pendingDocumentApplicants = [],
    visaSubmittedCount = 0,
    visaStampedCount = 0,
    visaRejectedCount = 0,
    clearedForVisaCount = 0,
    visaQueue = [],
    pendingInvoices = [],
    pendingCommissions = 0,
    paidCommissions = 0,
    ownTotalApplicants = 0,
    ownActiveApplicants = 0,
    ownDeployedApplicants = 0,
    ownCommissionAccrued = 0,
    ownCommissionPaid = 0,
    ownApplicants = [],
    totalPlacedCount = 0,
    stageCounts = {} as Record<string, number>,
    recentAuditLogs = [],
  } = data || {};

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("dashboard.pageTitle")}
        description={t("dashboard.pageDesc", { name: user.fullName })}
        breadcrumbs={[{ label: "ERP Hub", href: "/dashboard" }, { label: t("nav.dashboard") }]}
      />

      {/* ------------------ SUPER ADMIN DASHBOARD ------------------ */}
      {user.roleName === "Super Admin" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t("dashboard.activeCandidates")}
              value={formatNumber(activeApplicants, locale)}
              description={t("dashboard.softArchivedEntries", { count: formatNumber(archivedApplicants, locale) })}
              iconName="Users"
              trend={{ value: "8.5%", isPositive: true }}
            />
            <StatCard
              title={t("dashboard.jobOrdersOpen")}
              value={`${formatNumber(openJobOrders, locale)} / ${formatNumber(totalJobOrders, locale)}`}
              description={t("dashboard.quotasAllocated", { allocated: formatNumber(allocatedQuota, locale), total: formatNumber(totalQuota, locale) })}
              iconName="Briefcase"
            />
            <StatCard
              title={t("dashboard.accountsReceivable")}
              value={formatCurrency(totalOutstanding, "BDT", locale)}
              description={t("dashboard.totalBilled", { amount: formatCurrency(totalInvoiced, "BDT", locale) })}
              iconName="CreditCard"
              trend={{ value: "12%", isPositive: false }}
            />
            <StatCard
              title={t("dashboard.sourcingAgents")}
              value={t("dashboard.activeAgentsCount", { active: formatNumber(activeAgents, locale) })}
              description={t("dashboard.registeredTiers", { total: formatNumber(totalAgents, locale) })}
              iconName="UserCheck"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Pipeline Stage Summary */}
            <div className="lg:col-span-2 rounded-xl border border-border-theme bg-surface p-6 shadow-sm">
              <h3 className="text-sm font-bold text-text-theme mb-4 flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-primary-theme" /> {t("dashboard.pipelineStageDistribution")}
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {(["SELECTED", "MEDICAL_WAITING", "VISA_SUBMITTED", "DEPLOYED"] as WorkflowStage[]).map((stage) => {
                  const count = stageCounts[stage] || 0;
                  const label = t(`workflow.${stage}`) || WORKFLOW_LABELS[stage];
                  return (
                    <div key={stage} className="rounded-lg bg-surface-soft p-4 border border-border-theme">
                      <p className="text-[10px] font-semibold text-text-soft uppercase tracking-wider truncate">{label}</p>
                      <h4 className="mt-2 text-2xl font-bold text-text-theme">{formatNumber(count, locale)}</h4>
                      <p className="text-[9px] text-text-soft mt-1">{t("dashboard.candidatesInStage")}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Warning Widget */}
            <div className="rounded-xl border border-border-theme bg-surface p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-theme mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-amber-500" /> {t("dashboard.alertsWarnings")}
                </h3>
                <p className="text-xs text-text-soft">{t("dashboard.alertsDesc")}</p>
                <div className="mt-4 space-y-3">
                  {passportExpiryWarnings.length > 0 ? (
                    passportExpiryWarnings.map((app: any) => (
                      <div key={app.id} className="flex gap-2 rounded-lg bg-rose-50/50 p-2.5 border border-rose-100/50 dark:bg-rose-950/10 dark:border-rose-900/10">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0 animate-ping"></span>
                        <p className="text-[10px] text-rose-700 dark:text-rose-400">
                          {locale === "bn" ? (
                            <>আবেদনকারী <strong>{app.fullName}</strong>-এর পাসপোর্ট ({app.passportNumber}) মেয়াদ {app.passportExpiry}-এ শেষ হবে। জরুরি ব্যবস্থা প্রয়োজন।</>
                          ) : (
                            <>Candidate <strong>{app.fullName}</strong> passport ({app.passportNumber}) expires on {app.passportExpiry}. Urgent action required.</>
                          )}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="flex gap-2 rounded-lg bg-emerald-50/50 p-2.5 border border-emerald-100/50 dark:bg-emerald-950/10 dark:border-emerald-900/10">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                        {t("dashboard.noCriticalWarnings")}
                      </p>
                    </div>
                  )}

                  {documentPendingCount > 0 && (
                    <div className="flex gap-2 rounded-lg bg-amber-50/50 p-2.5 border border-amber-100/50 dark:bg-amber-950/10 dark:border-amber-900/10">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                      <p className="text-[10px] text-amber-700 dark:text-amber-400">
                        {t("dashboard.documentVerificationPending", { count: formatNumber(documentPendingCount, locale) })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border-theme flex justify-between items-center text-[10px] text-text-soft">
                <span>{t("dashboard.lastUpdatedJustNow")}</span>
                <span className="font-semibold text-primary-theme cursor-pointer">{t("dashboard.resolveAllBtn")}</span>
              </div>
            </div>
          </div>

          {/* Immutable Audit Logs widget */}
          <div className="rounded-xl border border-border-theme bg-surface p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-theme mb-4 flex items-center gap-2">
              <History className="h-4.5 w-4.5 text-primary-theme" /> {t("dashboard.recentSystemAudits")}
            </h3>
            <DataTable<any>
              data={recentAuditLogs}
              columns={[
                { header: t("auditLogs.tableHeaderTimestamp"), accessor: (log: any) => formatDateTime(log.timestamp, locale) },
                { header: t("auditLogs.tableHeaderStaff"), accessor: (log: any) => `${log.userId} (${t(`roles.${log.roleName}`) || log.roleName})` },
                { header: t("auditLogs.tableHeaderAction"), accessor: (log: any) => <span className="font-semibold text-text-theme">{log.actionType}</span> },
                { header: t("auditLogs.tableHeaderModule"), accessor: (log: any) => log.tableName },
                { header: t("auditLogs.tableHeaderRecord"), accessor: (log: any) => <span className="font-mono text-[10px] bg-bg-muted border border-border-theme px-1 py-0.5 rounded text-text-theme">{log.recordId}</span> },
                { header: t("auditLogs.tableHeaderIp"), accessor: (log: any) => log.ipAddress || "N/A" },
              ]}
              searchPlaceholder={t("dashboard.filterAuditTrailPlaceholder")}
              searchField="actionType"
              emptyStateTitle={t("common.noRecords")}
            />
          </div>
        </div>
      )}

      {/* ------------------ OPERATIONS ADMIN DASHBOARD ------------------ */}
      {user.roleName === "Operations Admin" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t("dashboard.allocatedQuotas")}
              value={`${formatNumber(allocatedQuota, locale)} ${locale === "bn" ? "টি পাঠানো হয়েছে" : "Placed"}`}
              description={t("dashboard.totalForeignSlots", { total: formatNumber(totalQuota, locale) })}
              iconName="Briefcase"
              trend={{ value: "4.8%", isPositive: true }}
            />
            <StatCard
              title={t("dashboard.candidatesUnderReview")}
              value={formatNumber(activeApplicants, locale)}
              description={t("dashboard.vettingComplianceFiles")}
              iconName="Users"
            />
            <StatCard
              title={t("dashboard.meanDeploymentTime")}
              value={locale === "bn" ? "২৮ দিন" : "28 Days"}
              description={t("dashboard.deploymentTimeDesc")}
              iconName="Clock"
            />
            <StatCard
              title={t("dashboard.activeAgentsRegistered")}
              value={`${formatNumber(activeAgents, locale)} / ${formatNumber(totalAgents, locale)}`}
              description={t("dashboard.externalPartners")}
              iconName="UserCheck"
            />
          </div>

          <div className="rounded-xl border border-border-theme bg-surface p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-theme mb-4">{t("dashboard.quotaUtilization")}</h3>
            {jobOrders.length > 0 ? (
              <div className="space-y-4">
                {jobOrders.map((jo: any) => {
                  const percentage = jo.totalQuota > 0 ? Math.round((jo.allocatedQuota / jo.totalQuota) * 100) : 0;
                  return (
                    <div key={jo.id} className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-text-theme">
                          {jo.employerName} - <span className="text-text-soft">{jo.trade} ({jo.country})</span>
                        </span>
                        <span className="text-text-muted">
                          {formatNumber(jo.allocatedQuota, locale)} / {formatNumber(jo.totalQuota, locale)} ({formatNumber(percentage, locale)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary-theme transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-text-soft">{t("dashboard.noJobOrders")}</p>
            )}
          </div>
        </div>
      )}

      {/* ------------------ HR OFFICER DASHBOARD ------------------ */}
      {user.roleName === "HR Officer" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t("dashboard.sourcedAndInterviewed")}
              value={formatNumber(appliedCount + interviewedCount, locale)}
              description={t("dashboard.awaitingForeignSelection")}
              iconName="Users"
            />
            <StatCard
              title={t("dashboard.foreignSelections")}
              value={formatNumber(selectedCount, locale)}
              description={t("dashboard.awaitingMedicalSchedules")}
              iconName="UserCheck"
            />
            <StatCard
              title={t("dashboard.openDemandsTrades")}
              value={formatNumber(openJobOrders, locale)}
              description={t("dashboard.activeForeignQuotas")}
              iconName="Briefcase"
            />
            <StatCard
              title={t("dashboard.totalCandidatesPlaced")}
              value={formatNumber(totalPlacedCount, locale)}
              description={t("dashboard.lifetimeRecruitments")}
              iconName="TrendingUp"
            />
          </div>

          <div className="rounded-xl border border-border-theme bg-surface p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-theme mb-4">{t("dashboard.urgentScreeningQueue")}</h3>
            <DataTable<any>
              data={recruitmentQueue}
              columns={[
                { header: t("applicants.tableHeaderName"), accessor: (a: any) => a.fullName },
                { header: t("applicants.tableHeaderPassport"), accessor: (a: any) => a.passportNumber },
                { header: t("applicants.tableHeaderTrade"), accessor: (a: any) => a.trade },
                { header: t("applicants.tableHeaderStage"), accessor: (a: any) => <StatusBadge status={a.currentStage} /> },
                { header: t("applicants.tableHeaderDate"), accessor: (a: any) => formatDate(a.createdAt, locale) },
              ]}
              searchPlaceholder={t("dashboard.filterQueuePlaceholder")}
              searchField="fullName"
            />
          </div>
        </div>
      )}

      {/* ------------------ DOCUMENTATION OFFICER DASHBOARD ------------------ */}
      {user.roleName === "Documentation Officer" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t("dashboard.pendingDocApprovals")}
              value={formatNumber(pendingDocumentCount, locale)}
              description={t("dashboard.awaitingVerificationSeal")}
              iconName="FileText"
              trend={{ value: "15%", isPositive: false }}
            />
            <StatCard
              title={t("dashboard.completedVerifications")}
              value={formatNumber(verifiedDocumentCount, locale)}
              description={t("dashboard.auditedComplianceRecords")}
              iconName="ShieldCheck"
            />
            <StatCard
              title={t("dashboard.pendingMedicalAppts")}
              value={formatNumber(medicalWaitingCount, locale)}
              description={t("dashboard.embassyApprovedLabs")}
              iconName="Clock"
            />
            <StatCard
              title={t("dashboard.medicalFit")}
              value={formatNumber(medicalFitCount, locale)}
              description={t("dashboard.passedBiometricClearance")}
              iconName="UserCheck"
            />
          </div>

          <div className="rounded-xl border border-border-theme bg-surface p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-theme mb-4">{t("dashboard.pendingVettingReviews")}</h3>
            {pendingDocumentApplicants.length > 0 ? (
              <div className="divide-y divide-border-theme">
                {pendingDocumentApplicants.map((app: any) => (
                  <div key={app.id} className="py-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-text-theme">{app.fullName}</h4>
                      <p className="text-[10px] text-text-soft">
                        {locale === "bn" ? "পাসপোর্ট" : "passport"}: {app.passportNumber} • {locale === "bn" ? "ট্রেড" : "Trade"}: {app.trade}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {app.documents.map((d: any) => (
                        <span key={d.id} className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-[9px] font-bold text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400">
                          {d.documentType} ({d.fileName})
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-soft py-2">{t("dashboard.noPendingReviews")}</p>
            )}
          </div>
        </div>
      )}

      {/* ------------------ VISA OFFICER DASHBOARD ------------------ */}
      {user.roleName === "Visa Officer" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t("dashboard.visaPacketsSent")}
              value={formatNumber(visaSubmittedCount, locale)}
              description={t("dashboard.awaitingConsulateStickers")}
              iconName="FileText"
            />
            <StatCard
              title={t("dashboard.visaStampsRecorded")}
              value={formatNumber(visaStampedCount, locale)}
              description={t("dashboard.stickerMatchesLocked")}
              iconName="UserCheck"
            />
            <StatCard
              title={t("dashboard.embassyRefusals")}
              value={formatNumber(visaRejectedCount, locale)}
              description={t("dashboard.appealsPipelineActive")}
              iconName="AlertTriangle"
            />
            <StatCard
              title={t("dashboard.awaitingEmbassyPackets")}
              value={formatNumber(clearedForVisaCount, locale)}
              description={t("dashboard.clearedConsulateSubmittal")}
              iconName="Clock"
            />
          </div>

          <div className="rounded-xl border border-border-theme bg-surface p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-theme mb-4">{t("dashboard.consulatePacketsList")}</h3>
            <DataTable<any>
              data={visaQueue}
              columns={[
                { header: t("documents.tableHeaderCandidate"), accessor: (a: any) => a.fullName },
                { header: t("applicants.tableHeaderPassport"), accessor: (a: any) => a.passportNumber },
                { header: t("jobOrders.tableHeaderCountry"), accessor: (a: any) => a.country },
                { header: t("applicants.tableHeaderStage"), accessor: (a: any) => <StatusBadge status={a.currentStage} /> },
                { header: t("applicants.formPassportExpiry"), accessor: (a: any) => formatDate(a.passportExpiry, locale) },
              ]}
              searchPlaceholder={t("dashboard.searchEmbassyStatusPlaceholder")}
              searchField="fullName"
            />
          </div>
        </div>
      )}

      {/* ------------------ ACCOUNTS OFFICER DASHBOARD ------------------ */}
      {user.roleName === "Accounts Officer" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t("dashboard.outstandingReceivables")}
              value={formatCurrency(totalOutstanding, "BDT", locale)}
              description={t("dashboard.activeInvoiceCollections")}
              iconName="CreditCard"
              trend={{ value: "10%", isPositive: false }}
            />
            <StatCard
              title={t("dashboard.totalFeesBilled")}
              value={formatCurrency(totalInvoiced, "BDT", locale)}
              description={t("dashboard.logisticsFees")}
              iconName="TrendingUp"
            />
            <StatCard
              title={t("dashboard.cashBalanceCollected")}
              value={formatCurrency(totalCollected, "BDT", locale)}
              description={t("dashboard.transfersAndReceipts")}
              iconName="UserCheck"
            />
            <StatCard
              title={t("dashboard.commissionsDue")}
              value={formatCurrency(pendingCommissions, "BDT", locale)}
              description={t("dashboard.paidCommissionsValue", { amount: formatCurrency(paidCommissions, "BDT", locale) })}
              iconName="Percent"
            />
          </div>

          <div className="rounded-xl border border-border-theme bg-surface p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-theme mb-4">{t("dashboard.pendingInvoiceLedgers")}</h3>
            <DataTable<any>
              data={pendingInvoices}
              columns={[
                { header: t("invoicesReceipts.tableHeaderInvoice"), accessor: (inv: any) => inv.invoiceNo },
                { header: t("documents.tableHeaderCandidate"), accessor: (inv: any) => inv.applicantId },
                { header: t("dashboard.totalFeesBilled"), accessor: (inv: any) => formatCurrency(inv.amount, "BDT", locale) },
                { header: t("invoicesReceipts.tableHeaderOutstanding"), accessor: (inv: any) => (
                  <span className={`font-semibold ${inv.outstanding > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {formatCurrency(inv.outstanding, "BDT", locale)}
                  </span>
                )},
                { header: t("invoicesReceipts.tableHeaderDueDate"), accessor: (inv: any) => formatDate(inv.dueDate, locale) },
              ]}
              searchPlaceholder={t("dashboard.searchInvoicesPlaceholder")}
              searchField="invoiceNo"
            />
          </div>
        </div>
      )}

      {/* ------------------ AGENT DASHBOARD ------------------ */}
      {user.roleName === "Agent" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t("dashboard.myCandidatesSourced")}
              value={formatNumber(ownTotalApplicants, locale)}
              description={t("dashboard.registrationsSubmitted")}
              iconName="Users"
            />
            <StatCard
              title={t("dashboard.activePipelines")}
              value={formatNumber(ownActiveApplicants - ownDeployedApplicants, locale)}
              description={t("dashboard.logisticsVisaProcessing")}
              iconName="Clock"
            />
            <StatCard
              title={t("dashboard.totalCommissionEarned")}
              value={formatCurrency(ownCommissionAccrued, "BDT", locale)}
              description={t("dashboard.allSubmittedCandidates")}
              iconName="Percent"
            />
            <StatCard
              title={t("dashboard.paidCommissions")}
              value={formatCurrency(ownCommissionPaid, "BDT", locale)}
              description={t("dashboard.clearedToBank")}
              iconName="UserCheck"
            />
          </div>

          <div className="rounded-xl border border-border-theme bg-surface p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-theme mb-4">{t("dashboard.mySourcedCandidates")}</h3>
            <DataTable<any>
              data={ownApplicants}
              columns={[
                { header: t("applicants.tableHeaderName"), accessor: (a: any) => a.fullName },
                { header: t("applicants.tableHeaderPassport"), accessor: (a: any) => a.passportNumber },
                { header: t("applicants.tableHeaderTrade"), accessor: (a: any) => a.trade },
                { header: t("applicants.tableHeaderStage"), accessor: (a: any) => <StatusBadge status={a.currentStage} /> },
                { header: t("agents.tableHeaderStatus"), accessor: (a: any) => a.isArchived ? <span className="text-rose-600 font-semibold">{t("statuses.CANCELLED")}</span> : <span className="text-emerald-600 font-semibold">{t("statuses.ACTIVE")}</span> },
              ]}
              searchPlaceholder={t("dashboard.filterCandidatesPlaceholder")}
              searchField="fullName"
            />
          </div>
        </div>
      )}
    </div>
  );
}
