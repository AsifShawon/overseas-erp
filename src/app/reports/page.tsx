"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { useMockAuth } from "@/context/MockAuthContext";
import { useToast } from "@/context/ToastContext";
import { Clock, FileSpreadsheet, Globe2, Loader2, AlertCircle } from "lucide-react";
import { useT } from "@/i18n/useT";
import { formatNumber } from "@/i18n/format";

export default function ReportsPage() {
  const { accessToken } = useMockAuth();
  const toast = useToast();
  const { t, locale } = useT();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const res = await fetch("/api/reports/dashboard?type=operations", {
        method: "GET",
        headers,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to load report data.");
      }

      const reportData = await res.json();
      setData(reportData);
    } catch (err: any) {
      console.error("Error fetching reports dashboard:", err);
      setError(err.message || "An unexpected error occurred while loading reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchReportData();
    }
  }, [accessToken]);

  const handleExport = () => {
    if (!data) {
      toast.error(locale === "bn" ? "রিপোর্ট ডেটা এখনও প্রস্তুত নয়।" : "Report data is not loaded yet.");
      return;
    }

    setExporting(true);

    try {
      const headers = [
        "VisaTek ERP - Operations & Manpower Report",
        `Generated Date: ${new Date().toISOString().split("T")[0]}`
      ];

      const rows: any[][] = [
        [],
        ["I. EXECUTIVE KEY METRICS SUMMARY"],
        ["Metric Title", "Current Value", "Metric Focus"],
        ["Total Active Candidates", `${data.activeApplicants || 0}`, "Placed/Pipeline applicants"],
        ["Soft-Archived Candidates", `${data.archivedApplicants || 0}`, "Inactive dossiers"],
        ["Total Quota Capacity", `${data.totalQuota || 0}`, "Consulate approved slots"],
        ["Allocated Quota (Filled)", `${data.allocatedQuota || 0}`, "Assigned candidate slots"],
        ["Quota Utilization Rate", `${Math.round(((data.allocatedQuota || 0) / (data.totalQuota || 1)) * 100)}%`, "Filled slots percentage"],
        ["Total Invoice Billings", `${(data.totalInvoiced || 0).toFixed(2)} BDT`, "Gross package value billed"],
        ["Total Cash Collected", `${(data.totalCollected || 0).toFixed(2)} BDT`, "Total client cash collected"],
        ["Total Accounts Receivable", `${(data.totalOutstanding || 0).toFixed(2)} BDT`, "Uncollected invoices balance"],
        ["Outstanding Collection Rate", `${Math.round(((data.totalCollected || 0) / (data.totalInvoiced || 1)) * 100)}%`, "Percentage of billed cash collected"],
        ["Total Partner Sourcing Agents", `${data.totalAgents || 0}`, "Agency channels registered"],
        ["Active Sourcing Agents", `${data.activeAgents || 0}`, "Partners currently supplying labor"],
        [],
        ["II. PIPELINE WORKFLOW & BOTTLENECK ANALYSIS"],
        ["Workflow Stage", "Active Candidates Count", "Avg. Processing Time", "Bottleneck Priority"],
        ["Sourcing & Pre-Selection", `${data.stageCounts?.APPLIED || 0}`, `${data.avgSourcingDays ?? 4.5} Days`, "Low Priority"],
        ["Consulate Approved Labs (Medical)", `${(data.stageCounts?.MEDICAL_WAITING || 0) + (data.stageCounts?.MEDICAL_FIT || 0)}`, `${data.avgMedicalDays ?? 6.2} Days`, "Low Priority"],
        ["Government Attestation Vetting", `${data.stageCounts?.TRAINING_COMPLETED || 0}`, `${data.avgVettingDays ?? 8.1} Days`, "Medium Priority"],
        ["Embassy Visa Sticker Processing", `${(data.stageCounts?.VISA_SUBMITTED || 0) + (data.stageCounts?.VISA_STAMPED || 0) + (data.stageCounts?.VISA_REJECTED || 0)}`, `${data.avgVisaDays ?? 14.5} Days`, "High Priority"],
        ["Aviation Flight Ticket Issuance", `${(data.stageCounts?.TICKETED || 0) + (data.stageCounts?.DEPLOYED || 0)}`, `${data.avgFlightDays ?? 3.2} Days`, "Low Priority"],
        [],
        ["III. FOREIGN EMPLOYERS & JOB ORDERS REGISTRY"],
        ["Order Number", "Employer Name", "Country", "Trade", "Monthly Salary", "Total Quota", "Allocated Quota", "Remaining Quota", "Fill Rate (%)", "Status"]
      ];

      if (data.jobOrders && data.jobOrders.length > 0) {
        data.jobOrders.forEach((jo: any) => {
          const remaining = Math.max(0, jo.totalQuota - jo.allocatedQuota);
          const fillRate = Math.round((jo.allocatedQuota / (jo.totalQuota || 1)) * 100);
          rows.push([
            jo.orderNumber,
            jo.employerName,
            jo.country,
            jo.trade,
            `${jo.salary.toFixed(2)}`,
            `${jo.totalQuota}`,
            `${jo.allocatedQuota}`,
            `${remaining}`,
            `${fillRate}%`,
            jo.status
          ]);
        });
      } else {
        rows.push(["No Job Orders seeded in active workspace database."]);
      }

      // Section IV: Sourcing Partners performance details
      rows.push([]);
      rows.push(["IV. PARTNER SOURCING AGENTS PERFORMANCE REGISTRY"]);
      rows.push(["Agent Code", "Agency Name", "Lead Representative", "Active Candidates", "Commission Accrued (BDT)", "Commission Paid (BDT)", "Commission Outstanding (BDT)"]);
      
      if (data.agentsReport && data.agentsReport.length > 0) {
        data.agentsReport.forEach((agt: any) => {
          rows.push([
            agt.agentCode,
            agt.agencyName,
            agt.fullName,
            `${agt.activeCandidates}`,
            `${agt.commissionAccrued.toFixed(2)}`,
            `${agt.commissionPaid.toFixed(2)}`,
            `${agt.commissionOutstanding.toFixed(2)}`
          ]);
        });
      } else {
        rows.push(["No sourcing partners registered in this company workspace."]);
      }

      // Convert to CSV using a safe Blob URL
      const csvText = [
        headers.join(","),
        ...rows.map(e => e.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(","))
      ].join("\r\n");

      const blob = new Blob(["\uFEFF" + csvText], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `operations_analytical_report_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(locale === "bn" ? "অপারেশনস রিপোর্ট সফলভাবে এক্সপোর্ট করা হয়েছে!" : "Operations report exported successfully!");
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error(locale === "bn" ? "রিপোর্ট এক্সপোর্ট করার সময় একটি ত্রুটি ঘটেছে।" : "Failed to compile and export report.");
    } finally {
      setExporting(false);
    }
  };

  const totalQuota = data?.totalQuota || 0;
  const allocatedQuota = data?.allocatedQuota || 0;
  const quotaFillPercent = totalQuota > 0 ? Math.round((allocatedQuota / totalQuota) * 100) : 0;
  const stageCounts = data?.stageCounts || {};

  const bottleneckStages = [
    { stageKey: "stageSourcing", count: stageCounts["APPLIED"] || 0, days: data?.avgSourcingDays ?? 4.5, bottleneck: "Low" },
    { stageKey: "stageMedical", count: (stageCounts["MEDICAL_WAITING"] || 0) + (stageCounts["MEDICAL_FIT"] || 0), days: data?.avgMedicalDays ?? 6.2, bottleneck: "Low" },
    { stageKey: "stageVetting", count: stageCounts["TRAINING_COMPLETED"] || 0, days: data?.avgVettingDays ?? 8.1, bottleneck: "Medium" },
    { stageKey: "stageVisa", count: (stageCounts["VISA_SUBMITTED"] || 0) + (stageCounts["VISA_STAMPED"] || 0) + (stageCounts["VISA_REJECTED"] || 0), days: data?.avgVisaDays ?? 14.5, bottleneck: "High" },
    { stageKey: "stageFlight", count: (stageCounts["TICKETED"] || 0) + (stageCounts["DEPLOYED"] || 0), days: data?.avgFlightDays ?? 3.2, bottleneck: "Low" },
  ];

  const grossMarginVal = data?.totalInvoiced > 0
    ? Math.max(0, Math.min(100, Math.round(((data.totalInvoiced - (data.totalCommissionAccrued || 0)) / data.totalInvoiced) * 1000) / 10))
    : 34.8;

  const avgVisaDaysVal = data?.avgVisaDays ?? 14.5;
  const regulatoryClearanceVal = data?.regulatoryClearanceRate ?? 98.2;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 rounded-xl border border-border-theme bg-surface shadow-sm space-y-4">
        <Loader2 className="h-8 w-8 text-primary-theme animate-spin" />
        <p className="text-xs text-text-soft font-bold animate-pulse">
          {locale === "bn" ? "অপারেশনস ও অ্যানালিটিক্যাল রিপোর্ট লোড হচ্ছে..." : "Loading operations & analytical reports..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-rose-100 bg-rose-50/50 p-6 text-center shadow-sm dark:border-rose-950/10 dark:bg-rose-950/5 space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-500" />
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-rose-900 dark:text-rose-400">
            {locale === "bn" ? "রিপোর্ট লোড করতে ব্যর্থ" : "Failed to Load Operations Report"}
          </h3>
          <p className="text-xs text-rose-700/80 dark:text-rose-400/70 max-w-md">{error}</p>
        </div>
        <button
          onClick={fetchReportData}
          className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-sm cursor-pointer"
        >
          {t("dashboard.retryBtn")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PermissionGate permission="VIEW_REPORTS" showFallback={true} fallbackMessage={t("reports.accessDenied")}>
        <PageHeader
          title={t("reports.pageTitle")}
          description={t("reports.pageDesc")}
          breadcrumbs={[{ label: t("nav.dashboard"), href: "/dashboard" }, { label: t("nav.reports") }]}
          actions={
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 cursor-pointer disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>{locale === "bn" ? "প্রস্তুত হচ্ছে..." : "Exporting..."}</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>{t("reports.exportReportBtn")}</span>
                </>
              )}
            </button>
          }
        />

        {/* Aggregate Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t("reports.quotaFillRate")}
            value={`${formatNumber(quotaFillPercent, locale)}%`}
            description={t("reports.quotaFillDesc", {
              allocated: formatNumber(allocatedQuota, locale),
              total: formatNumber(totalQuota, locale),
            })}
            iconName="Briefcase"
          />
          <StatCard
            title={t("reports.sourcedGrossMargin")}
            value={`${formatNumber(grossMarginVal, locale)}%`}
            description={t("reports.netProfitDesc")}
            iconName="TrendingUp"
            trend={{ value: `${formatNumber(1.2, locale)}%`, isPositive: true }}
          />
          <StatCard
            title={t("reports.consulateProcessingCycle")}
            value={t("reports.days", { days: formatNumber(avgVisaDaysVal, locale) })}
            description={t("reports.embassyBottleneckDesc")}
            iconName="Clock"
            trend={{ value: t("reports.days", { days: formatNumber(2, locale) }), isPositive: false }}
          />
          <StatCard
            title={t("reports.regulatoryClearances")}
            value={`${formatNumber(regulatoryClearanceVal, locale)}%`}
            description={t("reports.emigrantClearanceDesc")}
            iconName="ShieldCheck"
          />
        </div>

        {/* Bottleneck analysis grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Bottleneck Analysis */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-200 dark:bg-slate-950">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Clock className="h-4.5 w-4.5 text-indigo-500" /> {t("reports.bottleneckAnalysis")}
            </h3>
            <div className="space-y-4">
              {bottleneckStages.map((b, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {t(`reports.${b.stageKey}` as any)}
                      <span className="ml-2 font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                        {locale === "bn" ? `${formatNumber(b.count, locale)} জন` : `${b.count} candidates`}
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400">{t("reports.meanDuration")}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {t("reports.days", { days: formatNumber(b.days, locale) })}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      b.bottleneck === "High" ? "bg-rose-50 text-rose-700 border border-rose-100" : b.bottleneck === "Medium" ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    }`}>
                      {t("reports.priorityLevel", { level: t(`reports.priority${b.bottleneck}` as any) })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quota Sourced Geography */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-200 dark:bg-slate-950">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Globe2 className="h-4.5 w-4.5 text-indigo-500" /> {t("reports.geographyShare")}
            </h3>
            <div className="space-y-4">
              {(data?.geographyShare || []).map((geo: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{geo.country}</span>
                    <span className="font-bold text-slate-950 dark:text-white">
                      {t("reports.sharePercent", { percent: formatNumber(geo.percent, locale) })}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${geo.percent}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PermissionGate>
    </div>
  );
}
