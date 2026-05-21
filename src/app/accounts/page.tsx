"use client";

import React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/ui/StatCard";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { MOCK_LEDGERS, MOCK_APPLICANTS, MOCK_INVOICES, MOCK_RECEIPTS, MOCK_COMMISSIONS, MockLedgerEntry } from "@/lib/mockData";
import { FileSpreadsheet } from "lucide-react";

interface FlattenedLedger extends MockLedgerEntry {
  applicantName: string;
  passportNumber: string;
}

export default function AccountsPage() {
  const allLedgers: FlattenedLedger[] = MOCK_LEDGERS.flatMap((entry) => {
    const app = MOCK_APPLICANTS.find((a) => a.id === entry.applicantId);
    return {
      ...entry,
      applicantName: app ? app.fullName : "Unknown Candidate",
      passportNumber: app ? app.passportNumber : "N/A",
    };
  });

  const totalOutstanding = MOCK_INVOICES.reduce((acc, inv) => acc + inv.outstanding, 0);
  const totalBilled = MOCK_INVOICES.reduce((acc, inv) => acc + inv.amount, 0);
  const totalCollected = MOCK_RECEIPTS.reduce((acc, rec) => acc + rec.amountPaid, 0);
  const totalCommissionsAccrued = MOCK_COMMISSIONS.reduce((acc, com) => acc + com.amount, 0);

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
    { header: "Posting Timestamp", accessor: (entry: FlattenedLedger) => new Date(entry.timestamp).toLocaleString() },
    {
      header: "Voucher Type",
      accessor: (entry: FlattenedLedger) => <StatusBadge status={entry.transactionType} />,
    },
    { header: "Reference No", accessor: (entry: FlattenedLedger) => <span className="font-mono font-bold">{entry.referenceNo}</span> },
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

  return (
    <div className="space-y-6">
      <PermissionGate permission="VIEW_ACCOUNTS" showFallback={true} fallbackMessage="Access to corporate accounts logs, balance sheets, and audit receipts is locked for recruitment officers, agents, and candidates.">
        <PageHeader
          title="Accounts & Forensic Ledgers"
          description="Consolidated agency financial statements. Track receivables, bank transfers, and candidate double-entry postings."
          breadcrumbs={[{ label: "ERP Hub", href: "/dashboard" }, { label: "Accounts" }]}
          actions={
            <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export Balance Sheets
            </button>
          }
        />

        {/* Financial Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Invoiced Package Fees"
            value={`$${totalBilled.toLocaleString()}`}
            description="Total billed candidate accounts"
            iconName="TrendingUp"
          />
          <StatCard
            title="Cash Desk Collected"
            value={`$${totalCollected.toLocaleString()}`}
            description="Electronic and cash payments cleared"
            iconName="Landmark"
          />
          <StatCard
            title="Outstanding Receivables"
            value={`$${totalOutstanding.toLocaleString()}`}
            description="Remaining candidate arrears outstanding"
            iconName="CreditCard"
            trend={{ value: "11%", isPositive: false }}
          />
          <StatCard
            title="Agent Commission Obligations"
            value={`$${totalCommissionsAccrued.toLocaleString()}`}
            description="Estimated payments outstanding to agents"
            iconName="Percent"
          />
        </div>

        {/* Global Forensic Ledger Table */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
            Unified Double-Entry Ledger Logs
          </h3>
          <DataTable
            data={allLedgers}
            columns={tableColumns}
            searchPlaceholder="Search entries by candidate name..."
            searchField="applicantName"
          />
        </div>
      </PermissionGate>
    </div>
  );
}
