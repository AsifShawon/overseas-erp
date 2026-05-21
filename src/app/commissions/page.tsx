"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/ui/StatCard";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { MOCK_COMMISSIONS, MOCK_APPLICANTS, MOCK_AGENTS, MockCommission } from "@/lib/mockData";
import { useMockAuth } from "@/context/MockAuthContext";
import { CheckCircle, FileSpreadsheet } from "lucide-react";

interface FlattenedCommission extends MockCommission {
  agentName: string;
  applicantName: string;
  jobOrderNumber: string;
}

export default function CommissionsPage() {
  const { user } = useMockAuth();

  // Scope commissions: Agents can only view their own commissions!
  const isAgent = user.roleName === "Agent";
  const agentCode = user.agentCode;

  const baseCommissions = MOCK_COMMISSIONS.map((com) => {
    const agt = MOCK_AGENTS.find((a) => a.agentCode === com.agentId);
    const app = MOCK_APPLICANTS.find((a) => a.id === com.applicantId);
    return {
      ...com,
      agentName: agt ? agt.fullName : com.agentId,
      applicantName: app ? app.fullName : "Unknown Candidate",
      jobOrderNumber: com.jobOrderId,
    };
  }).filter((com) => {
    if (isAgent) {
      return com.agentId === agentCode;
    }
    return true;
  });

  const [commissionsList, setCommissionsList] = useState<FlattenedCommission[]>(baseCommissions);

  // Financial aggregates
  const totalEarned = commissionsList.reduce((acc, com) => acc + com.amount, 0);
  const paidCommissions = commissionsList.filter((c) => c.status === "PAID").reduce((acc, c) => acc + c.amount, 0);
  const pendingCommissions = commissionsList.filter((c) => c.status === "ACCRUED").reduce((acc, c) => acc + c.amount, 0);

  const handleReleasePayout = (comId: string) => {
    const updated = commissionsList.map((com) => {
      if (com.id === comId) {
        return {
          ...com,
          status: "PAID" as const,
          payoutRef: `BANK-RELEASE-${Date.now().toString().substring(8)}`,
          payoutDate: new Date().toISOString().split("T")[0],
        };
      }
      return com;
    });
    setCommissionsList(updated);
  };

  const tableColumns = [
    {
      header: "Sourcing Partner (Agent)",
      accessor: (com: FlattenedCommission) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-slate-900 dark:text-white">{com.agentName}</span>
          <span className="text-[10px] text-slate-400">Agent Code: {com.agentId}</span>
        </div>
      ),
    },
    { header: "Sourced Candidate", accessor: (com: FlattenedCommission) => com.applicantName },
    { header: "Job Order No", accessor: (com: FlattenedCommission) => com.jobOrderNumber },
    {
      header: "Commission Fee",
      accessor: (com: FlattenedCommission) => (
        <span className="font-bold text-slate-950 dark:text-white">
          ${com.amount.toLocaleString()}
        </span>
      ),
      cellClassName: "text-right",
    },
    {
      header: "Status",
      accessor: (com: FlattenedCommission) => <StatusBadge status={com.status} />,
    },
    {
      header: "Settlement Voucher",
      accessor: (com: FlattenedCommission) =>
        com.payoutRef ? (
          <div className="flex flex-col gap-0.5 text-[10px] text-slate-500">
            <span className="font-mono font-bold text-slate-800 dark:text-slate-300">{com.payoutRef}</span>
            <span>Date: {com.payoutDate}</span>
          </div>
        ) : (
          <span className="text-[10px] text-slate-400">Awaiting accounts release</span>
        ),
    },
    {
      header: "Settlement actions",
      accessor: (com: FlattenedCommission) => {
        const canRelease = ["Super Admin", "Accounts Officer"].includes(user.roleName);
        if (!canRelease) return null;
        return com.status === "ACCRUED" ? (
          <button
            onClick={() => handleReleasePayout(com.id)}
            className="flex items-center gap-1 rounded bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20"
          >
            <CheckCircle className="h-3 w-3 shrink-0" /> Release Payout
          </button>
        ) : (
          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">Settled</span>
        );
      },
      cellClassName: "text-right",
    },
  ];

  return (
    <div className="space-y-6">
      <PermissionGate permission="VIEW_COMMISSIONS" showFallback={true}>
        <PageHeader
          title={isAgent ? "My Commission Statements" : "Agent Commissions Management"}
          description={isAgent ? "Overview of commissions accrued and settled to your licensed sourcing account." : "Vetting external supply commissions. Approve and release bank transfers for active placement tiers."}
          breadcrumbs={[{ label: "ERP Hub", href: "/dashboard" }, { label: "Commissions" }]}
          actions={
            <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export Excel
            </button>
          }
        />

        {/* Aggregates */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title={isAgent ? "My Sourced Placements total" : "Total Placements Billed"}
            value={`$${totalEarned.toLocaleString()}`}
            description="Commissions accrued since registration"
            iconName="Percent"
          />
          <StatCard
            title="Cleared payouts"
            value={`$${paidCommissions.toLocaleString()}`}
            description="Transferred to bank accounts"
            iconName="CheckCircle"
          />
          <StatCard
            title="Outstanding payouts"
            value={`$${pendingCommissions.toLocaleString()}`}
            description="Accrued pending milestone clearance"
            iconName="CreditCard"
            trend={{ value: "5%", isPositive: false }}
          />
        </div>

        {/* Commissions List Table */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
            {isAgent ? "Commission Statement Ledger" : "Agent Supply Commission Payout Log"}
          </h3>
          <DataTable
            data={commissionsList}
            columns={tableColumns}
            searchPlaceholder="Search candidates..."
            searchField="applicantName"
          />
        </div>
      </PermissionGate>
    </div>
  );
}
