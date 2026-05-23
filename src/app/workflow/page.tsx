"use client";

import React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/ui/StatCard";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { MOCK_APPLICANTS, WorkflowStage, MockApplicant } from "@/lib/mockData";
import { GitCommit, AlertOctagon, ArrowRight } from "lucide-react";
import { useT } from "@/i18n/useT";
import Link from "next/link";

export default function WorkflowPage() {
  const { t, locale } = useT();

  // Funnel calculations
  const stageCounts = MOCK_APPLICANTS.reduce((acc, app) => {
    acc[app.currentStage] = (acc[app.currentStage] || 0) + 1;
    return acc;
  }, {} as Record<WorkflowStage, number>);

  const haltedCandidates = MOCK_APPLICANTS.filter(
    (app) => app.currentStage === "MEDICAL_UNFIT" || app.currentStage === "VISA_REJECTED"
  );
  
  const activePipelinesCount = MOCK_APPLICANTS.filter(
    (app) => !app.isArchived && app.currentStage !== "DEPLOYED"
  ).length;

  const deployedCount = MOCK_APPLICANTS.filter((app) => app.currentStage === "DEPLOYED").length;

  const mainStagesList: WorkflowStage[] = [
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

  return (
    <div className="space-y-6">
      <PermissionGate permission="VIEW_DASHBOARD" showFallback={true}>
        <PageHeader
          title={t("pipelinePage.title")}
          description={t("pipelinePage.description")}
          breadcrumbs={[
            { label: locale === "bn" ? "ড্যাশবোর্ড" : "ERP Hub", href: "/dashboard" },
            { label: t("pipelinePage.tracking") }
          ]}
        />

        {/* Funnel Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title={t("pipelinePage.activeFiles")}
            value={activePipelinesCount}
            description={t("pipelinePage.activeFilesDesc")}
            iconName="Activity"
          />
          <StatCard
            title={t("pipelinePage.haltedBottlenecks")}
            value={haltedCandidates.length}
            description={t("pipelinePage.haltedBottlenecksDesc")}
            iconName="AlertOctagon"
            className="border-rose-100 bg-rose-50/10"
          />
          <StatCard
            title={t("pipelinePage.boardedDeployed")}
            value={deployedCount}
            description={t("pipelinePage.boardedDeployedDesc")}
            iconName="UserCheck"
          />
        </div>

        {/* Funnel visual columns */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-6">
            {t("pipelinePage.pipelineDistribution")}
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {mainStagesList.map((stage) => {
              const count = stageCounts[stage] || 0;
              const title = t(`workflow.${stage}`);
              return (
                <div key={stage} className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 text-center dark:border-slate-800 dark:bg-slate-900/20">
                  <span className="relative flex h-2 w-2 mx-auto mb-2">
                    {count > 0 ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                      </>
                    ) : (
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-300"></span>
                    )}
                  </span>
                  <h4 className="text-2xl font-black text-slate-800 dark:text-white">{count}</h4>
                  <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{title.split(" ")[0]}..</p>
                  <p className="mt-0.5 text-[9px] text-slate-400 truncate">{title}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Bottleneck / Halted Pipeline Panel */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <AlertOctagon className="h-4.5 w-4.5 text-rose-500" /> {t("pipelinePage.exceptionQueue")}
            </h3>
            {haltedCandidates.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                {t("pipelinePage.noHaltedPipelines")}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {haltedCandidates.map((app) => (
                  <div key={app.id} className="py-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{app.fullName}</h4>
                      <p className="text-[10px] text-slate-400">
                        {locale === "bn" ? `কাজের বিভাগ: ${app.trade} • পাসপোর্ট নং: ${app.passportNumber}` : `Trade Category: ${app.trade} • Passport No: ${app.passportNumber}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={app.currentStage} />
                      <Link
                        href={`/applicants/${app.id}`}
                        className="flex items-center gap-0.5 rounded border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400"
                      >
                        {t("pipelinePage.inspectDossier")} <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                {t("pipelinePage.logisticsGuidelines")}
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {t("pipelinePage.guidelinesText")}
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-start gap-2 text-[10px] text-slate-600 dark:text-slate-400">
                  <GitCommit className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>{t("pipelinePage.guideline1")}</span>
                </div>
                <div className="flex items-start gap-2 text-[10px] text-slate-600 dark:text-slate-400">
                  <GitCommit className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>{t("pipelinePage.guideline2")}</span>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
              {t("pipelinePage.overrideNotice")}
            </div>
          </div>
        </div>

        {/* Global Pipeline Directory */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
            {t("pipelinePage.cohortDirectory")}
          </h3>
          <DataTable
            data={MOCK_APPLICANTS}
            columns={[
              { header: t("pipelinePage.candidateName"), accessor: (a: MockApplicant) => a.fullName },
              { header: t("pipelinePage.appliedTrade"), accessor: (a: MockApplicant) => a.trade },
              { header: t("pipelinePage.passportNo"), accessor: (a: MockApplicant) => <span className="font-mono">{a.passportNumber}</span> },
              { header: t("pipelinePage.workflowStage"), accessor: (a: MockApplicant) => <StatusBadge status={a.currentStage} /> },
              {
                header: t("pipelinePage.folderLink"),
                accessor: (a: MockApplicant) => (
                  <Link
                    href={`/applicants/${a.id}`}
                    className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {t("pipelinePage.openWorkspace")}
                  </Link>
                ),
              },
            ]}
            searchPlaceholder={t("pipelinePage.searchPipeline")}
            searchField="fullName"
          />
        </div>
      </PermissionGate>
    </div>
  );
}
