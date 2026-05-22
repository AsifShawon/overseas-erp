"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/ui/StatCard";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { useMockAuth } from "@/context/MockAuthContext";
import { FileSpreadsheet, Loader2, AlertCircle, ShieldAlert } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface FlattenedLedger {
  id: string;
  applicantId: string;
  applicantName: string;
  passportNumber: string;
  transactionType: "INVOICE" | "RECEIPT" | "CREDIT_NOTE" | "DEBIT_NOTE";
  referenceNo: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  timestamp: string;
}

export default function AccountsPage() {
  const { accessToken, activeRoleName } = useMockAuth();
  const toast = useToast();

  const [ledgers, setLedgers] = useState<FlattenedLedger[]>([]);
  const [stats, setStats] = useState({
    totalBilled: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    totalCommissionsAccrued: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!accessToken) return;
    setIsExporting(true);
    try {
      const url = `/api/exports/ledger`;
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
      link.setAttribute("download", `ledger_export_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred during export.");
    } finally {
      setIsExporting(false);
    }
  };

  const fetchLedgers = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/accounts/ledger?pageSize=1000", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("FORBIDDEN");
        }
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to load accounts ledger.");
      }

      const data = await res.json();
      setLedgers(data.data || []);
      setStats({
        totalBilled: data.stats?.totalBilled || 0,
        totalCollected: data.stats?.totalCollected || 0,
        totalOutstanding: data.stats?.totalOutstanding || 0,
        totalCommissionsAccrued: data.stats?.totalCommissionsAccrued || 0,
      });
    } catch (err: any) {
      console.error("Error fetching accounts ledger:", err);
      setError(err.message || "An unexpected error occurred while loading accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgers();
  }, [accessToken]);

  const tableColumns = [
    {
      header: "Candidate Name",
      accessor: (entry: FlattenedLedger) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-slate-900 dark:text-white">{entry.applicantName}</span>
          <span className="text-[10px] text-slate-400">Passport: {entry.passportNumber}</span>
        </div>
      ),
    },
    {
      header: "Posting Timestamp",
      accessor: (entry: FlattenedLedger) => new Date(entry.timestamp).toLocaleString(),
    },
    {
      header: "Voucher Type",
      accessor: (entry: FlattenedLedger) => <StatusBadge status={entry.transactionType} />,
    },
    {
      header: "Reference No",
      accessor: (entry: FlattenedLedger) => (
        <span className="font-mono font-bold text-slate-900 dark:text-white">{entry.referenceNo}</span>
      ),
    },
    {
      header: "Debit (Amount Owed)",
      accessor: (entry: FlattenedLedger) => (
        <span className="text-rose-600 font-semibold">
          {entry.debit > 0 ? `$${entry.debit.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "-"}
        </span>
      ),
      cellClassName: "text-right",
    },
    {
      header: "Credit (Amount Paid)",
      accessor: (entry: FlattenedLedger) => (
        <span className="text-emerald-600 font-semibold">
          {entry.credit > 0 ? `$${entry.credit.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "-"}
        </span>
      ),
      cellClassName: "text-right",
    },
    {
      header: "Running Balance",
      accessor: (entry: FlattenedLedger) => (
        <span className="font-bold text-slate-950 dark:text-white">
          ${entry.runningBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
      ),
      cellClassName: "text-right",
    },
  ];

  // Render 403 Forbidden specifically or custom Perms gate
  const isBlockedRole = activeRoleName === "Agent" || activeRoleName === "Applicant";

  if (isBlockedRole || error === "FORBIDDEN") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 flex items-center justify-center shadow-md animate-bounce">
          <ShieldAlert className="h-8 w-8 text-rose-500" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Access Locked</h2>
          <p className="text-xs text-slate-500">
            Access to corporate accounts logs, balance sheets, and audit receipts is locked for recruitment officers, agents, and candidates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PermissionGate
        permission="VIEW_ACCOUNTS"
        showFallback={true}
        fallbackMessage="Access to corporate accounts logs, balance sheets, and audit receipts is locked for recruitment officers, agents, and candidates."
      >
        <PageHeader
          title="Accounts & Forensic Ledgers"
          description="Consolidated agency financial statements. Track receivables, bank transfers, and candidate double-entry postings."
          breadcrumbs={[{ label: "ERP Hub", href: "/dashboard" }, { label: "Accounts" }]}
          actions={
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 text-emerald-600 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              )}
              {isExporting ? "Exporting..." : "Export CSV"}
            </button>
          }
        />

        {/* Financial Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Invoiced Package Fees"
            value={`$${stats.totalBilled.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            description="Total billed candidate accounts"
            iconName="TrendingUp"
          />
          <StatCard
            title="Cash Desk Collected"
            value={`$${stats.totalCollected.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            description="Electronic and cash payments cleared"
            iconName="Landmark"
          />
          <StatCard
            title="Outstanding Receivables"
            value={`$${stats.totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            description="Remaining candidate arrears outstanding"
            iconName="CreditCard"
            trend={{ value: "11%", isPositive: false }}
          />
          <StatCard
            title="Agent Commission Obligations"
            value={`$${stats.totalCommissionsAccrued.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            description="Estimated payments outstanding to agents"
            iconName="Percent"
          />
        </div>

        {/* Global Forensic Ledger Table */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
            Unified Double-Entry Ledger Logs
          </h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="h-7 w-7 text-indigo-600 animate-spin" />
              <p className="text-xs text-slate-500 font-bold">Synchronizing double-entry transactions...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-rose-50/50 dark:bg-rose-950/5 rounded-lg border border-rose-100 dark:border-rose-950/20">
              <AlertCircle className="h-10 w-10 text-rose-500" />
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-bold text-rose-900 dark:text-rose-400">Failed to Load Ledger</h4>
                <p className="text-xs text-rose-700/80 dark:text-rose-400/70">{error}</p>
              </div>
              <button
                onClick={fetchLedgers}
                className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-500"
              >
                Retry Request
              </button>
            </div>
          ) : (
            <DataTable
              data={ledgers}
              columns={tableColumns}
              searchPlaceholder="Search entries by candidate name..."
              searchField="applicantName"
              emptyStateTitle="No ledger transactions recorded"
              emptyStateDescription="Verify candidate invoices and desk desk payment clearances under the dossier tab."
            />
          )}
        </div>
      </PermissionGate>
    </div>
  );
}
