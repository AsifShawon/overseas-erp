"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatCard } from "@/components/ui/StatCard";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { MOCK_AUDIT_LOGS, MockAuditLog } from "@/lib/mockData";
import { Eye, Terminal, ArrowDownRight } from "lucide-react";

export default function AuditLogsPage() {
  const [selectedLog, setSelectedLog] = useState<MockAuditLog | undefined>(undefined);

  const totalLogs = MOCK_AUDIT_LOGS.length;

  const tableColumns = [
    {
      header: "Timestamp",
      accessor: (log: MockAuditLog) => (
        <span className="text-slate-500 font-medium">
          {new Date(log.timestamp).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Audited Staff",
      accessor: (log: MockAuditLog) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-slate-900 dark:text-white">{log.userId}</span>
          <span className="text-[10px] text-slate-400">Role: {log.roleName}</span>
        </div>
      ),
    },
    {
      header: "Operation Action",
      accessor: (log: MockAuditLog) => (
        <span className="font-bold text-slate-950 dark:text-white uppercase tracking-wide">
          {log.actionType}
        </span>
      ),
    },
    { header: "Module Layer", accessor: (log: MockAuditLog) => log.tableName },
    {
      header: "Transaction ID",
      accessor: (log: MockAuditLog) => (
        <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
          {log.recordId}
        </span>
      ),
    },
    { header: "Client IP Address", accessor: (log: MockAuditLog) => log.ipAddress || "System Engine" },
    {
      header: "Delta payload",
      accessor: (log: MockAuditLog) => (
        <button
          onClick={() => setSelectedLog(log)}
          className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
        >
          <Eye className="h-3.5 w-3.5" /> View Changes
        </button>
      ),
      cellClassName: "text-right",
    },
  ];

  return (
    <div className="space-y-6">
      <PermissionGate permission="VIEW_AUDIT_LOGS" showFallback={true} fallbackMessage="Access to the immutable system audit trail and regulatory data-change tracking tables is locked.">
        <PageHeader
          title="Immutable Audit Logs"
          description="Regulatory operations change logs. Tracks database insertions, stamp creations, and balance revisions permanently."
          breadcrumbs={[{ label: "ERP Hub", href: "/dashboard" }, { label: "Audit Logs" }]}
        />

        {/* Overview */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Audited System Entries"
            value={totalLogs}
            description="Forensic records committed"
            iconName="History"
          />
          <StatCard
            title="IP Logging Engine"
            value="Enabled"
            description="Collecting vetting host client data"
            iconName="Cpu"
          />
          <StatCard
            title="Audit Chain Integrity"
            value="SHA-256 Locked"
            description="No deletion or rollback permitted"
            iconName="ShieldCheck"
          />
        </div>

        {/* Audit Log Table */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
            immutable Ledger Logs
          </h3>
          <DataTable
            data={MOCK_AUDIT_LOGS}
            columns={tableColumns}
            searchPlaceholder="Search audit events by action..."
            searchField="actionType"
          />
        </div>

        {/* Change Delta Drawer */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs">
            <div className="w-full max-w-lg h-full border-l border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                    <Terminal className="h-4.5 w-4.5 text-indigo-500" /> Database Delta Payload
                  </h3>
                  <button
                    onClick={() => setSelectedLog(undefined)}
                    className="rounded border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400"
                  >
                    Close Drawer
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Timestamp</p>
                      <p className="mt-1 font-semibold text-slate-700 dark:text-slate-300">
                        {new Date(selectedLog.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Vetting Operator</p>
                      <p className="mt-1 font-semibold text-slate-700 dark:text-slate-300">
                        {selectedLog.userId} ({selectedLog.roleName})
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Operation Type</p>
                      <p className="mt-1 font-semibold text-slate-700 dark:text-slate-300 uppercase">
                        {selectedLog.actionType}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Audited DB Table</p>
                      <p className="mt-1 font-semibold text-slate-700 dark:text-slate-300">
                        {selectedLog.tableName}
                      </p>
                    </div>
                  </div>

                  {/* Monospace Code View */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <ArrowDownRight className="h-3.5 w-3.5" /> JSON Delta Diff
                    </p>
                    <pre className="rounded-lg bg-slate-950 p-4 font-mono text-[10px] leading-relaxed text-indigo-400 overflow-x-auto select-all max-h-[50vh]">
                      {JSON.stringify(JSON.parse(selectedLog.delta || "{}"), null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 text-[9px] text-slate-400 dark:border-slate-800">
                Audited client node: {selectedLog.ipAddress || "Local Terminal"}
              </div>
            </div>
          </div>
        )}
      </PermissionGate>
    </div>
  );
}
