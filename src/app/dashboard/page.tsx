"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMockAuth } from "@/context/MockAuthContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable } from "@/components/shared/DataTable";
import {
  WORKFLOW_LABELS,
  WorkflowStage,
} from "@/lib/mockData";
import {
  TrendingUp,
  AlertTriangle,
  History,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const { user, accessToken } = useMockAuth();
  const router = useRouter();

  // If Applicant, redirect to their personal portal immediately
  useEffect(() => {
    if (user?.roleName === "Applicant") {
      router.push("/applicant/portal");
    }
  }, [user, router]);

  // Client states for live API data
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const res = await fetch("/api/reports/dashboard", {
        method: "GET",
        headers,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to load dashboard metrics.");
      }

      const payload = await res.json();
      setData(payload);
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "An unexpected error occurred while querying operations database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.roleName !== "Applicant") {
      fetchDashboardData();
    }
  }, [accessToken, user?.roleName]);

  if (user?.roleName === "Applicant") {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mx-auto"></div>
          <p className="text-xs text-slate-500">Redirecting to Applicant Portal...</p>
        </div>
      </div>
    );
  }

  // State-of-the-art Loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Command Dashboard"
          description="Fetching operations analytics and compliance stages from secure database..."
          breadcrumbs={[{ label: "ERP Hub", href: "/dashboard" }, { label: "Dashboard" }]}
        />
        <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-border-theme bg-surface p-5 shadow-sm space-y-4">
          <div className="relative h-12 w-12 rounded-2xl bg-surface border border-border-theme flex items-center justify-center shadow-lg animate-pulse">
            <Loader2 className="h-6 w-6 text-primary-theme animate-spin" />
          </div>
          <p className="text-xs text-text-soft font-bold animate-pulse">Loading dynamic dashboard reports...</p>
        </div>
      </div>
    );
  }

  // State-of-the-art Error fallback
  if (error) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Command Dashboard"
          description="Service Connection Interrupted"
          breadcrumbs={[{ label: "ERP Hub", href: "/dashboard" }, { label: "Dashboard" }]}
        />
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-rose-100 bg-rose-50/50 p-6 text-center shadow-sm dark:border-rose-950/10 dark:bg-rose-950/5 space-y-4">
          <AlertTriangle className="h-10 w-10 text-rose-500" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-rose-900 dark:text-rose-400">Failed to Load Dashboard</h3>
            <p className="text-xs text-rose-700/80 dark:text-rose-400/70 max-w-md">{error}</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-sm"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // --- Live calculations destructured from DB response ---
  const {
    activeApplicants = 0,
    archivedApplicants = 0,
    totalAgents = 0,
    activeAgents = 0,
    totalJobOrders = 0,
    openJobOrders = 0,
    totalQuota = 0,
    allocatedQuota = 0,
    totalInvoiced = 0,
    totalCollected = 0,
    totalOutstanding = 0,
    totalCommissionAccrued = 0,
    totalCommissionPaid = 0,
    pendingCommission = 0,
    stageCounts = {} as Record<string, number>,
    recentAuditLogs = [],
    recentNotifications = [],
    passportExpiryWarnings = [],
    documentPendingCount = 0,
    jobOrders = [],
    appliedCount = 0,
    interviewedCount = 0,
    selectedCount = 0,
    recruitmentQueue = [],
    pendingDocumentCount = 0,
    verifiedDocumentCount = 0,
    medicalWaitingCount = 0,
    medicalFitCount = 0,
    pendingDocumentApplicants = [],
    visaSubmittedCount = 0,
    visaStampedCount = 0,
    visaRejectedCount = 0,
    clearedForVisaCount = 0,
    visaQueue = [],
    pendingInvoices = [],
    pendingCommissions = 0,
    paidCommissions = 0,
    ownTotalApplicants = 0,
    ownActiveApplicants = 0,
    ownDeployedApplicants = 0,
    ownCommissionAccrued = 0,
    ownCommissionPaid = 0,
    ownApplicants = [],
    totalPlacedCount = 0,
  } = data || {};

  return (
    <div className="space-y-8">
      <PageHeader
        title="Command Dashboard"
        description={`Welcome back, ${user.fullName}. Here is your logistics and compliance operations overview.`}
        breadcrumbs={[{ label: "ERP Hub", href: "/dashboard" }, { label: "Dashboard" }]}
      />

      {/* ------------------ SUPER ADMIN DASHBOARD ------------------ */}
      {user.roleName === "Super Admin" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Active Candidates"
              value={activeApplicants}
              description={`${archivedApplicants} soft-archived entries`}
              iconName="Users"
              trend={{ value: "8.5%", isPositive: true }}
            />
            <StatCard
              title="Job Orders Open"
              value={`${openJobOrders} / ${totalJobOrders}`}
              description={`${allocatedQuota} of ${totalQuota} quotas allocated`}
              iconName="Briefcase"
            />
            <StatCard
              title="Accounts Receivable"
              value={`$${totalOutstanding.toLocaleString()}`}
              description={`Total billed: $${totalInvoiced.toLocaleString()}`}
              iconName="CreditCard"
              trend={{ value: "12%", isPositive: false }}
            />
            <StatCard
              title="Sourcing Agents"
              value={`${activeAgents} Active`}
              description={`Out of ${totalAgents} registered tiers`}
              iconName="UserCheck"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Pipeline Stage Summary */}
            <div className="lg:col-span-2 rounded-xl border border-border-theme bg-surface p-6 shadow-sm">
              <h3 className="text-sm font-bold text-text-theme mb-4 flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-primary-theme" /> Pipeline Stage Distribution
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {(["SELECTED", "MEDICAL_WAITING", "VISA_SUBMITTED", "DEPLOYED"] as WorkflowStage[]).map((stage) => {
                  const count = stageCounts[stage] || 0;
                  const label = WORKFLOW_LABELS[stage];
                  return (
                    <div key={stage} className="rounded-lg bg-surface-soft p-4 border border-border-theme">
                      <p className="text-[10px] font-semibold text-text-soft uppercase tracking-wider truncate">{label}</p>
                      <h4 className="mt-2 text-2xl font-bold text-text-theme">{count}</h4>
                      <p className="text-[9px] text-text-soft mt-1">Candidates in stage</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Warning Widget */}
            <div className="rounded-xl border border-border-theme bg-surface p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-theme mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-amber-500" /> Alerts & Vetting Warnings
                </h3>
                <p className="text-xs text-text-soft">System automated notifications indicating potential bottlenecks.</p>
                <div className="mt-4 space-y-3">
                  {passportExpiryWarnings.length > 0 ? (
                    passportExpiryWarnings.map((app: any) => (
                      <div key={app.id} className="flex gap-2 rounded-lg bg-rose-50/50 p-2.5 border border-rose-100/50 dark:bg-rose-950/10 dark:border-rose-900/10">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0 animate-ping"></span>
                        <p className="text-[10px] text-rose-700 dark:text-rose-400">
                          Candidate <strong>{app.fullName}</strong> passport ({app.passportNumber}) expires on {app.passportExpiry}. Urgent action required.
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="flex gap-2 rounded-lg bg-emerald-50/50 p-2.5 border border-emerald-100/50 dark:bg-emerald-950/10 dark:border-emerald-900/10">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                        No critical passport expiry warnings detected in active pipelines.
                      </p>
                    </div>
                  )}

                  {documentPendingCount > 0 && (
                    <div className="flex gap-2 rounded-lg bg-amber-50/50 p-2.5 border border-amber-100/50 dark:bg-amber-950/10 dark:border-amber-900/10">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                      <p className="text-[10px] text-amber-700 dark:text-amber-400">
                        There are <strong>{documentPendingCount}</strong> documents pending verification in Documentation queue.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border-theme flex justify-between items-center text-[10px] text-text-soft">
                <span>Last updated: Just now</span>
                <span className="font-semibold text-primary-theme cursor-pointer">Resolve all</span>
              </div>
            </div>
          </div>

          {/* Immutable Audit Logs widget */}
          <div className="rounded-xl border border-border-theme bg-surface p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-theme mb-4 flex items-center gap-2">
              <History className="h-4.5 w-4.5 text-primary-theme" /> Recent Immutable System Audits
            </h3>
            <DataTable<any>
              data={recentAuditLogs}
              columns={[
                { header: "Timestamp", accessor: (log: any) => new Date(log.timestamp).toLocaleString() },
                { header: "Staff Member", accessor: (log: any) => `${log.userId} (${log.roleName})` },
                { header: "Action", accessor: (log: any) => <span className="font-semibold text-text-theme">{log.actionType}</span> },
                { header: "Module", accessor: (log: any) => log.tableName },
                { header: "Vetting Record", accessor: (log: any) => <span className="font-mono text-[10px] bg-bg-muted border border-border-theme px-1 py-0.5 rounded text-text-theme">{log.recordId}</span> },
                { header: "Vetting IP", accessor: (log: any) => log.ipAddress || "N/A" },
              ]}
              searchPlaceholder="Filter audit trail..."
              searchField="actionType"
              emptyStateTitle="No audits recorded"
            />
          </div>
        </div>
      )}

      {/* ------------------ OPERATIONS ADMIN DASHBOARD ------------------ */}
      {user.roleName === "Operations Admin" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Allocated Quotas"
              value={`${allocatedQuota} Placed`}
              description={`Out of ${totalQuota} total foreign slots`}
              iconName="Briefcase"
              trend={{ value: "4.8%", isPositive: true }}
            />
            <StatCard
              title="Candidates Under Review"
              value={activeApplicants}
              description="Vetting & compliance active files"
              iconName="Users"
            />
            <StatCard
              title="Mean Deployment Time"
              value="28 Days"
              description="From sourcing to boarding ticket"
              iconName="Clock"
            />
            <StatCard
              title="Active Agents Registered"
              value={`${activeAgents} / ${totalAgents}`}
              description="External recruitment partners"
              iconName="UserCheck"
            />
          </div>

          <div className="rounded-xl border border-border-theme bg-surface p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-theme mb-4">Foreign Job Orders Quota Utilization</h3>
            {jobOrders.length > 0 ? (
              <div className="space-y-4">
                {jobOrders.map((jo: any) => {
                  const percentage = jo.totalQuota > 0 ? Math.round((jo.allocatedQuota / jo.totalQuota) * 100) : 0;
                  return (
                    <div key={jo.id} className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-text-theme">
                          {jo.employerName} - <span className="text-text-soft">{jo.trade} ({jo.country})</span>
                        </span>
                        <span className="text-text-muted">
                          {jo.allocatedQuota} / {jo.totalQuota} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary-theme transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-text-soft">No Job Orders registered in database yet.</p>
            )}
          </div>
        </div>
      )}

      {/* ------------------ HR OFFICER DASHBOARD ------------------ */}
      {user.roleName === "HR Officer" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Sourced & Interviewed"
              value={appliedCount + interviewedCount}
              description="Awaiting official foreign selection"
              iconName="Users"
            />
            <StatCard
              title="Foreign Selections"
              value={selectedCount}
              description="Awaiting medical center schedules"
              iconName="UserCheck"
            />
            <StatCard
              title="Open Demands (Trades)"
              value={openJobOrders}
              description="Active foreign recruitment quotas"
              iconName="Briefcase"
            />
            <StatCard
              title="Total Candidates Placed"
              value={totalPlacedCount}
              description="Lifetime recruitments logged"
              iconName="TrendingUp"
            />
          </div>

          <div className="rounded-xl border border-border-theme bg-surface p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-theme mb-4">Urgent Pre-Selection Screening Queue</h3>
            <DataTable<any>
              data={recruitmentQueue}
              columns={[
                { header: "Candidate Name", accessor: (a: any) => a.fullName },
                { header: "Passport No.", accessor: (a: any) => a.passportNumber },
                { header: "Applied Trade", accessor: (a: any) => a.trade },
                { header: "Status Stage", accessor: (a: any) => <StatusBadge status={a.currentStage} /> },
                { header: "Submission Date", accessor: (a: any) => a.createdAt },
              ]}
              searchPlaceholder="Filter queue..."
              searchField="fullName"
            />
          </div>
        </div>
      )}

      {/* ------------------ DOCUMENTATION OFFICER DASHBOARD ------------------ */}
      {user.roleName === "Documentation Officer" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Pending Document Approvals"
              value={pendingDocumentCount}
              description="Awaiting verification & seal audits"
              iconName="FileText"
              trend={{ value: "15%", isPositive: false }}
            />
            <StatCard
              title="Completed Verifications"
              value={verifiedDocumentCount}
              description="Audited compliance records"
              iconName="ShieldCheck"
            />
            <StatCard
              title="Pending Medical Appointments"
              value={medicalWaitingCount}
              description="Embassy approved labs"
              iconName="Clock"
            />
            <StatCard
              title="Medical fit"
              value={medicalFitCount}
              description="Passed bio-metric clearance"
              iconName="UserCheck"
            />
          </div>

          <div className="rounded-xl border border-border-theme bg-surface p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-theme mb-4">Pending Vetting Reviews</h3>
            {pendingDocumentApplicants.length > 0 ? (
              <div className="divide-y divide-border-theme">
                {pendingDocumentApplicants.map((app: any) => (
                  <div key={app.id} className="py-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-text-theme">{app.fullName}</h4>
                      <p className="text-[10px] text-text-soft">passport: {app.passportNumber} • Trade: {app.trade}</p>
                    </div>
                    <div className="flex gap-2">
                      {app.documents.map((d: any) => (
                        <span key={d.id} className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-[9px] font-bold text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400">
                          {d.documentType} ({d.fileName})
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-soft py-2">No documents currently pending audit review.</p>
            )}
          </div>
        </div>
      )}

      {/* ------------------ VISA OFFICER DASHBOARD ------------------ */}
      {user.roleName === "Visa Officer" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Visa Packets Sent"
              value={visaSubmittedCount}
              description="Awaiting consulate stickers"
              iconName="FileText"
            />
            <StatCard
              title="Visa Stamps Recorded"
              value={visaStampedCount}
              description="Sticker matches locked"
              iconName="UserCheck"
            />
            <StatCard
              title="Embassy Refusals"
              value={visaRejectedCount}
              description="Appeals pipeline active"
              iconName="AlertTriangle"
            />
            <StatCard
              title="Awaiting Embassy Packets"
              value={clearedForVisaCount}
              description="Cleared for consulate submittal"
              iconName="Clock"
            />
          </div>

          <div className="rounded-xl border border-border-theme bg-surface p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-theme mb-4">Embassy Consulate Packets List</h3>
            <DataTable<any>
              data={visaQueue}
              columns={[
                { header: "Candidate", accessor: (a: any) => a.fullName },
                { header: "Passport No.", accessor: (a: any) => a.passportNumber },
                { header: "Target Country", accessor: (a: any) => a.country },
                { header: "Consulate Stage", accessor: (a: any) => <StatusBadge status={a.currentStage} /> },
                { header: "Expiry Warning", accessor: (a: any) => a.passportExpiry },
              ]}
              searchPlaceholder="Search embassy status..."
              searchField="fullName"
            />
          </div>
        </div>
      )}

      {/* ------------------ ACCOUNTS OFFICER DASHBOARD ------------------ */}
      {user.roleName === "Accounts Officer" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Outstanding Receivables"
              value={`$${totalOutstanding.toLocaleString()}`}
              description="Active invoice collections"
              iconName="CreditCard"
              trend={{ value: "10%", isPositive: false }}
            />
            <StatCard
              title="Total Fees Billed"
              value={`$${totalInvoiced.toLocaleString()}`}
              description="Logistics & logistics fees"
              iconName="TrendingUp"
            />
            <StatCard
              title="Cash Balance Collected"
              value={`$${totalCollected.toLocaleString()}`}
              description="Bank transfers & cash receipts"
              iconName="UserCheck"
            />
            <StatCard
              title="Commissions Due"
              value={`$${pendingCommissions.toLocaleString()}`}
              description={`Paid commissions: $${paidCommissions.toLocaleString()}`}
              iconName="Percent"
            />
          </div>

          <div className="rounded-xl border border-border-theme bg-surface p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-theme mb-4">Pending Invoice Ledgers</h3>
            <DataTable<any>
              data={pendingInvoices}
              columns={[
                { header: "Invoice Number", accessor: (inv: any) => inv.invoiceNo },
                { header: "Applicant Name", accessor: (inv: any) => inv.applicantId },
                { header: "Billed Total", accessor: (inv: any) => `$${inv.amount.toLocaleString()}` },
                { header: "Outstanding Balance", accessor: (inv: any) => (
                  <span className={`font-semibold ${inv.outstanding > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    ${inv.outstanding.toLocaleString()}
                  </span>
                )},
                { header: "Due Date", accessor: (inv: any) => inv.dueDate },
              ]}
              searchPlaceholder="Search invoices..."
              searchField="invoiceNo"
            />
          </div>
        </div>
      )}

      {/* ------------------ AGENT DASHBOARD ------------------ */}
      {user.roleName === "Agent" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="My Candidates Sourced"
              value={ownTotalApplicants}
              description="Total registrations submitted"
              iconName="Users"
            />
            <StatCard
              title="Active Pipelines"
              value={ownActiveApplicants - ownDeployedApplicants}
              description="Logistics & visa processing"
              iconName="Clock"
            />
            <StatCard
              title="Total Commission Earned"
              value={`$${ownCommissionAccrued.toLocaleString()}`}
              description="All submitted candidates"
              iconName="Percent"
            />
            <StatCard
              title="Paid Commissions"
              value={`$${ownCommissionPaid.toLocaleString()}`}
              description="Cleared to bank account"
              iconName="UserCheck"
            />
          </div>

          <div className="rounded-xl border border-border-theme bg-surface p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-theme mb-4">My Sourced Candidate Statuses</h3>
            <DataTable<any>
              data={ownApplicants}
              columns={[
                { header: "Candidate Name", accessor: (a: any) => a.fullName },
                { header: "Passport No.", accessor: (a: any) => a.passportNumber },
                { header: "Trade", accessor: (a: any) => a.trade },
                { header: "Current Stage", accessor: (a: any) => <StatusBadge status={a.currentStage} /> },
                { header: "Archived Status", accessor: (a: any) => a.isArchived ? <span className="text-rose-600 font-semibold">Archived</span> : <span className="text-emerald-600 font-semibold">Active</span> },
              ]}
              searchPlaceholder="Filter my candidates..."
              searchField="fullName"
            />
          </div>
        </div>
      )}
    </div>
  );
}
