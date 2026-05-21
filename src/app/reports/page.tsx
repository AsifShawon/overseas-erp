"use client";

import React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { MOCK_JOB_ORDERS } from "@/lib/mockData";
import { Clock, FileSpreadsheet, Globe2 } from "lucide-react";

export default function ReportsPage() {
  const totalQuota = MOCK_JOB_ORDERS.reduce((acc, jo) => acc + jo.totalQuota, 0);
  const allocatedQuota = MOCK_JOB_ORDERS.reduce((acc, jo) => acc + jo.allocatedQuota, 0);
  
  // Bottleneck mock times
  const bottleneckStages = [
    { stage: "Sourcing & Pre-Selection", avgDays: "4.5 Days", bottleneck: "Low" },
    { stage: "Consulate Approved Labs (Medical)", avgDays: "6.2 Days", bottleneck: "Low" },
    { stage: "Government Attestation Vetting", avgDays: "8.1 Days", bottleneck: "Medium" },
    { stage: "Embassy Visa Sticker Processing", avgDays: "14.5 Days", bottleneck: "High" },
    { stage: "Aviation Flight Ticket Issuance", avgDays: "3.2 Days", bottleneck: "Low" },
  ];

  return (
    <div className="space-y-6">
      <PermissionGate permission="VIEW_REPORTS" showFallback={true} fallbackMessage="Access to financial projections, margins, and operational pipeline bottleneck reports is restricted.">
        <PageHeader
          title="Logistics Analytics & Reports"
          description="Operational intelligence cockpit. View average pipeline bottlenecks, quota utilization rates, and trade-wise margin forecasts."
          breadcrumbs={[{ label: "ERP Hub", href: "/dashboard" }, { label: "Reports" }]}
          actions={
            <button className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500">
              <FileSpreadsheet className="h-4 w-4" /> Export Operations Report
            </button>
          }
        />

        {/* Aggregate Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Consolidated Quota Fill Rate"
            value={`${Math.round((allocatedQuota / totalQuota) * 100)}%`}
            description={`${allocatedQuota} slots of ${totalQuota} quotas filled`}
            iconName="Briefcase"
          />
          <StatCard
            title="Sourced Gross Margin"
            value="34.8%"
            description="Net profit after agent payouts"
            iconName="TrendingUp"
            trend={{ value: "1.2%", isPositive: true }}
          />
          <StatCard
            title="Consulate Processing Cycle"
            value="14.5 Days"
            description="Average embassy sticker bottleneck"
            iconName="Clock"
            trend={{ value: "2 Days", isPositive: false }}
          />
          <StatCard
            title="Regulatory Clearances"
            value="98.2%"
            description="Emigrant clearance pass rate"
            iconName="ShieldCheck"
          />
        </div>

        {/* Bottleneck analysis grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Bottleneck Analysis */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Clock className="h-4.5 w-4.5 text-indigo-500" /> Pipeline Stage Bottleneck Analysis
            </h3>
            <div className="space-y-4">
              {bottleneckStages.map((b, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">{b.stage}</h4>
                    <p className="text-[10px] text-slate-400">Mean processing duration</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{b.avgDays}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      b.bottleneck === "High" ? "bg-rose-50 text-rose-700 border border-rose-100" : b.bottleneck === "Medium" ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    }`}>
                      {b.bottleneck} Priority
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quota Sourced Geography */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Globe2 className="h-4.5 w-4.5 text-indigo-500" /> Quota Geography Share
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Saudi Arabia (KSA)</span>
                  <span className="font-bold text-slate-950 dark:text-white">65% share</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: "65%" }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">United Arab Emirates (UAE)</span>
                  <span className="font-bold text-slate-950 dark:text-white">25% share</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: "25%" }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Malaysia (Penang/KL)</span>
                  <span className="font-bold text-slate-950 dark:text-white">10% share</span>
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
