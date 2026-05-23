"use client";

import React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { MOCK_JOB_ORDERS } from "@/lib/mockData";
import { Clock, FileSpreadsheet, Globe2 } from "lucide-react";
import { useT } from "@/i18n/useT";
import { formatNumber } from "@/i18n/format";

export default function ReportsPage() {
  const { t, locale } = useT();
  const totalQuota = MOCK_JOB_ORDERS.reduce((acc, jo) => acc + jo.totalQuota, 0);
  const allocatedQuota = MOCK_JOB_ORDERS.reduce((acc, jo) => acc + jo.allocatedQuota, 0);
  
  // Bottleneck mock times
  const bottleneckStages = [
    { stageKey: "stageSourcing", days: 4.5, bottleneck: "Low" },
    { stageKey: "stageMedical", days: 6.2, bottleneck: "Low" },
    { stageKey: "stageVetting", days: 8.1, bottleneck: "Medium" },
    { stageKey: "stageVisa", days: 14.5, bottleneck: "High" },
    { stageKey: "stageFlight", days: 3.2, bottleneck: "Low" },
  ];

  return (
    <div className="space-y-6">
      <PermissionGate permission="VIEW_REPORTS" showFallback={true} fallbackMessage={t("reports.accessDenied")}>
        <PageHeader
          title={t("reports.pageTitle")}
          description={t("reports.pageDesc")}
          breadcrumbs={[{ label: t("nav.dashboard"), href: "/dashboard" }, { label: t("nav.reports") }]}
          actions={
            <button className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500">
              <FileSpreadsheet className="h-4 w-4" /> {t("reports.exportReportBtn")}
            </button>
          }
        />

        {/* Aggregate Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t("reports.quotaFillRate")}
            value={`${formatNumber(Math.round((allocatedQuota / totalQuota) * 100), locale)}%`}
            description={t("reports.quotaFillDesc", {
              allocated: formatNumber(allocatedQuota, locale),
              total: formatNumber(totalQuota, locale),
            })}
            iconName="Briefcase"
          />
          <StatCard
            title={t("reports.sourcedGrossMargin")}
            value={`${formatNumber(34.8, locale)}%`}
            description={t("reports.netProfitDesc")}
            iconName="TrendingUp"
            trend={{ value: `${formatNumber(1.2, locale)}%`, isPositive: true }}
          />
          <StatCard
            title={t("reports.consulateProcessingCycle")}
            value={t("reports.days", { days: formatNumber(14.5, locale) })}
            description={t("reports.embassyBottleneckDesc")}
            iconName="Clock"
            trend={{ value: t("reports.days", { days: formatNumber(2, locale) }), isPositive: false }}
          />
          <StatCard
            title={t("reports.regulatoryClearances")}
            value={`${formatNumber(98.2, locale)}%`}
            description={t("reports.emigrantClearanceDesc")}
            iconName="ShieldCheck"
          />
        </div>

        {/* Bottleneck analysis grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Bottleneck Analysis */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Clock className="h-4.5 w-4.5 text-indigo-500" /> {t("reports.bottleneckAnalysis")}
            </h3>
            <div className="space-y-4">
              {bottleneckStages.map((b, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">{t(`reports.${b.stageKey}` as any)}</h4>
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
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Globe2 className="h-4.5 w-4.5 text-indigo-500" /> {t("reports.geographyShare")}
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Saudi Arabia (KSA)</span>
                  <span className="font-bold text-slate-950 dark:text-white">
                    {t("reports.sharePercent", { percent: formatNumber(65, locale) })}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: "65%" }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">United Arab Emirates (UAE)</span>
                  <span className="font-bold text-slate-950 dark:text-white">
                    {t("reports.sharePercent", { percent: formatNumber(25, locale) })}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: "25%" }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Malaysia (Penang/KL)</span>
                  <span className="font-bold text-slate-950 dark:text-white">
                    {t("reports.sharePercent", { percent: formatNumber(10, locale) })}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: "10%" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PermissionGate>
    </div>
  );
}
