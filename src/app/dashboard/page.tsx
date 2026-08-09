// src/app/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMockAuth } from "@/context/MockAuthContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable } from "@/components/shared/DataTable";
import { ChartCard } from "@/components/ui/ChartCard";
import { BarChart } from "@/components/charts/BarChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { CHART_SEMANTIC, chartColor } from "@/components/charts/chart-theme";
import { AppCard, AppCardHeader } from "@/components/ui/AppCard";
import { AppButton } from "@/components/ui/AppButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ErrorPanel } from "@/components/ui/PageState";
import { MetricCardSkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { useT } from "@/i18n/useT";

import { formatDate, formatDateTime, formatNumber, formatCurrency } from "@/i18n/format";
import {
  WORKFLOW_LABELS,
  WorkflowStage,
} from "@/lib/mockData";
import {
  AlertTriangle,
  History,
  RefreshCw,
  ShieldCheck,
  Clock,
} from "lucide-react";

/** Row shapes returned by /api/reports/dashboard for the executive cohort. */
interface AuditLogRow {
  id: string;
  userId: string;
  roleName: string;
  actionType: string;
  tableName: string;
  recordId: string;
  timestamp: string;
}

interface PassportWarningRow {
  id: string;
  fullName: string;
  passportNumber: string;
  passportExpiry: string;
}

interface JobOrderRow {
  id: string;
  employerName: string;
  country: string;
  trade: string;
  totalQuota: number;
  allocatedQuota: number;
}

interface GeographyRow {
  country: string;
  percent: number;
  allocated: number;
}

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
        <p className="text-xs text-text-soft">{t("dashboard.redirectingPortal")}</p>
      </div>
    );
  }

  const pageHeader = (
    <PageHeader
      title={t("dashboard.pageTitle")}
      description={t("dashboard.pageDesc", { name: user?.fullName || "" })}
      actions={
        !loading && !error ? (
          <AppButton variant="secondary" size="sm" onClick={fetchDashboardData}>
            <RefreshCw className="h-3.5 w-3.5" />
            {locale === "bn" ? "রিফ্রেশ" : "Refresh"}
          </AppButton>
        ) : undefined
      }
    />
  );

  // Skeletons mirror the real dashboard structure rather than a full-page spinner.
  if (loading) {
    return (
      <div className="space-y-5">
        {pageHeader}
        <MetricCardSkeleton count={4} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ChartSkeleton />
          </div>
          <ChartSkeleton />
        </div>
        <TableSkeleton rows={5} columns={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        {pageHeader}
        <ErrorPanel
          title={t("dashboard.failedToLoad")}
          message={error}
          onRetry={fetchDashboardData}
          retryLabel={t("dashboard.retryBtn")}
        />
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
    geographyShare = [],
    avgSourcingDays = 0,
    avgMedicalDays = 0,
    avgVettingDays = 0,
    avgVisaDays = 0,
    avgFlightDays = 0,
  } = data || {};

  const stageLabel = (stage: string) => {
    const translated = t(`workflow.${stage}`);
    return translated !== `workflow.${stage}`
      ? translated
      : WORKFLOW_LABELS[stage as WorkflowStage] || stage;
  };

  /*
   * Pipeline distribution across the whole workflow — every stage the API
   * reports, rather than a hand-picked four. Values come straight from
   * stageCounts; nothing here is synthesised.
   */
  const PIPELINE_STAGES: WorkflowStage[] = [
    "APPLIED",
    "INTERVIEWED",
    "SELECTED",
    "MEDICAL_WAITING",
    "MEDICAL_FIT",
    "TRAINING_COMPLETED",
    "VISA_SUBMITTED",
    "VISA_STAMPED",
    "TICKETED",
    "DEPLOYED",
  ];

  const stageBarChartData = PIPELINE_STAGES.map((stage, idx) => ({
    label: stageLabel(stage),
    value: stageCounts[stage] || 0,
    color: chartColor(idx),
  }));

  const collectionsDonutData = [
    {
      name: locale === "bn" ? "আদায়কৃত" : "Collected",
      value: totalCollected,
      color: CHART_SEMANTIC.success,
    },
    {
      name: locale === "bn" ? "বকেয়া" : "Outstanding",
      value: totalOutstanding,
      color: CHART_SEMANTIC.danger,
    },
  ];

  /*
   * Average days per stage, computed server-side from real workflow history.
   * Replaces the previously hardcoded "28 Days" / "8.5%" style figures.
   */
  const cycleTimeData = [
    { label: locale === "bn" ? "সোর্সিং" : "Sourcing", value: Number(avgSourcingDays) },
    { label: locale === "bn" ? "মেডিকেল" : "Medical", value: Number(avgMedicalDays) },
    { label: locale === "bn" ? "ভেটিং" : "Vetting", value: Number(avgVettingDays) },
    { label: locale === "bn" ? "ভিসা" : "Visa", value: Number(avgVisaDays) },
    { label: locale === "bn" ? "ফ্লাইট" : "Flight", value: Number(avgFlightDays) },
  ].filter((d) => d.value > 0);

  /*
   * End-to-end pipeline duration = sum of the per-stage averages the API
   * computes from real workflow transition history.
   */
  const totalPipelineDays = Math.round(
    cycleTimeData.reduce((sum, d) => sum + d.value, 0)
  );

  const quotaFillPct =
    totalQuota > 0 ? Math.round((allocatedQuota / totalQuota) * 100) : 0;
  const collectionPct =
    totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

  const isExecutiveView =
    user.roleName === "Super Admin" ||
    user.roleName === "Platform Admin" ||
    user.isPlatformAdmin;

  return (
    <div className="space-y-5">
      {isExecutiveView && pageHeader}

      {/* ================= SUPER ADMIN & PLATFORM ADMIN ================= */}
      {isExecutiveView && (
        <div className="space-y-5">
          {/*
            LEVEL 1 — needs action now.
            Rendered before any passive metric so blockers are seen first.
          */}
          {(passportExpiryWarnings.length > 0 || documentPendingCount > 0) && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <AppCard className="lg:col-span-2" padding="none">
                <div className="p-4">
                  <AppCardHeader
                    icon={AlertTriangle}
                    title={t("dashboard.alertsWarnings")}
                    subtitle={t("dashboard.alertsDesc")}
                  />
                  <ul className="mt-3 space-y-2">
                    {passportExpiryWarnings.map((app: PassportWarningRow) => (
                      <li
                        key={app.id}
                        className="flex items-start gap-2.5 rounded-md border border-danger-theme/20 bg-danger-soft px-3 py-2"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger-theme"
                        />
                        <p className="text-xs leading-relaxed text-danger-theme">
                          {locale === "bn" ? (
                            <>
                              <strong>{app.fullName}</strong>-এর পাসপোর্ট (
                              <span className="font-mono">{app.passportNumber}</span>) মেয়াদ
                              শেষ হবে {formatDate(app.passportExpiry, locale)} তারিখে।
                            </>
                          ) : (
                            <>
                              <strong>{app.fullName}</strong> passport{" "}
                              <span className="font-mono">{app.passportNumber}</span> expires{" "}
                              {formatDate(app.passportExpiry, locale)}.
                            </>
                          )}
                        </p>
                      </li>
                    ))}
                    {documentPendingCount > 0 && (
                      <li className="flex items-start gap-2.5 rounded-md border border-warning-theme/20 bg-warning-soft px-3 py-2">
                        <span
                          aria-hidden="true"
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning-theme"
                        />
                        <p className="text-xs leading-relaxed text-warning-theme">
                          {t("dashboard.documentVerificationPending", {
                            count: formatNumber(documentPendingCount, locale),
                          })}
                        </p>
                      </li>
                    )}
                  </ul>
                </div>
                <div className="flex items-center justify-end border-t border-border-theme px-4 py-2.5">
                  <AppButton
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/documents")}
                  >
                    {locale === "bn" ? "ডকুমেন্ট সারিতে যান" : "Go to document queue"}
                  </AppButton>
                </div>
              </AppCard>

              {/* Quota + collection health at a glance */}
              <AppCard>
                <AppCardHeader
                  icon={ShieldCheck}
                  title={locale === "bn" ? "পরিচালন স্বাস্থ্য" : "Operational Health"}
                />
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-text-muted">
                        {locale === "bn" ? "কোটা পূরণ" : "Quota filled"}
                      </span>
                      <span className="text-xs font-semibold text-text-theme tabular-nums-ui">
                        {formatNumber(allocatedQuota, locale)} /{" "}
                        {formatNumber(totalQuota, locale)} ({formatNumber(quotaFillPct, locale)}%)
                      </span>
                    </div>
                    <ProgressBar
                      className="mt-2"
                      value={quotaFillPct}
                      tone="auto"
                      label={locale === "bn" ? "কোটা পূরণ" : "Quota filled"}
                    />
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-text-muted">
                        {locale === "bn" ? "আদায়ের হার" : "Collection rate"}
                      </span>
                      <span className="text-xs font-semibold text-text-theme tabular-nums-ui">
                        {formatNumber(collectionPct, locale)}%
                      </span>
                    </div>
                    <ProgressBar
                      className="mt-2"
                      value={collectionPct}
                      tone={collectionPct >= 70 ? "success" : "warning"}
                      label={locale === "bn" ? "আদায়ের হার" : "Collection rate"}
                    />
                  </div>
                </div>
              </AppCard>
            </div>
          )}

          {/* LEVEL 2 — operational status KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t("dashboard.activeCandidates")}
              value={formatNumber(activeApplicants, locale)}
              description={t("dashboard.softArchivedEntries", {
                count: formatNumber(archivedApplicants, locale),
              })}
              iconName="Users"
              variant="default"
            />
            <StatCard
              title={t("dashboard.jobOrdersOpen")}
              value={`${formatNumber(openJobOrders, locale)} / ${formatNumber(totalJobOrders, locale)}`}
              description={t("dashboard.quotasAllocated", {
                allocated: formatNumber(allocatedQuota, locale),
                total: formatNumber(totalQuota, locale),
              })}
              iconName="Briefcase"
              variant="info"
            />
            <StatCard
              title={t("dashboard.accountsReceivable")}
              value={formatCurrency(totalOutstanding, "BDT", locale)}
              description={t("dashboard.totalBilled", {
                amount: formatCurrency(totalInvoiced, "BDT", locale),
              })}
              iconName="CreditCard"
              variant="warning"
            />
            <StatCard
              title={t("dashboard.sourcingAgents")}
              value={t("dashboard.activeAgentsCount", {
                active: formatNumber(activeAgents, locale),
              })}
              description={t("dashboard.registeredTiers", {
                total: formatNumber(totalAgents, locale),
              })}
              iconName="UserCheck"
              variant="success"
            />
          </div>

          {/* Primary analytics: pipeline distribution + collections split */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard
              title={t("dashboard.pipelineStageDistribution")}
              subtitle={
                locale === "bn"
                  ? "প্রতিটি ধাপে বর্তমানে থাকা সক্রিয় প্রার্থী সংখ্যা"
                  : "Active candidates currently sitting at each stage"
              }
              className="lg:col-span-2"
            >
              <BarChart data={stageBarChartData} height={250} />
            </ChartCard>

            <ChartCard
              title={locale === "bn" ? "বিলিং ও কালেকশন" : "Collections & Receivables"}
              subtitle={
                locale === "bn"
                  ? "মোট ইনভয়েসকৃত ফি বনাম বকেয়া"
                  : "Invoiced fees against outstanding balance"
              }
            >
              <DonutChart data={collectionsDonutData} height={250} />
            </ChartCard>
          </div>

          {/* Cycle time + quota utilisation */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {cycleTimeData.length > 0 && (
              <ChartCard
                title={locale === "bn" ? "গড় প্রক্রিয়াকরণ সময়" : "Average Stage Duration"}
                subtitle={
                  locale === "bn"
                    ? "প্রকৃত ওয়ার্কফ্লো ইতিহাস থেকে গণনাকৃত (দিনে)"
                    : "Days per stage, computed from actual workflow history"
                }
              >
                <BarChart data={cycleTimeData} height={220} />
              </ChartCard>
            )}

            <AppCard>
              <AppCardHeader
                icon={Clock}
                title={t("dashboard.quotaUtilization")}
                subtitle={
                  locale === "bn"
                    ? "খোলা ডিমান্ড অনুযায়ী স্লট পূরণের অগ্রগতি"
                    : "Slot fill progress across open demands"
                }
              />
              {jobOrders.length > 0 ? (
                <ul className="mt-4 space-y-3.5">
                  {jobOrders.slice(0, 5).map((jo: JobOrderRow) => {
                    const pct =
                      jo.totalQuota > 0
                        ? Math.round((jo.allocatedQuota / jo.totalQuota) * 100)
                        : 0;
                    return (
                      <li key={jo.id}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="min-w-0 truncate text-xs font-medium text-text-theme">
                            {jo.trade}
                            <span className="ml-1.5 font-normal text-text-soft">
                              {jo.employerName} · {jo.country}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs text-text-muted tabular-nums-ui">
                            {formatNumber(jo.allocatedQuota, locale)}/
                            {formatNumber(jo.totalQuota, locale)}
                          </span>
                        </div>
                        <ProgressBar className="mt-1.5" value={pct} tone="auto" size="sm" />
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-4 text-xs text-text-soft">{t("dashboard.noJobOrders")}</p>
              )}
            </AppCard>
          </div>

          {/* Deployment geography — real allocation share from the API */}
          {geographyShare.length > 0 && (
            <AppCard>
              <AppCardHeader
                title={locale === "bn" ? "গন্তব্য দেশ বন্টন" : "Destination Distribution"}
                subtitle={
                  locale === "bn"
                    ? "বরাদ্দকৃত কোটার ভিত্তিতে দেশভিত্তিক অংশ"
                    : "Share of allocated quota by destination country"
                }
              />
              <ul className="mt-4 space-y-3">
                {geographyShare.slice(0, 6).map((g: GeographyRow, idx: number) => (
                  <li key={g.country}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-xs font-medium text-text-theme">
                        {g.country}
                      </span>
                      <span className="shrink-0 text-xs text-text-muted tabular-nums-ui">
                        {formatNumber(g.percent, locale)}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${g.percent}%`, backgroundColor: chartColor(idx) }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </AppCard>
          )}

          {/* LEVEL 3 — historical / audit */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-text-soft" />
              <h2 className="text-sm font-semibold text-text-theme">
                {t("dashboard.recentSystemAudits")}
              </h2>
            </div>
            <DataTable<AuditLogRow>
              data={recentAuditLogs}
              rowKey={(log: AuditLogRow, i: number) => log.id || String(i)}
              columns={[
                {
                  header: t("auditLogs.tableHeaderTimestamp"),
                  accessor: (log: AuditLogRow) => (
                    <span className="whitespace-nowrap text-text-muted">
                      {formatDateTime(log.timestamp, locale)}
                    </span>
                  ),
                },
                {
                  header: t("auditLogs.tableHeaderStaff"),
                  accessor: (log: AuditLogRow) => (
                    <div className="min-w-0">
                      <div className="truncate font-medium text-text-theme">{log.userId}</div>
                      <div className="truncate text-[11px] text-text-soft">
                        {t(`roles.${log.roleName}`) || log.roleName}
                      </div>
                    </div>
                  ),
                  primary: true,
                },
                {
                  header: t("auditLogs.tableHeaderAction"),
                  accessor: (log: AuditLogRow) => (
                    <span className="font-medium text-text-theme">{log.actionType}</span>
                  ),
                },
                {
                  header: t("auditLogs.tableHeaderModule"),
                  accessor: (log: AuditLogRow) => log.tableName,
                  hideOnMobile: true,
                },
                {
                  header: t("auditLogs.tableHeaderRecord"),
                  accessor: (log: AuditLogRow) => (
                    <span className="font-mono text-[11px] text-text-soft">{log.recordId}</span>
                  ),
                  hideOnMobile: true,
                },
              ]}
              searchPlaceholder={t("dashboard.filterAuditTrailPlaceholder")}
              searchField="actionType"
              emptyStateTitle={t("common.noRecords")}
              pageSize={6}
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
            />
            <StatCard
              title={t("dashboard.candidatesUnderReview")}
              value={formatNumber(activeApplicants, locale)}
              description={t("dashboard.vettingComplianceFiles")}
              iconName="Users"
            />
            <StatCard
              title={t("dashboard.meanDeploymentTime")}
              value={
                totalPipelineDays > 0
                  ? `${formatNumber(totalPipelineDays, locale)} ${
                      locale === "bn" ? "দিন" : "Days"
                    }`
                  : "—"
              }
              description={
                totalPipelineDays > 0
                  ? t("dashboard.deploymentTimeDesc")
                  : locale === "bn"
                    ? "পর্যাপ্ত ওয়ার্কফ্লো ইতিহাস নেই"
                    : "Not enough workflow history yet"
              }
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
                        <span key={d.id} className="inline-flex items-center gap-1 rounded-sm border border-warning-theme/25 bg-warning-soft px-2 py-1 text-[10px] font-medium text-warning-theme">
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
                  <span className={`font-semibold ${inv.outstanding > 0 ? "text-danger-theme" : "text-success-theme"}`}>
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
                { header: t("agents.tableHeaderStatus"), accessor: (a: any) => a.isArchived ? <span className="font-medium text-danger-theme">{t("statuses.CANCELLED")}</span> : <span className="font-medium text-success-theme">{t("statuses.ACTIVE")}</span> },
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
