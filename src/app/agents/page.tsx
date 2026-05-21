"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatCard } from "@/components/ui/StatCard";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { MOCK_AGENTS, MockAgent } from "@/lib/mockData";
import { Award, FileSpreadsheet, Plus } from "lucide-react";

export default function AgentsPage() {
  const [tierFilter, setTierFilter] = useState("ALL");

  const filteredAgents = MOCK_AGENTS.filter((agt) => {
    if (tierFilter !== "ALL" && agt.tier !== tierFilter) return false;
    return true;
  });

  const totalAgents = MOCK_AGENTS.length;
  const activeAgents = MOCK_AGENTS.filter((a) => a.isActive).length;
  const tierACount = MOCK_AGENTS.filter((a) => a.tier === "A").length;

  const tableColumns = [
    {
      header: "Agent Code",
      accessor: (a: MockAgent) => (
        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
          {a.agentCode}
        </span>
      ),
    },
    {
      header: "Agency / Sourcing Partner",
      accessor: (a: MockAgent) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-slate-900 dark:text-white">{a.companyName}</span>
          <span className="text-[10px] text-slate-400">License No: {a.licenseNo}</span>
        </div>
      ),
    },
    {
      header: "Lead Representative",
      accessor: (a: MockAgent) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-slate-800 dark:text-slate-200">{a.fullName}</span>
          <span className="text-[10px] text-slate-400">{a.email}</span>
        </div>
      ),
    },
    { header: "Contact Number", accessor: (a: MockAgent) => a.phone },
    {
      header: "Agency Tier",
      accessor: (a: MockAgent) => (
        <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
          a.tier === "A" ? "bg-amber-50 text-amber-700 border border-amber-100" : a.tier === "B" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "bg-slate-50 text-slate-700 border border-slate-200"
        }`}>
          <Award className="h-3 w-3 shrink-0" /> Tier {a.tier} Partner
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (a: MockAgent) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          a.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400" : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-400"
        }`}>
          {a.isActive ? "Active Supply" : "License Suspended"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PermissionGate permission="VIEW_COMMISSIONS" showFallback={true} fallbackMessage="Access to Agent Sourcing partnerships, tier commissions, and licenses is restricted to administrative and accounts departments.">
        <PageHeader
          title="Sourcing Agents Registry"
          description="Track external supply licenses, company representative records, and tier commissions payouts."
          breadcrumbs={[{ label: "ERP Hub", href: "/dashboard" }, { label: "Agents" }]}
          actions={
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500">
                <Plus className="h-4 w-4" /> Add Sourcing Agent
              </button>
              <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export Excel
              </button>
            </div>
          }
        />

        {/* Dynamic Analytics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total Registered Agents"
            value={totalAgents}
            description="External sourcing agencies registered"
            iconName="Users"
          />
          <StatCard
            title="Active Partnerships"
            value={`${activeAgents} Active`}
            description="Licensed for labor supply pipelines"
            iconName="UserCheck"
          />
          <StatCard
            title="Gold-Tier (Class A)"
            value={`${tierACount} Partners`}
            description="Primary sourcing agencies"
            iconName="Star"
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mr-2">
            <span>Filter Partners:</span>
          </div>
          <div className="flex gap-2">
            {["ALL", "A", "B", "C"].map((tier) => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${
                  tierFilter === tier
                    ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
                }`}
              >
                {tier === "ALL" ? "All Partners" : `Tier ${tier}`}
              </button>
            ))}
          </div>
        </div>

        {/* Agent Table */}
        <DataTable
          data={filteredAgents}
          columns={tableColumns}
          searchPlaceholder="Search by Sourcing Partner Name..."
          searchField="companyName"
          emptyStateTitle="No matching agent partners found"
        />
      </PermissionGate>
    </div>
  );
}
