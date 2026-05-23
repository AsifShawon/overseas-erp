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
import { useT } from "@/i18n/useT";
import { formatCurrency, formatDateTime } from "@/i18n/format";

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
  const { t, locale } = useT();

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
        throw new Error(errData.error || (locale === "bn" ? "সিএসভি এক্সপোর্ট ফাইল তৈরি করতে ব্যর্থ হয়েছে।" : "Failed to generate CSV export"));
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `ledger_export_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success(locale === "bn" ? "অ্যাকাউন্টস লেজার সফলভাবে এক্সপোর্ট করা হয়েছে!" : "Accounts ledger exported successfully!");
    } catch (err: any) {
      toast.error(err.message || (locale === "bn" ? "এক্সপোর্ট করার সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।" : "An unexpected error occurred during export."));
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
        throw new Error(errorData.error || (locale === "bn" ? "অ্যাকাউন্টস লেজার লোড করতে ব্যর্থ হয়েছে।" : "Failed to load accounts ledger."));
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
      setError(err.message || (locale === "bn" ? "অ্যাকাউন্ট লোড করার সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।" : "An unexpected error occurred while loading accounts."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgers();
  }, [accessToken]);

  const tableColumns = [
    {
      header: t("accounts.tableHeaderApplicant"),
      accessor: (entry: FlattenedLedger) => (
        <div className="flex flex-col gap-0.5 text-text-theme">
          <span className="font-semibold text-text-theme">{entry.applicantName}</span>
          <span className="text-[10px] text-text-muted">
            {locale === "bn" ? "পাসপোর্ট" : "Passport"}: {entry.passportNumber}
          </span>
        </div>
      ),
    },
    {
      header: t("accounts.tableHeaderTimestamp"),
      accessor: (entry: FlattenedLedger) => formatDateTime(entry.timestamp, locale),
    },
    {
      header: t("accounts.tableHeaderType"),
      accessor: (entry: FlattenedLedger) => <StatusBadge status={entry.transactionType} />,
    },
    {
      header: t("accounts.tableHeaderRef"),
      accessor: (entry: FlattenedLedger) => (
        <span className="font-mono font-bold text-text-theme">{entry.referenceNo}</span>
      ),
    },
    {
      header: t("accounts.tableHeaderDebit"),
      accessor: (entry: FlattenedLedger) => (
        <span className="text-rose-600 font-semibold">
          {entry.debit > 0 ? formatCurrency(entry.debit, "BDT", locale) : "-"}
        </span>
      ),
      cellClassName: "text-right",
    },
    {
      header: t("accounts.tableHeaderCredit"),
      accessor: (entry: FlattenedLedger) => (
        <span className="text-emerald-600 font-semibold">
          {entry.credit > 0 ? formatCurrency(entry.credit, "BDT", locale) : "-"}
        </span>
      ),
      cellClassName: "text-right",
    },
    {
      header: t("accounts.tableHeaderBalance"),
      accessor: (entry: FlattenedLedger) => (
        <span className="font-bold text-text-theme">
          {formatCurrency(entry.runningBalance, "BDT", locale)}
        </span>
      ),
      cellClassName: "text-right",
    },
  ];

  // Render 403 Forbidden specifically or custom Perms gate
  const isBlockedRole = activeRoleName === "Agent" || activeRoleName === "Applicant";

  const accessLockedMessage = locale === "bn"
    ? "করপোরেট অ্যাকাউন্টস লগ, ব্যালেন্স শিট এবং অডিট রসিদে প্রবেশাধিকার সোর্সিং এজেন্ট এবং প্রার্থীদের জন্য লক করা রয়েছে।"
    : "Access to corporate accounts logs, balance sheets, and audit receipts is locked for recruitment officers, agents, and candidates.";

  if (isBlockedRole || error === "FORBIDDEN") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 flex items-center justify-center shadow-md animate-bounce">
          <ShieldAlert className="h-8 w-8 text-rose-500" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-lg font-bold text-text-theme">
            {locale === "bn" ? "প্রবেশাধিকার লক করা হয়েছে" : "Access Locked"}
          </h2>
          <p className="text-xs text-text-muted">
            {accessLockedMessage}
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
        fallbackMessage={accessLockedMessage}
      >
        <PageHeader
          title={t("accounts.pageTitle")}
          description={t("accounts.pageDesc")}
          breadcrumbs={[
            { label: locale === "bn" ? "ড্যাশবোর্ড" : "ERP Hub", href: "/dashboard" },
            { label: locale === "bn" ? "হিসাব খাতা" : "Accounts" }
          ]}
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
              {isExporting ? (locale === "bn" ? "এক্সপোর্ট হচ্ছে..." : "Exporting...") : (locale === "bn" ? "CSV এক্সপোর্ট" : "Export CSV")}
            </button>
          }
        />

        {/* Financial Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={locale === "bn" ? "মোট ইনভয়েসকৃত সার্ভিস ফি" : "Total Invoiced Package Fees"}
            value={formatCurrency(stats.totalBilled, "BDT", locale)}
            description={locale === "bn" ? "মোট বিলিং চার্জকৃত প্রার্থী হিসাব" : "Total billed candidate accounts"}
            iconName="TrendingUp"
          />
          <StatCard
            title={locale === "bn" ? "ক্যাশ ডেস্ক মোট সংগ্রহ" : "Cash Desk Collected"}
            value={formatCurrency(stats.totalCollected, "BDT", locale)}
            description={locale === "bn" ? "ইলেকট্রনিক ও নগদ সংগ্রহ সম্পন্ন" : "Electronic and cash payments cleared"}
            iconName="Landmark"
          />
          <StatCard
            title={locale === "bn" ? "মোট বকেয়া ব্যালেন্স" : "Outstanding Receivables"}
            value={formatCurrency(stats.totalOutstanding, "BDT", locale)}
            description={locale === "bn" ? "প্রার্থীদের থেকে মোট পাওনা বকেয়া" : "Remaining candidate arrears outstanding"}
            iconName="CreditCard"
          />
          <StatCard
            title={locale === "bn" ? "এজেন্ট কমিশন দায়সমূহ" : "Agent Commission Obligations"}
            value={formatCurrency(stats.totalCommissionsAccrued, "BDT", locale)}
            description={locale === "bn" ? "সোর্সিং পার্টনারদের প্রদেয় মোট কমিশন" : "Estimated payments outstanding to agents"}
            iconName="Percent"
          />
        </div>

        {/* Global Forensic Ledger Table */}
        <div className="rounded-xl border border-border-theme bg-surface p-6 shadow-sm">
          <h3 className="text-xs font-bold text-text-theme uppercase tracking-wider mb-4">
            {locale === "bn" ? "সমন্বিত ডাবল-এন্ট্রি লেজার লগ" : "Unified Double-Entry Ledger Logs"}
          </h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="h-7 w-7 text-indigo-600 animate-spin" />
              <p className="text-xs text-slate-500 font-bold">{locale === "bn" ? "ডাবল-এন্ট্রি লেনদেনসমূহ সিঙ্ক হচ্ছে..." : "Synchronizing double-entry transactions..."}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-rose-50/50 dark:bg-rose-950/5 rounded-lg border border-rose-100 dark:border-rose-950/20">
              <AlertCircle className="h-10 w-10 text-rose-500" />
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-bold text-rose-900 dark:text-rose-400">{locale === "bn" ? "লেজার লোড করতে ব্যর্থ" : "Failed to Load Ledger"}</h4>
                <p className="text-xs text-rose-700/80 dark:text-rose-400/70">{error}</p>
              </div>
              <button
                onClick={fetchLedgers}
                className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-500 cursor-pointer"
              >
                {locale === "bn" ? "পুনরায় চেষ্টা করুন" : "Retry Request"}
              </button>
            </div>
          ) : (
            <DataTable
              data={ledgers}
              columns={tableColumns}
              searchPlaceholder={t("accounts.searchPlaceholder")}
              searchField="applicantName"
              emptyStateTitle={locale === "bn" ? "কোনো লেজার লেনদেন রেকর্ড করা হয়নি" : "No ledger transactions recorded"}
              emptyStateDescription={locale === "bn" ? "প্রার্থীর নথির হিসাব ট্যাব থেকে ভাউচার ও কিস্তি পেমেন্ট অডিট করুন।" : "Verify candidate invoices and desk desk payment clearances under the dossier tab."}
            />
          )}
        </div>
      </PermissionGate>
    </div>
  );
}

