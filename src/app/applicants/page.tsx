"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMockAuth } from "@/context/MockAuthContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { MOCK_APPLICANTS, WORKFLOW_LABELS, WorkflowStage, MockApplicant } from "@/lib/mockData";
import { SlidersHorizontal, Plus, FileSpreadsheet } from "lucide-react";

export default function ApplicantsPage() {
  const router = useRouter();
  const { hasAccess, user } = useMockAuth();

  // Filters State
  const [selectedTrade, setSelectedTrade] = useState("ALL");
  const [selectedStage, setSelectedStage] = useState("ALL");
  const [showArchived, setShowArchived] = useState(false);

  // Scoped Data check: if Agent, can only view their own candidates
  const isAgent = user.roleName === "Agent";
  const agentCode = user.agentCode;

  const baseData = MOCK_APPLICANTS.filter((app) => {
    if (isAgent) {
      return app.agentId === agentCode;
    }
    return true;
  });

  // Apply filters
  const filteredApplicants = baseData.filter((app) => {
    // Archived check
    if (app.isArchived !== showArchived) return false;
    // Trade check
    if (selectedTrade !== "ALL" && app.trade !== selectedTrade) return false;
    // Stage check
    if (selectedStage !== "ALL" && app.currentStage !== selectedStage) return false;
    return true;
  });

  // Unique Trades and Stages for filter dropdowns
  const availableTrades = Array.from(new Set(baseData.map((a) => a.trade)));
  const availableStages = Array.from(new Set(baseData.map((a) => a.currentStage)));

  const handleRowClick = (app: MockApplicant) => {
    router.push(`/applicants/${app.id}`);
  };

  const tableColumns = [
    {
      header: "Candidate Name",
      accessor: (a: MockApplicant) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-slate-900 dark:text-white">{a.fullName}</span>
          <span className="text-[10px] text-slate-400">{a.email || "No claimed email"}</span>
        </div>
      ),
    },
    { header: "Passport Number", accessor: (a: MockApplicant) => <span className="font-mono">{a.passportNumber}</span> },
    { header: "Contact Phone", accessor: (a: MockApplicant) => a.phone },
    { header: "Applied Trade", accessor: (a: MockApplicant) => a.trade },
    {
      header: "Workflow Status",
      accessor: (a: MockApplicant) => <StatusBadge status={a.currentStage} />,
    },
    {
      header: "Integrity",
      accessor: (a: MockApplicant) => (
        <span className={`text-[10px] font-bold ${a.isArchived ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 dark:bg-rose-950/20" : "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 dark:bg-emerald-950/20"}`}>
          {a.isArchived ? "Archived" : "Active Vetting"}
        </span>
      ),
    },
  ];

  // Actions header
  const headerActions = (
    <div className="flex items-center gap-2">
      {hasAccess("CREATE_APPLICANT") && (
        <button className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 shadow-indigo-600/20">
          <Plus className="h-4 w-4" /> Add Applicant
        </button>
      )}
      <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export Excel
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <PermissionGate permission="VIEW_APPLICANTS" showFallback={true}>
        <PageHeader
          title="Applicants Directory"
          description="Register candidates, track compliance statuses, passport expirations, and logistics workflow milestones."
          breadcrumbs={[{ label: "ERP Hub", href: "/dashboard" }, { label: "Applicants" }]}
          actions={headerActions}
        />

        {/* Dense Filters Bar */}
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2 shrink-0 text-slate-500 text-xs font-bold mr-2">
            <SlidersHorizontal className="h-4 w-4 text-indigo-500" /> Vetting Filters
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 flex-1">
            {/* Trade Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Trade Category</label>
              <select
                value={selectedTrade}
                onChange={(e) => setSelectedTrade(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-xs font-medium outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                <option value="ALL">All Trade Segments</option>
                {availableTrades.map((trade) => (
                  <option key={trade} value={trade}>
                    {trade}
                  </option>
                ))}
              </select>
            </div>

            {/* Workflow Stage Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Logistics Milestone</label>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-xs font-medium outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                <option value="ALL">All Stages</option>
                {availableStages.map((stage) => (
                  <option key={stage} value={stage}>
                    {WORKFLOW_LABELS[stage as WorkflowStage] || stage}
                  </option>
                ))}
              </select>
            </div>

            {/* Soft-Archived Toggle */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Audit View</label>
              <div className="flex h-9 items-center gap-2">
                <input
                  type="checkbox"
                  id="archived-toggle"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label
                  htmlFor="archived-toggle"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none"
                >
                  Show Soft-Archived Files Only
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          data={filteredApplicants}
          columns={tableColumns}
          searchPlaceholder="Search candidates by name..."
          searchField="fullName"
          onRowClick={handleRowClick}
          emptyStateTitle={showArchived ? "No archived files found" : "No active vetting files found"}
          emptyStateDescription="Try resetting your filters or toggle the view back to active candidate records."
        />
      </PermissionGate>
    </div>
  );
}
