"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMockAuth } from "@/context/MockAuthContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable } from "@/components/shared/DataTable";
import {
  MOCK_APPLICANTS,
  MOCK_JOB_ORDERS,
  MOCK_INVOICES,
  MOCK_RECEIPTS,
  MOCK_COMMISSIONS,
  MOCK_AUDIT_LOGS,
  MOCK_AGENTS,
  WORKFLOW_LABELS,
  WorkflowStage,
} from "@/lib/mockData";
import {
  TrendingUp,
  AlertTriangle,
  History,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useMockAuth();
  const router = useRouter();

  // If Applicant, redirect to their personal portal immediately
  useEffect(() => {
    if (user.roleName === "Applicant") {
      router.push("/applicant/portal");
    }
  }, [user, router]);

  if (user.roleName === "Applicant") {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mx-auto"></div>
          <p className="text-xs text-slate-500">Redirecting to Applicant Portal...</p>
        </div>
      </div>
    );
  }

  // --- Calculations for Widgets ---
  const activeApplicants = MOCK_APPLICANTS.filter((a) => !a.isArchived).length;
  const archivedApplicants = MOCK_APPLICANTS.filter((a) => a.isArchived).length;

  const totalAgents = MOCK_AGENTS.length;
  const activeAgents = MOCK_AGENTS.filter((a) => a.isActive).length;

  const totalJobOrders = MOCK_JOB_ORDERS.length;
  const openJobOrders = MOCK_JOB_ORDERS.filter((jo) => jo.status === "OPEN").length;
  
  // Total quota allocation
  const totalQuota = MOCK_JOB_ORDERS.reduce((acc, jo) => acc + jo.totalQuota, 0);
  const allocatedQuota = MOCK_JOB_ORDERS.reduce((acc, jo) => acc + jo.allocatedQuota, 0);

  // Financial Stats
  const totalInvoiced = MOCK_INVOICES.reduce((acc, inv) => acc + inv.amount, 0);
  const totalOutstanding = MOCK_INVOICES.reduce((acc, inv) => acc + inv.outstanding, 0);
  const totalCollected = MOCK_RECEIPTS.reduce((acc, rec) => acc + rec.amountPaid, 0);

  // Commission Stats
  const paidCommissions = MOCK_COMMISSIONS.filter((c) => c.status === "PAID").reduce((acc, c) => acc + c.amount, 0);
  const pendingCommissions = MOCK_COMMISSIONS.filter((c) => c.status === "ACCRUED").reduce((acc, c) => acc + c.amount, 0);

  // Pipeline funnel counts
  const stageCounts = MOCK_APPLICANTS.reduce((acc, app) => {
    acc[app.currentStage] = (acc[app.currentStage] || 0) + 1;
    return acc;
  }, {} as Record<WorkflowStage, number>);

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
            <div className="lg:col-span-2 rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-indigo-500" /> Pipeline Stage Distribution
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {(["SELECTED", "MEDICAL_WAITING", "VISA_SUBMITTED", "DEPLOYED"] as WorkflowStage[]).map((stage) => {
                  const count = stageCounts[stage] || 0;
                  const label = WORKFLOW_LABELS[stage];
                  return (
                    <div key={stage} className="rounded-lg bg-slate-50 p-4 border border-slate-100 dark:bg-slate-950 dark:border-slate-800/60">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">{label}</p>
                      <h4 className="mt-2 text-2xl font-bold text-slate-800 dark:text-white">{count}</h4>
                      <p className="text-[9px] text-slate-400 mt-1">Candidates in stage</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Warning Widget */}
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-amber-500" /> Alerts & Vetting Warnings
                </h3>
                <p className="text-xs text-slate-500">System automated notifications indicating potential bottlenecks.</p>
                <div className="mt-4 space-y-3">
                  <div className="flex gap-2 rounded-lg bg-rose-50/50 p-2.5 border border-rose-100/50 dark:bg-rose-950/10 dark:border-rose-900/10">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                    <p className="text-[10px] text-rose-700 dark:text-rose-400">
                      Candidate Tariqul Anam passport expires in &lt; 2 months. Urgent action required.
                    </p>
                  </div>
                  <div className="flex gap-2 rounded-lg bg-amber-50/50 p-2.5 border border-amber-100/50 dark:bg-amber-950/10 dark:border-amber-900/10">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400">
                      Jasim Uddin medical report flagged as <strong>UNFIT</strong>. Stage halted.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                <span>Last updated: Just now</span>
                <span className="font-semibold text-indigo-600 cursor-pointer dark:text-indigo-400">Resolve all</span>
              </div>
            </div>
          </div>

          {/* Immutable Audit Logs widget */}
          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <History className="h-4.5 w-4.5 text-indigo-500" /> Recent Immutable System Audits
            </h3>
            <DataTable
              data={MOCK_AUDIT_LOGS}
              columns={[
                { header: "Timestamp", accessor: (log) => new Date(log.timestamp).toLocaleString() },
                { header: "Staff Member", accessor: (log) => `${log.userId} (${log.roleName})` },
                { header: "Action", accessor: (log) => <span className="font-semibold text-slate-900 dark:text-white">{log.actionType}</span> },
                { header: "Module", accessor: (log) => log.tableName },
                { header: "Vetting Record", accessor: (log) => <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded dark:bg-slate-800">{log.recordId}</span> },
                { header: "Vetting IP", accessor: (log) => log.ipAddress || "N/A" },
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
              value={MOCK_APPLICANTS.filter((a) => a.currentStage !== "DEPLOYED" && !a.isArchived).length}
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

          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Foreign Job Orders Quota Utilization</h3>
            <div className="space-y-4">
              {MOCK_JOB_ORDERS.map((jo) => {
                const percentage = Math.round((jo.allocatedQuota / jo.totalQuota) * 100);
                return (
                  <div key={jo.id} className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-200">
                        {jo.employerName} - <span className="text-slate-500">{jo.trade} ({jo.country})</span>
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">
                        {jo.allocatedQuota} / {jo.totalQuota} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ------------------ HR OFFICER DASHBOARD ------------------ */}
      {user.roleName === "HR Officer" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Sourced & Interviewed"
              value={MOCK_APPLICANTS.filter((a) => a.currentStage === "APPLIED" || a.currentStage === "INTERVIEWED").length}
              description="Awaiting official foreign selection"
              iconName="Users"
            />
            <StatCard
              title="Foreign Selections"
              value={MOCK_APPLICANTS.filter((a) => a.currentStage === "SELECTED").length}
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
              value={MOCK_APPLICANTS.length}
              description="Lifetime recruitments logged"
              iconName="TrendingUp"
            />
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Urgent Pre-Selection Screening Queue</h3>
            <DataTable
              data={MOCK_APPLICANTS.filter((a) => a.currentStage === "APPLIED" || a.currentStage === "INTERVIEWED")}
              columns={[
                { header: "Candidate Name", accessor: (a) => a.fullName },
                { header: "Passport No.", accessor: (a) => a.passportNumber },
                { header: "Applied Trade", accessor: (a) => a.trade },
                { header: "Status Stage", accessor: (a) => <StatusBadge status={a.currentStage} /> },
                { header: "Submission Date", accessor: () => "2026-05-20" },
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
              value={
                MOCK_APPLICANTS.reduce(
                  (acc, app) => acc + app.documents.filter((d) => d.status === "PENDING_VERIFICATION").length,
                  0
                )
              }
              description="Awaiting verification & seal audits"
              iconName="FileText"
              trend={{ value: "15%", isPositive: false }}
            />
            <StatCard
              title="Completed Verifications"
              value={
                MOCK_APPLICANTS.reduce(
                  (acc, app) => acc + app.documents.filter((d) => d.status === "VERIFIED").length,
                  0
                )
              }
              description="Audited compliance records"
              iconName="ShieldCheck"
            />
            <StatCard
              title="Pending Medical Appointments"
              value={MOCK_APPLICANTS.filter((a) => a.currentStage === "MEDICAL_WAITING").length}
              description="Embassy approved labs"
              iconName="Clock"
            />
            <StatCard
              title="Medical fit"
              value={MOCK_APPLICANTS.filter((a) => a.currentStage === "MEDICAL_FIT").length}
              description="Passed bio-metric clearance"
              iconName="UserCheck"
            />
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Pending Vetting Reviews</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {MOCK_APPLICANTS.filter((app) => app.documents.some((d) => d.status === "PENDING_VERIFICATION")).map((app) => (
                <div key={app.id} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white">{app.fullName}</h4>
                    <p className="text-[10px] text-slate-400">passport: {app.passportNumber} • Trade: {app.trade}</p>
                  </div>
                  <div className="flex gap-2">
                    {app.documents
                      .filter((d) => d.status === "PENDING_VERIFICATION")
                      .map((d) => (
                        <span key={d.id} className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-[9px] font-bold text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400">
                          {d.documentType} ({d.fileName})
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------ VISA OFFICER DASHBOARD ------------------ */}
      {user.roleName === "Visa Officer" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Visa Packets Sent"
              value={MOCK_APPLICANTS.filter((a) => a.currentStage === "VISA_SUBMITTED").length}
              description="Awaiting consulate stickers"
              iconName="FileText"
            />
            <StatCard
              title="Visa Stamps Recorded"
              value={MOCK_APPLICANTS.filter((a) => a.currentStage === "VISA_STAMPED").length}
              description="Sticker matches locked"
              iconName="UserCheck"
            />
            <StatCard
              title="Embassy Refusals"
              value={MOCK_APPLICANTS.filter((a) => a.currentStage === "VISA_REJECTED").length}
              description="Appeals pipeline active"
              iconName="AlertTriangle"
            />
            <StatCard
              title="Awaiting Embassy Packets"
              value={MOCK_APPLICANTS.filter((a) => a.currentStage === "MEDICAL_FIT" || a.currentStage === "TRAINING_COMPLETED").length}
              description="Cleared for consulate submittal"
              iconName="Clock"
            />
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Embassy Consulate Packets List</h3>
            <DataTable
              data={MOCK_APPLICANTS.filter((a) => a.currentStage === "VISA_SUBMITTED" || a.currentStage === "VISA_STAMPED" || a.currentStage === "VISA_REJECTED")}
              columns={[
                { header: "Candidate", accessor: (a) => a.fullName },
                { header: "Passport No.", accessor: (a) => a.passportNumber },
                { header: "Target Country", accessor: () => "Saudi Arabia" },
                { header: "Consulate Stage", accessor: (a) => <StatusBadge status={a.currentStage} /> },
                { header: "Expiry Warning", accessor: (a) => a.passportExpiry },
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

          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Pending Invoice Ledgers</h3>
            <DataTable
              data={MOCK_INVOICES}
              columns={[
                { header: "Invoice Number", accessor: (inv) => inv.invoiceNo },
                { header: "Applicant ID", accessor: (inv) => inv.applicantId },
                { header: "Billed Total", accessor: (inv) => `$${inv.amount.toLocaleString()}` },
                { header: "Outstanding Balance", accessor: (inv) => (
                  <span className={`font-semibold ${inv.outstanding > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    ${inv.outstanding.toLocaleString()}
                  </span>
                )},
                { header: "Due Date", accessor: (inv) => inv.dueDate },
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
              value={MOCK_APPLICANTS.filter((a) => a.agentId === user.agentCode).length}
              description="Total registrations submitted"
              iconName="Users"
            />
            <StatCard
              title="Active Pipelines"
              value={MOCK_APPLICANTS.filter((a) => a.agentId === user.agentCode && !a.isArchived && a.currentStage !== "DEPLOYED").length}
              description="Logistics & visa processing"
              iconName="Clock"
            />
            <StatCard
              title="Total Commission Earned"
              value={`$${MOCK_COMMISSIONS.filter((c) => c.agentId === user.agentCode).reduce((acc, c) => acc + c.amount, 0).toLocaleString()}`}
              description="All submitted candidates"
              iconName="Percent"
            />
            <StatCard
              title="Paid Commissions"
              value={`$${MOCK_COMMISSIONS.filter((c) => c.agentId === user.agentCode && c.status === "PAID").reduce((acc, c) => acc + c.amount, 0).toLocaleString()}`}
              description="Cleared to bank account"
              iconName="UserCheck"
            />
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">My Sourced Candidate Statuses</h3>
            <DataTable
              data={MOCK_APPLICANTS.filter((a) => a.agentId === user.agentCode)}
              columns={[
                { header: "Candidate Name", accessor: (a) => a.fullName },
                { header: "Passport No.", accessor: (a) => a.passportNumber },
                { header: "Trade", accessor: (a) => a.trade },
                { header: "Current Stage", accessor: (a) => <StatusBadge status={a.currentStage} /> },
                { header: "Archived Status", accessor: (a) => a.isArchived ? <span className="text-rose-600 font-semibold">Archived</span> : <span className="text-emerald-600 font-semibold">Active</span> },
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
