"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/ui/StatCard";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { MOCK_JOB_ORDERS, MockJobOrder } from "@/lib/mockData";
import { MapPin, FileSpreadsheet, Plus } from "lucide-react";

export default function JobOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredOrders = MOCK_JOB_ORDERS.filter((jo) => {
    if (statusFilter !== "ALL" && jo.status !== statusFilter) return false;
    return true;
  });

  const totalQuota = MOCK_JOB_ORDERS.reduce((acc, jo) => acc + jo.totalQuota, 0);
  const allocatedQuota = MOCK_JOB_ORDERS.reduce((acc, jo) => acc + jo.allocatedQuota, 0);
  const activeOrdersCount = MOCK_JOB_ORDERS.filter((jo) => jo.status === "OPEN").length;

  const tableColumns = [
    {
      header: "Order Reference",
      accessor: (jo: MockJobOrder) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-slate-900 dark:text-white">{jo.orderNumber}</span>
          <span className="text-[10px] text-slate-400">Employer: {jo.employerName}</span>
        </div>
      ),
    },
    {
      header: "Country / Location",
      accessor: (jo: MockJobOrder) => (
        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          <span>{jo.country}</span>
        </div>
      ),
    },
    { header: "Trade Role", accessor: (jo: MockJobOrder) => jo.trade },
    {
      header: "Monthly Salary",
      accessor: (jo: MockJobOrder) => (
        <span className="font-semibold text-slate-900 dark:text-white">
          {jo.salary.toLocaleString()} {jo.country === "Saudi Arabia" ? "SAR" : jo.country === "United Arab Emirates" ? "AED" : "MYR"}
        </span>
      ),
    },
    {
      header: "Quota Allocation Progress",
      accessor: (jo: MockJobOrder) => {
        const pct = Math.round((jo.allocatedQuota / jo.totalQuota) * 100);
        return (
          <div className="w-48 space-y-1">
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>{jo.allocatedQuota} / {jo.totalQuota} Filled</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${pct}%` }}
              ></div>
            </div>
          </div>
        );
      },
    },
    {
      header: "Agency Commission",
      accessor: (jo: MockJobOrder) => (
        <span className="font-semibold text-slate-900 dark:text-white">${jo.commissionAmount} / candidate</span>
      ),
    },
    {
      header: "Status",
      accessor: (jo: MockJobOrder) => <StatusBadge status={jo.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PermissionGate permission="VIEW_DASHBOARD" showFallback={true} fallbackMessage="Access to Job Order demand allocations is locked for external partners or applicants.">
        <PageHeader
          title="Foreign Job Orders"
          description="Manage active recruitment demands and allocated emigration slots sourced from corporate employers."
          breadcrumbs={[{ label: "ERP Hub", href: "/dashboard" }, { label: "Job Orders" }]}
          actions={
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500">
                <Plus className="h-4 w-4" /> Add Demand Order
              </button>
              <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export CSV
              </button>
            </div>
          }
        />

        {/* Analytic Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total Quota Capacity"
            value={totalQuota}
            description="Across all registered foreign employers"
            iconName="Briefcase"
          />
          <StatCard
            title="Quota Utilization"
            value={`${allocatedQuota} Allocated`}
            description={`${totalQuota - allocatedQuota} unallocated slots remaining`}
            iconName="Activity"
          />
          <StatCard
            title="Open Demand Contracts"
            value={`${activeOrdersCount} Open`}
            description="Active candidate placing allowed"
            iconName="Plus"
          />
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mr-2">
            <span>Filter Status:</span>
          </div>
          <div className="flex gap-2">
            {["ALL", "OPEN", "CLOSED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${
                  statusFilter === status
                    ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
                }`}
              >
                {status === "ALL" ? "All Demands" : status}
              </button>
            ))}
          </div>
        </div>

        {/* Job Orders List Table */}
        <DataTable
          data={filteredOrders}
          columns={tableColumns}
          searchPlaceholder="Search by Employer Name..."
          searchField="employerName"
          emptyStateTitle="No job orders match your filter"
        />
      </PermissionGate>
    </div>
  );
}
