"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatCard } from "@/components/ui/StatCard";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { useMockAuth } from "@/context/MockAuthContext";
import { Eye, Terminal, ArrowDownRight, Loader2, FileSpreadsheet } from "lucide-react";
import { ErrorState } from "@/components/ui/ErrorState";
import { useToast } from "@/context/ToastContext";

export default function AuditLogsPage() {
  const { accessToken } = useMockAuth();
  const toast = useToast();
  const [selectedLog, setSelectedLog] = useState<any | undefined>(undefined);
  const [logsList, setLogsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [stats, setStats] = useState({
    totalLogs: 0,
    ipLoggingEnabled: true,
    auditChainStatus: "SHA-256 Locked",
  });

  const handleExport = async () => {
    if (!accessToken) return;
    setIsExporting(true);
    try {
      const url = `/api/exports/audit-logs`;
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
      link.setAttribute("download", `audit_logs_export_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Audit logs exported successfully!");
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred during export.");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function fetchAuditLogs() {
      if (!accessToken) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/audit-logs?pageSize=1000", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to fetch audit logs (${response.status})`);
        }
        const result = await response.json();
        if (active) {
          setLogsList(result.data || []);
          if (result.stats) {
            setStats(result.stats);
          } else {
            setStats({
              totalLogs: result.meta?.total || (result.data || []).length,
              ipLoggingEnabled: true,
              auditChainStatus: "SHA-256 Locked",
            });
          }
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || "An unexpected error occurred while loading audit trails.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    fetchAuditLogs();

    return () => {
      active = false;
    };
  }, [accessToken]);

  const tableColumns = [
    {
      header: "Timestamp",
      accessor: (log: any) => (
        <span className="text-text-muted font-medium">
          {new Date(log.timestamp).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Audited Staff",
      accessor: (log: any) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-text-theme">
            {log.user?.fullName || log.userId || "System Engine"}
          </span>
          <span className="text-[10px] text-text-soft">Role: {log.roleName}</span>
        </div>
      ),
    },
    {
      header: "Operation Action",
      accessor: (log: any) => (
        <span className="font-bold text-slate-950 dark:text-white uppercase tracking-wide">
          {log.actionType}
        </span>
      ),
    },
    { header: "Module Layer", accessor: (log: any) => log.tableName },
    {
      header: "Transaction ID",
      accessor: (log: any) => (
        <span className="font-mono text-[10px] bg-bg-muted px-1 py-0.5 rounded border border-border-theme">
          {log.recordId}
        </span>
      ),
    },
    { header: "Client IP Address", accessor: (log: any) => log.ipAddress || "System Engine" },
    {
      header: "Delta payload",
      accessor: (log: any) => (
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

  const renderDeltaJSON = (delta: any) => {
    if (!delta) return "{}";
    if (typeof delta === "string") {
      try {
        return JSON.stringify(JSON.parse(delta), null, 2);
      } catch {
        return JSON.stringify({ rawValue: delta }, null, 2);
      }
    }
    return JSON.stringify(delta, null, 2);
  };

  return (
    <div className="space-y-6">
      <PermissionGate
        permission="VIEW_AUDIT_LOGS"
        showFallback={true}
        fallbackMessage="Access to the immutable system audit trail and regulatory data-change tracking tables is locked."
      >
        <PageHeader
          title="Immutable Audit Logs"
          description="Regulatory operations change logs. Tracks database insertions, stamp creations, and balance revisions permanently."
          breadcrumbs={[{ label: "ERP Hub", href: "/dashboard" }, { label: "Audit Logs" }]}
          actions={
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-1.5 rounded-lg border border-border-theme bg-surface px-3.5 py-2 text-xs font-semibold text-text-theme hover:bg-bg-muted disabled:opacity-50 transition-colors cursor-pointer"
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

        {/* Overview */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Audited System Entries"
            value={stats.totalLogs}
            description="Forensic records committed"
            iconName="History"
          />
          <StatCard
            title="IP Logging Engine"
            value={stats.ipLoggingEnabled ? "Enabled" : "Disabled"}
            description="Collecting vetting host client data"
            iconName="Cpu"
          />
          <StatCard
            title="Audit Chain Integrity"
            value={stats.auditChainStatus}
            description="No deletion or rollback permitted"
            iconName="ShieldCheck"
          />
        </div>

        {/* Audit Log Table */}
        <div className="rounded-xl border border-border-theme bg-surface p-6 shadow-sm">
          <h3 className="text-xs font-bold text-text-theme uppercase tracking-wider mb-4">
            Immutable Ledger Logs
          </h3>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                Decrypting Ledger Logs...
              </p>
            </div>
          ) : error ? (
            <ErrorState
              title="Query Interrupted"
              description={error}
              iconName="AlertCircle"
            />
          ) : (
            <DataTable
              data={logsList}
              columns={tableColumns}
              searchPlaceholder="Search audit events by action..."
              searchField="actionType"
              emptyStateTitle="Audit Log Trail Clear"
              emptyStateDescription="No database change records matched the filter query."
            />
          )}
        </div>

        {/* Change Delta Drawer */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-lg h-full border-l border-border-theme bg-surface p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border-theme pb-4">
                  <h3 className="text-sm font-bold text-text-theme flex items-center gap-1.5">
                    <Terminal className="h-4.5 w-4.5 text-indigo-500" /> Database Delta Payload
                  </h3>
                  <button
                    onClick={() => setSelectedLog(undefined)}
                    className="rounded border border-border-theme bg-bg-muted px-3 py-1.5 text-xs font-bold text-text-theme hover:bg-bg-muted"
                  >
                    Close Drawer
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-text-soft uppercase">Timestamp</p>
                      <p className="mt-1 font-semibold text-text-theme">
                        {new Date(selectedLog.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-soft uppercase">Vetting Operator</p>
                      <p className="mt-1 font-semibold text-text-theme">
                        {selectedLog.user?.fullName || selectedLog.userId || "System"} ({selectedLog.roleName})
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-soft uppercase">Operation Type</p>
                      <p className="mt-1 font-semibold text-text-theme uppercase">
                        {selectedLog.actionType}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-soft uppercase">Audited DB Table</p>
                      <p className="mt-1 font-semibold text-text-theme">
                        {selectedLog.tableName}
                      </p>
                    </div>
                  </div>

                  {/* Monospace Code View */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-text-soft uppercase flex items-center gap-1">
                      <ArrowDownRight className="h-3.5 w-3.5" /> JSON Delta Diff
                    </p>
                    <pre className="rounded-lg bg-black p-4 font-mono text-[10px] leading-relaxed text-indigo-400 overflow-x-auto select-all max-h-[50vh]">
                      {renderDeltaJSON(selectedLog.delta)}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="border-t border-border-theme pt-4 text-[9px] text-text-soft">
                Audited client node: {selectedLog.ipAddress || "Local Terminal"}
              </div>
            </div>
          </div>
        )}
      </PermissionGate>
    </div>
  );
}
