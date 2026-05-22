"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMockAuth } from "@/context/MockAuthContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { WORKFLOW_LABELS, WorkflowStage } from "@/lib/mockData";
import { SlidersHorizontal, Plus, FileSpreadsheet, Loader2, AlertCircle } from "lucide-react";

export default function ApplicantsPage() {
  const router = useRouter();
  const { hasAccess, accessToken } = useMockAuth();

  // Component states
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Filters State
  const [selectedTrade, setSelectedTrade] = useState("ALL");
  const [selectedStage, setSelectedStage] = useState("ALL");
  const [showArchived, setShowArchived] = useState(false);

  const handleExport = async () => {
    if (!accessToken) return;
    setIsExporting(true);
    try {
      const url = `/api/exports/applicants?archived=${showArchived}&trade=${selectedTrade}&stage=${selectedStage}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate CSV export");
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `applicants_export_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err: any) {
      alert(err.message || "An unexpected error occurred during export.");
    } finally {
      setIsExporting(false);
    }
  };

  // Load live data from postgres-backed API
  const fetchApplicants = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      // Fetch active cohort dataset matching archive status from server
      const res = await fetch(`/api/applicants?archived=${showArchived}&pageSize=1000`, {
        method: "GET",
        headers,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to load directory data.");
      }

      const data = await res.json();
      setApplicants(data.data || []);
    } catch (err: any) {
      console.error("Error fetching applicants:", err);
      setError(err.message || "An unexpected error occurred while loading candidates.");
    } finally {
      setLoading(false);
    }
  };

  // Perform fetching on mount and archived state transitions
  useEffect(() => {
    fetchApplicants();
  }, [showArchived, accessToken]);

  // Apply filters client-side to fetched cohort dataset
  const filteredApplicants = applicants.filter((app) => {
    // Trade check
    if (selectedTrade !== "ALL" && app.trade !== selectedTrade) return false;
    // Stage check
    if (selectedStage !== "ALL" && app.currentStage !== selectedStage) return false;
    return true;
  });

  // Unique Trades and Stages derived dynamically from active data segment
  const availableTrades = Array.from(new Set(applicants.map((a) => a.trade)));
  const availableStages = Array.from(new Set(applicants.map((a) => a.currentStage)));

  const handleRowClick = (app: any) => {
    router.push(`/applicants/${app.id}`);
  };

  const tableColumns = [
    {
      header: "Candidate Name",
      accessor: (a: any) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-slate-900 dark:text-white">{a.fullName}</span>
          <span className="text-[10px] text-slate-400">{a.email || "No claimed email"}</span>
        </div>
      ),
    },
    { header: "Passport Number", accessor: (a: any) => <span className="font-mono">{a.passportNumber}</span> },
    { header: "Contact Phone", accessor: (a: any) => a.phone },
    { header: "Applied Trade", accessor: (a: any) => a.trade },
    {
      header: "Workflow Status",
      accessor: (a: any) => <StatusBadge status={a.currentStage} />,
    },
    {
      header: "Integrity",
      accessor: (a: any) => (
        <span
          className={`text-[10px] font-bold ${
            a.isArchived
              ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 dark:bg-rose-950/20"
              : "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 dark:bg-emerald-950/20"
          }`}
        >
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
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 text-emerald-600 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
        )}
        {isExporting ? "Exporting..." : "Export CSV"}
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

        {/* Live Data rendering with beautiful loading/error and empty states */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 space-y-4">
            <div className="relative h-12 w-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-lg">
              <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
            </div>
            <p className="text-xs text-slate-500 font-bold animate-pulse">Loading live applicants from database...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-rose-100 bg-rose-50/50 p-6 text-center shadow-sm dark:border-rose-950/10 dark:bg-rose-950/5 space-y-4">
            <AlertCircle className="h-10 w-10 text-rose-500" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-900 dark:text-rose-400">Failed to Load Directory</h3>
              <p className="text-xs text-rose-700/80 dark:text-rose-400/70 max-w-md">{error}</p>
            </div>
            <button
              onClick={fetchApplicants}
              className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-sm"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <DataTable
            data={filteredApplicants}
            columns={tableColumns}
            searchPlaceholder="Search candidates by name..."
            searchField="fullName"
            onRowClick={handleRowClick}
            emptyStateTitle={showArchived ? "No archived files found" : "No active vetting files found"}
            emptyStateDescription="Try resetting your filters or toggle the view back to active candidate records."
          />
        )}
      </PermissionGate>
    </div>
  );
}
