"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/ui/StatCard";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { useMockAuth } from "@/context/MockAuthContext";
import { CheckCircle, FileSpreadsheet, Loader2, AlertCircle, ShieldAlert } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useDialog } from "@/context/DialogContext";
import { useT } from "@/i18n/useT";
import { formatCurrency, formatDate } from "@/i18n/format";

interface FlattenedCommission {
  id: string;
  agentId: string;
  agentCode: string;
  agentName: string;
  applicantId: string;
  applicantName: string;
  passportNumber: string;
  jobOrderId: string;
  jobOrderNumber: string;
  country: string;
  trade: string;
  amount: number;
  status: "ACCRUED" | "PAID" | "CANCELLED";
  payoutRef: string | null;
  payoutDate: string | null;
  createdAt: string;
}

export default function CommissionsPage() {
  const { accessToken, activeRoleName } = useMockAuth();
  const toast = useToast();
  const { prompt } = useDialog();
  const { t, locale } = useT();

  const isAgent = activeRoleName === "Agent";
  const isStaffOrAdmin = ["Super Admin", "Operations Admin", "Accounts Officer"].includes(activeRoleName);

  const [commissionsList, setCommissionsList] = useState<FlattenedCommission[]>([]);
  const [stats, setStats] = useState({
    totalAccrued: 0,
    totalPaid: 0,
    totalPending: 0,
    totalCancelled: 0,
    totalCommissions: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Accrual Loading state
  const [accruing, setAccruing] = useState(false);

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!accessToken) return;
    setIsExporting(true);
    try {
      const url = `/api/exports/commissions?status=${statusFilter}`;
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
      link.setAttribute("download", `commissions_export_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success(
        locale === "bn"
          ? "কমিশন রেজিস্ট্রি সফলভাবে এক্সপোর্ট করা হয়েছে!"
          : "Commissions register exported successfully!"
      );
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred during export.");
    } finally {
      setIsExporting(false);
    }
  };

  const fetchCommissions = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/finance/commissions", window.location.origin);
      url.searchParams.set("pageSize", "1000");
      if (statusFilter !== "ALL") {
        url.searchParams.set("status", statusFilter);
      }

      const res = await fetch(url.toString(), {
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
        throw new Error(errorData.error || "Failed to load commissions register.");
      }

      const data = await res.json();
      setCommissionsList(data.data || []);
      setStats({
        totalAccrued: data.stats?.totalAccrued || 0,
        totalPaid: data.stats?.totalPaid || 0,
        totalPending: data.stats?.totalPending || 0,
        totalCancelled: data.stats?.totalCancelled || 0,
        totalCommissions: data.stats?.totalCommissions || 0,
      });
    } catch (err: any) {
      console.error("Error fetching commissions:", err);
      setError(err.message || "An unexpected error occurred while loading commissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [accessToken, statusFilter]);

  const handleAccrue = async () => {
    if (accruing) return;
    setAccruing(true);
    try {
      const res = await fetch("/api/finance/commissions/accrue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to trigger commission auto-accrual.");
      }

      const data = await res.json();
      toast.success(
        locale === "bn"
          ? `কমিশন প্লেসমেন্ট স্ক্যান সম্পন্ন! ${data.count} টি নতুন প্লেসমেন্ট গণনা করা হয়েছে।`
          : `Commission placement scan complete! Accrued ${data.count} new placements.`
      );
      await fetchCommissions();
    } catch (err: any) {
      console.error("Error running accrual scan:", err);
      toast.error(err.message || "An unexpected error occurred while running accrual scan.");
    } finally {
      setAccruing(false);
    }
  };

  const handlePayoutRelease = async (commissionId: string) => {
    if (!accessToken) return;

    const payoutRefVal = await prompt({
      title: t("commissions.releaseModalTitle"),
      description: t("commissions.releaseModalDesc"),
      placeholder: locale === "bn" ? "যেমন: BANK-COMM-001" : "e.g. BANK-COMM-001",
      confirmLabel: t("commissions.releasePayoutBtn"),
      cancelLabel: t("common.cancel"),
      isDanger: false,
    });

    if (payoutRefVal === null) return; // Cancelled
    const trimmedRef = payoutRefVal.trim();
    if (!trimmedRef) {
      toast.error(locale === "bn" ? "ভাউচার রেফারেন্স কোড প্রয়োজনীয়।" : "Voucher reference code is required.");
      return;
    }

    try {
      const todayDate = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/finance/commissions/${commissionId}/payout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          payoutRef: trimmedRef,
          payoutDate: todayDate,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to settle commission payout.");
      }

      toast.success(
        locale === "bn"
          ? "কমিশন পেমেন্ট সফলভাবে সম্পন্ন হয়েছে এবং ভাউচার রেকর্ড করা হয়েছে।"
          : "Commission payout settled and transfer voucher recorded."
      );
      await fetchCommissions();
    } catch (err: any) {
      console.error("Error settling payout:", err);
      toast.error(err.message || "An unexpected error occurred during settlement.");
    }
  };

  const tableColumns = [
    {
      header: t("commissions.tableHeaderAgent"),
      accessor: (com: FlattenedCommission) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-text-theme">{com.agentName}</span>
          <span className="text-[10px] text-text-muted">
            {locale === "bn" ? "এজেন্ট কোড: " : "Agent Code: "}{com.agentCode}
          </span>
        </div>
      ),
    },
    {
      header: t("commissions.tableHeaderApplicant"),
      accessor: (com: FlattenedCommission) => com.applicantName,
    },
    {
      header: t("commissions.tableHeaderOrder"),
      accessor: (com: FlattenedCommission) => com.jobOrderNumber,
    },
    {
      header: t("commissions.tableHeaderAmount"),
      accessor: (com: FlattenedCommission) => (
        <span className="font-bold text-text-theme">
          {formatCurrency(com.amount, "BDT", locale)}
        </span>
      ),
      cellClassName: "text-right",
    },
    {
      header: t("commissions.tableHeaderStatus"),
      accessor: (com: FlattenedCommission) => <StatusBadge status={com.status} />,
    },
    {
      header: t("commissions.tableHeaderPayoutRef"),
      accessor: (com: FlattenedCommission) =>
        com.payoutRef ? (
          <div className="flex flex-col gap-0.5 text-[10px] text-text-muted">
            <span className="font-mono font-bold text-text-theme">{com.payoutRef}</span>
            <span>
              {locale === "bn" ? "তারিখ: " : "Date: "}{formatDate(com.payoutDate, locale)}
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-text-muted">
            {locale === "bn" ? "অ্যাকাউন্টস রিলিজের অপেক্ষায়" : "Awaiting accounts release"}
          </span>
        ),
    },
  ];

  // Settle Actions column is restricted strictly to accounts staff roles
  if (isStaffOrAdmin) {
    tableColumns.push({
      header: locale === "bn" ? "নিষ্পত্তি অ্যাকশন" : "Settlement actions",
      accessor: (com: FlattenedCommission) => {
        return com.status === "ACCRUED" ? (
          <button
            onClick={() => handlePayoutRelease(com.id)}
            className="flex items-center gap-1 rounded bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20"
          >
            <CheckCircle className="h-3 w-3 shrink-0" /> {t("commissions.releasePayoutBtn")}
          </button>
        ) : (
          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
            {locale === "bn" ? "নিষ্পত্তি হয়েছে" : "Settled"}
          </span>
        );
      },
      cellClassName: "text-right",
    });
  }

  const isBlockedRole = activeRoleName === "Applicant";

  if (isBlockedRole || error === "FORBIDDEN") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 flex items-center justify-center shadow-md animate-bounce">
          <ShieldAlert className="h-8 w-8 text-rose-500" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-lg font-bold text-text-theme">{t("common.accessDenied")}</h2>
          <p className="text-xs text-text-muted">
            {locale === "bn"
              ? "প্রার্থীদের জন্য এজেন্ট প্লেসমেন্ট কমিশন রেজিস্ট্রি, ক্লিয়ারিং হাউস ব্যালেন্স এবং পেআউট সেটলিং-এ প্রবেশাধিকার লক করা রয়েছে।"
              : "Access to agent placement commission registers, clearing house balances, and payout settling is locked for candidates."}
          </p>
        </div>
      </div>
    );
  }

  // Calculate sum metric total placements billed (total accrued + total paid)
  const totalBilled = stats.totalAccrued + stats.totalPaid;

  return (
    <div className="space-y-6">
      <PermissionGate permission="VIEW_COMMISSIONS" showFallback={true}>
        <PageHeader
          title={
            isAgent
              ? locale === "bn"
                ? "আমার কমিশন বিবরণী"
                : "My Commission Statements"
              : t("commissions.pageTitle")
          }
          description={
            isAgent
              ? locale === "bn"
                ? "আপনার লাইসেন্সকৃত সোর্সিং অ্যাকাউন্টে অর্জিত এবং পরিশোধিত কমিশনের বিবরণ।"
                : "Overview of commissions accrued and settled to your licensed sourcing account."
              : t("commissions.pageDesc")
          }
          breadcrumbs={[
            { label: locale === "bn" ? "ইআরপি হাব" : "ERP Hub", href: "/dashboard" },
            { label: t("nav.commissions") },
          ]}
          actions={
            <div className="flex items-center gap-2">
              {isStaffOrAdmin && (
                <button
                  onClick={handleAccrue}
                  disabled={accruing}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-semibold text-white shadow transition-colors disabled:opacity-50"
                >
                  {accruing ? (
                    <Loader2 className="h-4 w-4 animate-spin animate-spin-fast" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {t("commissions.accrueEligibleBtn")}
                </button>
              )}
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
                {isExporting
                  ? locale === "bn"
                    ? "এক্সপোর্ট হচ্ছে..."
                    : "Exporting..."
                  : t("common.exportCsv")}
              </button>
            </div>
          }
        />

        {/* Dynamic Aggregates */}
        {loading && commissionsList.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="h-28 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title={
                isAgent
                  ? t("dashboard.myCandidatesSourced")
                  : locale === "bn"
                  ? "মোট বিলকৃত প্লেসমেন্ট"
                  : "Total Placements Billed"
              }
              value={formatCurrency(totalBilled, "BDT", locale)}
              description={
                locale === "bn"
                  ? "রেজিস্ট্রেশনের পর থেকে অর্জিত মোট কমিশন"
                  : "Commissions accrued since registration"
              }
              iconName="Percent"
            />
            <StatCard
              title={locale === "bn" ? "পরিশোধিত পেআউট" : "Cleared payouts"}
              value={formatCurrency(stats.totalPaid, "BDT", locale)}
              description={locale === "bn" ? "ব্যাংক অ্যাকাউন্টে স্থানান্তরিত" : "Transferred to bank accounts"}
              iconName="CheckCircle"
            />
            <StatCard
              title={locale === "bn" ? "বকেয়া পেআউট" : "Outstanding payouts"}
              value={formatCurrency(stats.totalPending, "BDT", locale)}
              description={
                locale === "bn"
                  ? "মাইলস্টোন ক্লিয়ারেন্সের জন্য অপেক্ষমান"
                  : "Accrued pending milestone clearance"
              }
              iconName="CreditCard"
            />
          </div>
        )}

        {/* Commissions Register List */}
        <div className="rounded-xl border border-border-theme bg-surface p-6 shadow-sm">
          <h3 className="text-xs font-bold text-text-theme uppercase tracking-wider mb-4">
            {isAgent
              ? locale === "bn"
                ? "কমিশন বিবরণী লেজার"
                : "Commission Statement Ledger"
              : locale === "bn"
              ? "এজেন্ট সরবরাহ কমিশন পেআউট লগ"
              : "Agent Supply Commission Payout Log"}
          </h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="h-7 w-7 text-indigo-600 animate-spin" />
              <p className="text-xs text-slate-500 font-bold">
                {locale === "bn"
                  ? "এজেন্ট কমিশন লেজার সিঙ্ক করা হচ্ছে..."
                  : "Synchronizing agent commissions ledger..."}
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-rose-50/50 dark:bg-rose-950/5 rounded-lg border border-rose-100 dark:border-rose-950/20">
              <AlertCircle className="h-10 w-10 text-rose-500" />
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-bold text-rose-900 dark:text-rose-400">
                  {locale === "bn" ? "কমিশন লোড করতে ব্যর্থ" : "Failed to Load Commissions"}
                </h4>
                <p className="text-xs text-rose-700/80 dark:text-rose-400/70">{error}</p>
              </div>
              <button
                onClick={fetchCommissions}
                className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-500"
              >
                {locale === "bn" ? "পুনরায় চেষ্টা করুন" : "Retry Synchronize"}
              </button>
            </div>
          ) : (
            <DataTable
              data={commissionsList}
              columns={tableColumns}
              searchPlaceholder={
                locale === "bn"
                  ? "প্রার্থীর নাম দিয়ে খুঁজুন..."
                  : "Search entries by candidate name..."
              }
              searchField="applicantName"
              emptyStateTitle={locale === "bn" ? "কোনো কমিশন পাওয়া যায়নি" : "No commissions found"}
              emptyStateDescription={
                locale === "bn"
                  ? "স্বয়ংক্রিয়া কমিশন স্ক্যানিং সক্রিয় করতে প্রার্থীর কাজের ধাপ এবং প্লেসমেন্ট মাইলস্টোন যাচাই করুন।"
                  : "Verify candidate workflow stages and placement milestones to trigger automatic commission scanning."
              }
              filterComponent={
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="app-select rounded-lg border border-border-theme px-3 py-1.5 text-xs font-semibold text-text-theme outline-none focus:border-indigo-500"
                >
                  <option value="ALL">{locale === "bn" ? "সকল স্ট্যাটাস" : "All Statuses"}</option>
                  <option value="ACCRUED">
                    {locale === "bn" ? "অর্জিত কমিশন" : "Accrued commissions"}
                  </option>
                  <option value="PAID">
                    {locale === "bn" ? "পরিশোধিত পেআউট" : "Settled payouts"}
                  </option>
                  <option value="CANCELLED">
                    {locale === "bn" ? "বাতিলকৃত লগ" : "Cancelled logs"}
                  </option>
                </select>
              }
            />
          )}
        </div>
      </PermissionGate>
    </div>
  );
}
