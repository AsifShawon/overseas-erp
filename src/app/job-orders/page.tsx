"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/ui/StatCard";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { useMockAuth } from "@/context/MockAuthContext";
import { useToast } from "@/context/ToastContext";
import { AppModal } from "@/components/ui/AppModal";
import { AppInput } from "@/components/ui/AppInput";
import { AppSelect } from "@/components/ui/AppSelect";
import { useT } from "@/i18n/useT";
import { formatCurrency, formatNumber } from "@/i18n/format";
import {
  MapPin,
  FileSpreadsheet,
  Plus,
  Loader2,
  AlertCircle,
  Edit,
  Activity,
  Briefcase,
  TrendingUp
} from "lucide-react";

interface JobOrder {
  id: string;
  orderNumber: string;
  employerName: string;
  country: string;
  trade: string;
  salary: number;
  totalQuota: number;
  allocatedQuota: number;
  remainingQuota: number;
  utilizationPercent: number;
  commissionAmount: number;
  status: "OPEN" | "CLOSED" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
  searchKey?: string;
}

// Currency mapping helper
const getCurrencyByCountry = (country: string) => {
  const c = country.trim().toLowerCase();
  if (c.includes("saudi") || c.includes("ksa")) return "SAR";
  if (c.includes("emirates") || c.includes("uae") || c.includes("dubai")) return "AED";
  if (c.includes("malaysia") || c.includes("mys")) return "MYR";
  if (c.includes("qatar") || c.includes("qat")) return "QAR";
  if (c.includes("oman") || c.includes("omn")) return "OMR";
  if (c.includes("singapore") || c.includes("sgp")) return "SGD";
  if (c.includes("kuwait") || c.includes("kwt")) return "KWD";
  if (c.includes("bahrain") || c.includes("bhr")) return "BHD";
  return "BDT";
};

export default function JobOrdersPage() {
  const { hasAccess, accessToken, activeRoleName } = useMockAuth();
  const toast = useToast();
  const { t, locale } = useT();

  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals & Form Submission States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Add Demand Form State
  const initialFormState = {
    employerName: "",
    country: "Saudi Arabia",
    trade: "",
    salary: "",
    currency: "SAR",
    totalQuota: "",
    commissionAmount: "",
    orderNumber: "",
    status: "OPEN" as "OPEN" | "CLOSED" | "COMPLETED",
  };
  const [formData, setFormData] = useState(initialFormState);

  // Edit Demand Form State
  const [selectedOrder, setSelectedOrder] = useState<JobOrder | null>(null);
  const [editForm, setEditForm] = useState({
    id: "",
    employerName: "",
    country: "",
    trade: "",
    salary: "",
    currency: "",
    totalQuota: "",
    commissionAmount: "",
    status: "OPEN" as "OPEN" | "CLOSED" | "COMPLETED",
  });

  // Fetch live Job Orders from dynamic API
  const fetchJobOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      // Fetch with high pageSize to get all for premium real-time client-side sorting and multi-field searching
      const res = await fetch("/api/job-orders?pageSize=1000", {
        method: "GET",
        headers,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          (locale === "bn" ? "জব অর্ডার রেজিস্ট্রি লোড করতে ব্যর্থ হয়েছে।" : "Failed to load job orders registry.")
        );
      }

      const data = await res.json();
      setJobOrders(data.data || []);
      setStats(data.stats || null);
    } catch (err: any) {
      console.error("Error fetching job orders:", err);
      setError(
        err.message || 
        (locale === "bn" ? "জব অর্ডার লোড করার সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।" : "An unexpected error occurred while loading job orders.")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchJobOrders();
    }
  }, [accessToken]);

  // Automated currency resolution based on country choice
  const handleCountryChange = (c: string) => {
    setFormData((prev) => {
      const curr = getCurrencyByCountry(c);
      return { ...prev, country: c, currency: curr };
    });
  };

  const handleEditCountryChange = (c: string) => {
    setEditForm((prev) => {
      const curr = getCurrencyByCountry(c);
      return { ...prev, country: c, currency: curr };
    });
  };

  // POST Request - Create dynamic Job Order
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setErrors({});

    // Client validations
    const validationErrors: Record<string, string> = {};
    if (!formData.employerName.trim()) {
      validationErrors.employerName = locale === "bn" ? "নিয়োগকর্তা / কোম্পানির নাম আবশ্যক" : "Employer/Company Name is required";
    }
    if (!formData.country.trim()) {
      validationErrors.country = locale === "bn" ? "দেশ আবশ্যক" : "Country is required";
    }
    if (!formData.trade.trim()) {
      validationErrors.trade = locale === "bn" ? "কাজের ধরন / ট্রেড রোল আবশ্যক" : "Trade role is required";
    }

    const sal = parseFloat(formData.salary);
    if (isNaN(sal) || sal <= 0) {
      validationErrors.salary = locale === "bn" ? "বেতন অবশ্যই একটি ধনাত্মক সংখ্যা হতে হবে" : "Salary must be a positive number";
    }

    const quota = parseInt(formData.totalQuota, 10);
    if (isNaN(quota) || quota <= 0) {
      validationErrors.totalQuota = locale === "bn" ? "মোট কোটা অবশ্যই একটি ধনাত্মক পূর্ণসংখ্যা হতে হবে" : "Total quota capacity must be a positive integer";
    }

    const comm = parseFloat(formData.commissionAmount);
    if (isNaN(comm) || comm < 0) {
      validationErrors.commissionAmount = locale === "bn" ? "কমিশন অবশ্যই একটি অ-ঋণাত্মক সংখ্যা হতে হবে" : "Commission must be a non-negative number";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormError(locale === "bn" ? "অনুগ্রহ করে সব আবশ্যক ঘর পূরণ করুন।" : "Please satisfy all highlighted requirements.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {
        employerName: formData.employerName.trim(),
        country: formData.country.trim(),
        trade: formData.trade.trim(),
        salary: sal,
        currency: formData.currency,
        totalQuota: quota,
        commissionAmount: comm,
        status: formData.status,
      };

      if (formData.orderNumber.trim()) {
        payload.orderNumber = formData.orderNumber.trim();
      }

      const res = await fetch("/api/job-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || (locale === "bn" ? "জব অর্ডার / ওপেনিং নিবন্ধন করতে ব্যর্থ হয়েছে।" : "Failed to register job order / opening."));
      }

      toast.success(locale === "bn" ? "বিদেশি জব অর্ডার / ওপেনিং সফলভাবে নিবন্ধিত হয়েছে!" : "Foreign job order / opening registered successfully!");
      setIsCreateModalOpen(false);
      setFormData(initialFormState);
      fetchJobOrders();
    } catch (err: any) {
      setFormError(err.message || (locale === "bn" ? "তৈরি করার সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।" : "An unexpected error occurred during creation."));
      toast.error(err.message || (locale === "bn" ? "জব অর্ডার / ওপেনিং নিবন্ধন করতে ব্যর্থ হয়েছে।" : "Failed to register job order / opening."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit modal for specific job order
  const handleEditClick = (jo: JobOrder) => {
    setSelectedOrder(jo);
    setEditForm({
      id: jo.id,
      employerName: jo.employerName,
      country: jo.country,
      trade: jo.trade,
      salary: String(jo.salary),
      currency: getCurrencyByCountry(jo.country),
      totalQuota: String(jo.totalQuota),
      commissionAmount: String(jo.commissionAmount),
      status: jo.status,
    });
    setIsEditModalOpen(true);
  };

  // PATCH Request - Modify Job Order Profile
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setErrors({});

    if (!selectedOrder) return;

    // Client validations
    const validationErrors: Record<string, string> = {};
    if (!editForm.employerName.trim()) {
      validationErrors.employerName = locale === "bn" ? "নিয়োগকর্তা / কোম্পানির নাম আবশ্যক" : "Employer/Company Name is required";
    }
    if (!editForm.country.trim()) {
      validationErrors.country = locale === "bn" ? "দেশ আবশ্যক" : "Country is required";
    }
    if (!editForm.trade.trim()) {
      validationErrors.trade = locale === "bn" ? "কাজের ধরন / ট্রেড রোল আবশ্যক" : "Trade role is required";
    }

    const sal = parseFloat(editForm.salary);
    if (isNaN(sal) || sal <= 0) {
      validationErrors.salary = locale === "bn" ? "বেতন অবশ্যই একটি ধনাত্মক সংখ্যা হতে হবে" : "Salary must be a positive number";
    }

    const quota = parseInt(editForm.totalQuota, 10);
    if (isNaN(quota) || quota <= 0) {
      validationErrors.totalQuota = locale === "bn" ? "মোট কোটা অবশ্যই একটি ধনাত্মক পূর্ণসংখ্যা হতে হবে" : "Total quota must be a positive integer";
    } else if (quota < selectedOrder.allocatedQuota) {
      validationErrors.totalQuota = locale === "bn" 
        ? `কোটা বর্তমান সক্রিয় প্লেসমেন্টের (${selectedOrder.allocatedQuota}) চেয়ে কমানো সম্ভব নয়` 
        : `Quota cannot be lowered than currently active placements (${selectedOrder.allocatedQuota})`;
    }

    const comm = parseFloat(editForm.commissionAmount);
    if (isNaN(comm) || comm < 0) {
      validationErrors.commissionAmount = locale === "bn" ? "কমিশন অবশ্যই একটি অ-ঋণাত্মক সংখ্যা হতে হবে" : "Commission must be a non-negative number";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormError(locale === "bn" ? "অনুগ্রহ করে সব আবশ্যক ঘর পূরণ করুন।" : "Please satisfy all highlighted requirements.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        employerName: editForm.employerName.trim(),
        country: editForm.country.trim(),
        trade: editForm.trade.trim(),
        salary: sal,
        totalQuota: quota,
        commissionAmount: comm,
        status: editForm.status,
      };

      const res = await fetch(`/api/job-orders/${editForm.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || (locale === "bn" ? "জব অর্ডার / ওপেনিং আপডেট করতে ব্যর্থ হয়েছে।" : "Failed to update job order / opening."));
      }

      toast.success(locale === "bn" ? "জব অর্ডার / ওপেনিং সফলভাবে সংশোধন করা হয়েছে!" : "Job order / opening modified successfully!");
      setIsEditModalOpen(false);
      setSelectedOrder(null);
      fetchJobOrders();
    } catch (err: any) {
      setFormError(err.message || (locale === "bn" ? "সংশোধনের সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।" : "An unexpected error occurred during modification."));
      toast.error(err.message || (locale === "bn" ? "জব অর্ডার / ওপেনিং আপডেট করতে ব্যর্থ হয়েছে।" : "Failed to update job order / opening."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Securely download the compiled job orders registry matching active filter scope
  const handleExportCSV = async () => {
    try {
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);

      const res = await fetch(`/api/exports/job-orders?${params.toString()}`, {
        method: "GET",
        headers,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          (locale === "bn" ? "CSV এক্সপোর্ট জেনারেট করতে ব্যর্থ হয়েছে।" : "Failed to generate CSV export.")
        );
      }

      const csvText = await res.text();
      const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `job_orders_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success(locale === "bn" ? "CSV রেজিস্ট্রি সফলভাবে এক্সপোর্ট করা হয়েছে!" : "CSV registry exported successfully!");
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error(
        err.message || 
        (locale === "bn" ? "বাল্ক এক্সপোর্ট সম্পন্ন করতে ব্যর্থ হয়েছে।" : "Failed to execute bulk export.")
      );
    }
  };

  // Multi-field search mapping using computed searchKeys
  const mappedOrders = jobOrders.map((jo) => ({
    ...jo,
    searchKey: `${jo.employerName} ${jo.orderNumber} ${jo.country} ${jo.trade}`.toLowerCase(),
  }));

  // Client-side filtering logic
  const filteredOrders = mappedOrders.filter((jo) => {
    if (statusFilter === "OPEN" && (jo.status !== "OPEN" || jo.allocatedQuota >= jo.totalQuota)) return false;
    if (statusFilter !== "ALL" && statusFilter !== "OPEN" && jo.status !== statusFilter) return false;
    return true;
  });

  const canManage = hasAccess("MANAGE_JOB_ORDERS") || ["Super Admin", "Operations Admin"].includes(activeRoleName);

  const tableColumns = [
    {
      header: t("jobOrders.orderReference"),
      accessor: (jo: JobOrder) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary-theme font-bold text-xs shrink-0">
            <Briefcase className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-text-theme truncate text-xs">{jo.orderNumber}</span>
            <span className="text-[11px] text-text-soft truncate font-medium">{jo.employerName}</span>
          </div>
        </div>
      ),
    },
    {
      header: t("jobOrders.countryTrade"),
      accessor: (jo: JobOrder) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-xs font-semibold text-text-theme">
            <MapPin className="h-3 w-3 text-primary-theme shrink-0" />
            <span>{jo.country}</span>
          </div>
          <span className="text-[11px] font-medium text-text-soft">{jo.trade}</span>
        </div>
      ),
    },

    {
      header: t("jobOrders.monthlySalary"),
      accessor: (jo: JobOrder) => {
        const curr = getCurrencyByCountry(jo.country);
        return (
          <span className="font-semibold text-text-theme">
            {formatCurrency(jo.salary, curr, locale)}
          </span>
        );
      },
    },
    {
      header: t("jobOrders.quotaAllocationProgress"),
      accessor: (jo: JobOrder) => {
        const pct = Math.min(100, Math.round((jo.allocatedQuota / jo.totalQuota) * 100)) || 0;
        return (
          <div className="w-48 space-y-1">
            <div className="flex justify-between text-[10px] text-text-soft font-bold">
              <span>
                {t("jobOrders.filled", {
                  allocated: formatNumber(jo.allocatedQuota, locale),
                  total: formatNumber(jo.totalQuota, locale)
                })}
              </span>
              <span>{formatNumber(pct, locale)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  pct >= 100 
                    ? "bg-emerald-500" 
                    : pct >= 80 
                      ? "bg-amber-500" 
                      : "bg-indigo-600"
                }`}
                style={{ width: `${pct}%` }}
              ></div>
            </div>
          </div>
        );
      },
    },
    {
      header: t("jobOrders.agencyCommission"),
      accessor: (jo: JobOrder) => (
        <span className="font-semibold text-text-theme">
          {t("jobOrders.perCandidate", { amount: formatNumber(jo.commissionAmount, locale) })}
        </span>
      ),
    },
    {
      header: t("jobOrders.tableHeaderStatus"),
      accessor: (jo: JobOrder) => <StatusBadge status={jo.status} />,
    },
    ...(canManage
      ? [
          {
            header: t("common.actions"),
            accessor: (jo: JobOrder) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditClick(jo);
                }}
                className="p-1.5 text-text-soft hover:text-primary-theme hover:bg-bg-muted rounded-lg transition-colors cursor-pointer"
                title={t("jobOrders.editJobDemandOrder")}
              >
                <Edit className="h-4 w-4" />
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <PermissionGate 
        permission="VIEW_DASHBOARD" 
        showFallback={true} 
        fallbackMessage={t("common.accessDenied")}
      >
        <PageHeader
          title={t("jobOrders.pageTitle")}
          description={t("jobOrders.pageDesc")}
          breadcrumbs={[
            { label: t("nav.dashboard"), href: "/dashboard" },
            { label: t("nav.jobOrders") }
          ]}
          actions={
            <div className="flex items-center gap-2">
              {canManage && (
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-primary-theme px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-hover shadow-primary-theme/20 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> {t("jobOrders.addDemandBtn")}
                </button>
              )}
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 rounded-lg border border-border-theme bg-surface px-3.5 py-2 text-xs font-semibold text-text-theme hover:bg-bg-muted transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> {t("common.exportCsv")}
              </button>
            </div>
          }
        />

        {/* Dynamic Analytics Aggregates Cards */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl border border-border-theme bg-surface animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title={t("jobOrders.totalQuotaCapacity")}
              value={stats?.totalQuota !== undefined ? formatNumber(stats.totalQuota, locale) : "0"}
              description={t("jobOrders.totalQuotaDesc")}
              iconName="Briefcase"
            />
            <StatCard
              title={t("jobOrders.quotaUtilization")}
              value={
                locale === "bn" 
                  ? `${formatNumber(stats?.allocatedQuota ?? 0, locale)} জন নিয়োজিত` 
                  : `${stats?.allocatedQuota ?? 0} Placed`
              }
              description={t("jobOrders.slotsRemaining", { count: formatNumber(stats?.remainingQuota ?? 0, locale) })}
              iconName="Activity"
            />
            <StatCard
              title={t("jobOrders.openDemandContracts")}
              value={
                locale === "bn" 
                  ? `${formatNumber(stats?.openOrders ?? 0, locale)} টি উন্মুক্ত` 
                  : `${stats?.openOrders ?? 0} Open`
              }
              description={t("jobOrders.completedDemandsDesc", {
                closed: formatNumber(stats?.closedOrders ?? 0, locale),
                completed: formatNumber(stats?.completedOrders ?? 0, locale)
              })}
              iconName="TrendingUp"
            />
          </div>
        )}

        {/* Filters Toolbar */}
        <div className="flex flex-col gap-4 rounded-xl border border-border-theme bg-surface p-5 shadow-sm sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-text-soft text-xs font-bold mr-2">
            <span>{t("jobOrders.filterStatus")}</span>
          </div>
          <div className="flex gap-2">
            {["ALL", "OPEN", "CLOSED", "COMPLETED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
                  statusFilter === status
                    ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950"
                    : "bg-surface text-text-soft border-border-theme hover:bg-bg-muted"
                }`}
              >
                {status === "ALL" ? t("jobOrders.allDemands") : t(`statuses.${status}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Live Database Data Table Rendering */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-border-theme bg-surface shadow-sm space-y-4">
            <div className="relative h-12 w-12 rounded-2xl bg-surface border border-border-theme flex items-center justify-center shadow-lg">
              <Loader2 className="h-6 w-6 text-primary-theme animate-spin" />
            </div>
            <p className="text-xs text-text-soft font-bold animate-pulse">{t("jobOrders.queryingLiveOrders")}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-rose-100 bg-rose-50/50 p-6 text-center shadow-sm dark:border-rose-950/10 dark:bg-rose-950/5 space-y-4">
            <AlertCircle className="h-10 w-10 text-rose-500" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-900 dark:text-rose-400">{t("dashboard.failedToLoad")}</h3>
              <p className="text-xs text-rose-700/80 dark:text-rose-400/70 max-w-md">{error}</p>
            </div>
            <button
              onClick={fetchJobOrders}
              className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-sm cursor-pointer"
            >
              {t("dashboard.retryBtn")}
            </button>
          </div>
        ) : (
          <DataTable
            data={filteredOrders}
            columns={tableColumns}
            searchPlaceholder={t("jobOrders.searchPlaceholder")}
            searchField="searchKey"
            onRowClick={canManage ? handleEditClick : undefined}
            emptyStateTitle={t("jobOrders.noJobOrdersMatchFilter")}
            emptyStateDescription={t("jobOrders.verifyDemandsRegistered")}
          />
        )}

        {/* ========================================== */}
        {/* ADD FOREIGN JOB ORDER MODAL                */}
        {/* ========================================== */}
        <AppModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title={t("jobOrders.addForeignJobOrder")}
          size="lg"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-6">
            {formError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 p-4 text-xs font-medium text-rose-800 dark:bg-rose-950/20 dark:border-rose-950/30 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
              {/* Section A: Employer Details */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-primary-theme uppercase tracking-wider border-b border-border-theme pb-1">
                  {t("jobOrders.employerDetails")}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AppInput
                    label={t("jobOrders.employerCompanyName")}
                    value={formData.employerName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, employerName: e.target.value }))}
                    error={errors.employerName}
                    placeholder="e.g. Al-Juraid Contracting Co."
                    required
                  />
                  <AppSelect
                    label={t("jobOrders.countryDestination")}
                    value={formData.country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    error={errors.country}
                    required
                  >
                    <option value="Saudi Arabia">Saudi Arabia (KSA)</option>
                    <option value="United Arab Emirates">United Arab Emirates (UAE)</option>
                    <option value="Malaysia">Malaysia (MYS)</option>
                    <option value="Qatar">Qatar (QAT)</option>
                    <option value="Oman">Oman (OMN)</option>
                    <option value="Singapore">Singapore (SGP)</option>
                    <option value="Kuwait">Kuwait (KWT)</option>
                    <option value="Bahrain">Bahrain (BHR)</option>
                  </AppSelect>
                </div>
              </div>

              {/* Section B: Job Details */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[11px] font-bold text-primary-theme uppercase tracking-wider border-b border-border-theme pb-1">
                  {t("jobOrders.jobDetails")}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AppInput
                    label={t("jobOrders.tradeRoleCategory")}
                    value={formData.trade}
                    onChange={(e) => setFormData((prev) => ({ ...prev, trade: e.target.value }))}
                    error={errors.trade}
                    placeholder="e.g. Electrician, Welder"
                    required
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <AppInput
                        label={t("jobOrders.monthlySalaryAsterisk")}
                        type="number"
                        step="0.01"
                        value={formData.salary}
                        onChange={(e) => setFormData((prev) => ({ ...prev, salary: e.target.value }))}
                        error={errors.salary}
                        placeholder="e.g. 1800"
                        required
                      />
                    </div>
                    <div>
                      <AppSelect
                        label={t("jobOrders.currencyAsterisk")}
                        value={formData.currency}
                        onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
                        error={errors.currency}
                        required
                      >
                        <option value="SAR">SAR</option>
                        <option value="AED">AED</option>
                        <option value="MYR">MYR</option>
                        <option value="QAR">QAR</option>
                        <option value="OMR">OMR</option>
                        <option value="SGD">SGD</option>
                        <option value="KWD">KWD</option>
                        <option value="BHD">BHD</option>
                        <option value="BDT">BDT (৳)</option>
                      </AppSelect>
                    </div>
                  </div>
                  <AppInput
                    label={t("jobOrders.totalQuotaCapacityAsterisk")}
                    type="number"
                    value={formData.totalQuota}
                    onChange={(e) => setFormData((prev) => ({ ...prev, totalQuota: e.target.value }))}
                    error={errors.totalQuota}
                    placeholder="e.g. 50"
                    required
                  />
                </div>
              </div>

              {/* Section C: Agency Terms */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[11px] font-bold text-primary-theme uppercase tracking-wider border-b border-border-theme pb-1">
                  {t("jobOrders.agencyTermsReference")}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AppInput
                    label={t("jobOrders.commissionPerCandidate")}
                    type="number"
                    step="0.01"
                    value={formData.commissionAmount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, commissionAmount: e.target.value }))}
                    error={errors.commissionAmount}
                    placeholder="e.g. 500"
                    required
                  />
                  <AppInput
                    label={t("jobOrders.customOrderNumber")}
                    value={formData.orderNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, orderNumber: e.target.value }))}
                    error={errors.orderNumber}
                    placeholder="e.g. JO-KSA-2026-001"
                  />
                  <AppSelect
                    label={t("jobOrders.initialDemandStatus")}
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as any }))}
                    error={errors.status}
                    required
                  >
                    <option value="OPEN">{t("jobOrders.openPlacementsAllowed")}</option>
                    <option value="CLOSED">{t("jobOrders.closedPlacementsLocked")}</option>
                    <option value="COMPLETED">{t("jobOrders.completedDemandMet")}</option>
                  </AppSelect>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-theme">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}
                className="rounded-xl border border-border-theme bg-surface px-4 py-2 text-xs font-semibold text-text-theme hover:bg-bg-muted disabled:opacity-50 transition-colors cursor-pointer"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-primary-theme px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-hover shadow-primary-theme/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t("jobOrders.registering")}
                  </>
                ) : (
                  t("jobOrders.registerDemandOrder")
                )}
              </button>
            </div>
          </form>
        </AppModal>

        {/* ========================================== */}
        {/* EDIT FOREIGN JOB ORDER MODAL              */}
        {/* ========================================== */}
        <AppModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedOrder(null);
          }}
          title={t("jobOrders.editJobDemandOrder")}
          size="lg"
        >
          {selectedOrder && (
            <form onSubmit={handleEditSubmit} className="space-y-6">
              {formError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 p-4 text-xs font-medium text-rose-800 dark:bg-rose-950/20 dark:border-rose-950/30 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
                {/* Reference tag info */}
                <div className="rounded-xl border border-border-theme bg-bg-muted p-4 space-y-1">
                  <span className="text-[10px] font-bold text-text-soft uppercase tracking-wide">
                    {t("jobOrders.recruitmentReferenceNumber")}
                  </span>
                  <p className="font-mono text-sm text-text-theme font-bold">{selectedOrder.orderNumber}</p>
                  <p className="text-[10px] text-text-soft">
                    {t("jobOrders.placementsStatus", {
                      allocated: formatNumber(selectedOrder.allocatedQuota, locale),
                      total: formatNumber(selectedOrder.totalQuota, locale)
                    })}
                  </p>
                </div>

                {/* Section A: Employer Details */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-primary-theme uppercase tracking-wider border-b border-border-theme pb-1">
                    {t("jobOrders.employerDetails")}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AppInput
                      label={t("jobOrders.employerCompanyName")}
                      value={editForm.employerName}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, employerName: e.target.value }))}
                      error={errors.employerName}
                      placeholder="e.g. Al-Juraid Contracting Co."
                      required
                    />
                    <AppSelect
                      label={t("jobOrders.countryDestination")}
                      value={editForm.country}
                      onChange={(e) => handleEditCountryChange(e.target.value)}
                      error={errors.country}
                      required
                    >
                      <option value="Saudi Arabia">Saudi Arabia (KSA)</option>
                      <option value="United Arab Emirates">United Arab Emirates (UAE)</option>
                      <option value="Malaysia">Malaysia (MYS)</option>
                      <option value="Qatar">Qatar (QAT)</option>
                      <option value="Oman">Oman (OMN)</option>
                      <option value="Singapore">Singapore (SGP)</option>
                      <option value="Kuwait">Kuwait (KWT)</option>
                      <option value="Bahrain">Bahrain (BHR)</option>
                    </AppSelect>
                  </div>
                </div>

                {/* Section B: Job Details */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[11px] font-bold text-primary-theme uppercase tracking-wider border-b border-border-theme pb-1">
                    {t("jobOrders.jobDetails")}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AppInput
                      label={t("jobOrders.tradeRoleCategory")}
                      value={editForm.trade}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, trade: e.target.value }))}
                      error={errors.trade}
                      placeholder="e.g. Electrician, Welder"
                      required
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <AppInput
                          label={t("jobOrders.monthlySalaryAsterisk")}
                          type="number"
                          step="0.01"
                          value={editForm.salary}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, salary: e.target.value }))}
                          error={errors.salary}
                          placeholder="e.g. 1800"
                          required
                        />
                      </div>
                      <div>
                        <AppSelect
                          label={t("jobOrders.currencyAsterisk")}
                          value={editForm.currency}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, currency: e.target.value }))}
                          error={errors.currency}
                          required
                        >
                          <option value="SAR">SAR</option>
                          <option value="AED">AED</option>
                          <option value="MYR">MYR</option>
                          <option value="QAR">QAR</option>
                          <option value="OMR">OMR</option>
                          <option value="SGD">SGD</option>
                          <option value="KWD">KWD</option>
                          <option value="BHD">BHD</option>
                          <option value="BDT">BDT (৳)</option>
                        </AppSelect>
                      </div>
                    </div>
                    <AppInput
                      label={t("jobOrders.totalQuotaCapacityAsterisk")}
                      type="number"
                      value={editForm.totalQuota}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, totalQuota: e.target.value }))}
                      error={errors.totalQuota}
                      placeholder="e.g. 50"
                      required
                    />
                  </div>
                </div>

                {/* Section C: Agency Terms */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[11px] font-bold text-primary-theme uppercase tracking-wider border-b border-border-theme pb-1">
                    {t("jobOrders.agencyTermsReference")}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AppInput
                      label={t("jobOrders.commissionPerCandidate")}
                      type="number"
                      step="0.01"
                      value={editForm.commissionAmount}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, commissionAmount: e.target.value }))}
                      error={errors.commissionAmount}
                      placeholder="e.g. 500"
                      required
                    />
                    <AppSelect
                      label={t("jobOrders.demandStatus")}
                      value={editForm.status}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value as any }))}
                      error={errors.status}
                      required
                    >
                      <option value="OPEN">{t("jobOrders.openPlacementsAllowed")}</option>
                      <option value="CLOSED">{t("jobOrders.closedPlacementsLocked")}</option>
                      <option value="COMPLETED">{t("jobOrders.completedDemandMet")}</option>
                    </AppSelect>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-theme">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedOrder(null);
                  }}
                  disabled={isSubmitting}
                  className="rounded-xl border border-border-theme bg-surface px-4 py-2 text-xs font-semibold text-text-theme hover:bg-bg-muted disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-primary-theme px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-hover shadow-primary-theme/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {t("jobOrders.savingChanges")}
                    </>
                  ) : (
                    t("common.save")
                  )}
                </button>
              </div>
            </form>
          )}
        </AppModal>
      </PermissionGate>
    </div>
  );
}
