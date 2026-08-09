"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMockAuth } from "@/context/MockAuthContext";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { WORKFLOW_LABELS, WorkflowStage } from "@/lib/mockData";
import { SlidersHorizontal, Plus, FileSpreadsheet, Loader2, AlertCircle } from "lucide-react";
import { AppModal } from "@/components/ui/AppModal";
import { AppInput } from "@/components/ui/AppInput";
import { AppSelect } from "@/components/ui/AppSelect";
import { useT } from "@/i18n/useT";
import { formatNumber } from "@/i18n/format";

export default function ApplicantsPage() {
  const router = useRouter();
  const { hasAccess, accessToken } = useMockAuth();
  const toast = useToast();
  const { t, locale } = useT();

  // Component states
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Filters State
  const [selectedTrade, setSelectedTrade] = useState("ALL");
  const [selectedStage, setSelectedStage] = useState("ALL");
  const [showArchived, setShowArchived] = useState(false);

  // Modal and creation form states
  const { activeRoleName } = useMockAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agentsList, setAgentsList] = useState<any[]>([]);
  const [jobOrdersList, setJobOrdersList] = useState<any[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const initialFormState = {
    fullName: "",
    passportNumber: "",
    passportExpiry: "",
    dateOfBirth: "",
    nationality: "Bangladesh",
    nidNumber: "",
    phone: "",
    email: "",
    address: "",
    emergencyContact: "",
    trade: "",
    agentId: "",
    jobOrderId: "",
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchAuxiliaryData = async () => {
    try {
      if (activeRoleName !== "Agent") {
        const res = await fetch("/api/agents?active=true", {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setAgentsList(data.data || []);
        }
      }

      const res = await fetch("/api/job-orders?status=OPEN", {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setJobOrdersList(data.data || []);
      }
    } catch (err) {
      console.error("Error loading auxiliary listing data:", err);
    }
  };

  useEffect(() => {
    if (isCreateModalOpen && accessToken) {
      fetchAuxiliaryData();
    }
  }, [isCreateModalOpen, accessToken]);

  const handleCancel = () => {
    setFormData(initialFormState);
    setErrors({});
    setFormError(null);
    setIsCreateModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setErrors({});

    // Client-side validations
    const validationErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) {
      validationErrors.fullName = locale === "bn" ? "পূর্ণ নাম আবশ্যক" : "Full name is required";
    }
    if (!formData.passportNumber.trim()) {
      validationErrors.passportNumber = locale === "bn" ? "পাসপোর্ট নম্বর আবশ্যক" : "Passport number is required";
    }
    if (!formData.passportExpiry) {
      validationErrors.passportExpiry = locale === "bn" ? "পাসপোর্টের মেয়াদ শেষ হওয়ার তারিখ আবশ্যক" : "Passport expiry date is required";
    }
    if (!formData.dateOfBirth) {
      validationErrors.dateOfBirth = locale === "bn" ? "জন্ম তারিখ আবশ্যক" : "Date of birth is required";
    }
    if (!formData.nationality.trim()) {
      validationErrors.nationality = locale === "bn" ? "জাতীয়তা আবশ্যক" : "Nationality is required";
    }
    if (!formData.phone.trim()) {
      validationErrors.phone = locale === "bn" ? "মোবাইল নম্বর আবশ্যক" : "Phone number is required";
    }
    if (!formData.trade.trim()) {
      validationErrors.trade = locale === "bn" ? "ট্রেড ক্যাটাগরি আবশ্যক" : "Trade category is required";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormError(locale === "bn" ? "অনুগ্রহ করে নিচে চিহ্নিত সব প্রয়োজনীয় ঘর পূরণ করুন।" : "Please satisfy all required fields highlighted below.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Record<string, any> = {
        fullName: formData.fullName.trim(),
        passportNumber: formData.passportNumber.trim().toUpperCase(),
        passportExpiry: formData.passportExpiry,
        dateOfBirth: formData.dateOfBirth,
        nationality: formData.nationality.trim(),
        trade: formData.trade.trim(),
        phone: formData.phone.trim(),
      };

      if (formData.email?.trim()) payload.email = formData.email.trim();
      if (formData.nidNumber?.trim()) payload.nidNumber = formData.nidNumber.trim();
      if (formData.address?.trim()) payload.address = formData.address.trim();
      if (formData.emergencyContact?.trim()) payload.emergencyContact = formData.emergencyContact.trim();
      if (formData.jobOrderId) payload.jobOrderId = formData.jobOrderId;

      if (activeRoleName !== "Agent" && formData.agentId) {
        payload.agentId = formData.agentId;
      }

      const res = await fetch("/api/applicants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || (locale === "bn" ? "আবেদনকারী রেকর্ড তৈরি করতে ব্যর্থ হয়েছে।" : "Failed to create candidate record."));
      }

      toast.success(t("applicants.successCreated"));
      handleCancel();
      fetchApplicants(); // reload directory list
    } catch (err: any) {
      setFormError(err.message || (locale === "bn" ? "একটি অপ্রত্যাশিত নেটওয়ার্ক ত্রুটি ঘটেছে।" : "An unexpected network error occurred."));
      toast.error(err.message || t("applicants.errorFailedCreate"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async () => {
    if (!accessToken) return;
    setIsExporting(true);
    try {
      const url = `/api/exports/applicants?archived=${showArchived}&trade=${selectedTrade}&stage=${selectedStage}`;
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
      link.setAttribute("download", `applicants_export_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success(locale === "bn" ? "আবেদনকারীর তালিকা সফলভাবে এক্সপোর্ট করা হয়েছে!" : "Applicants directory exported successfully!");
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred during export.");
    } finally {
      setIsExporting(false);
    }
  };

  // Load live data from postgres-backed API
  const fetchApplicants = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      // Fetch active cohort dataset matching archive status from server
      const res = await fetch(`/api/applicants?archived=${showArchived}&pageSize=1000`, {
        method: "GET",
        headers,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to load directory data.");
      }

      const data = await res.json();
      setApplicants(data.data || []);
    } catch (err: any) {
      console.error("Error fetching applicants:", err);
      setError(err.message || (locale === "bn" ? "আবেদনকারী লোড করার সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।" : "An unexpected error occurred while loading candidates."));
    } finally {
      setLoading(false);
    }
  };

  // Perform fetching on mount and archived state transitions
  useEffect(() => {
    fetchApplicants();
  }, [showArchived, accessToken]);

  // Apply filters client-side to fetched cohort dataset
  const filteredApplicants = applicants.filter((app) => {
    // Trade check
    if (selectedTrade !== "ALL" && app.trade !== selectedTrade) return false;
    // Stage check
    if (selectedStage !== "ALL" && app.currentStage !== selectedStage) return false;
    return true;
  });

  // Unique Trades and Stages derived dynamically from active data segment
  const availableTrades = Array.from(new Set(applicants.map((a) => a.trade)));
  const availableStages = Array.from(new Set(applicants.map((a) => a.currentStage)));

  // Calculate summary counts
  const totalCount = applicants.length;
  const selectedCount = applicants.filter((a) => a.currentStage === "SELECTED").length;
  const medicalCount = applicants.filter((a) => a.currentStage === "MEDICAL_WAITING" || a.currentStage === "MEDICAL_FIT").length;
  const visaCount = applicants.filter((a) => a.currentStage === "VISA_SUBMITTED" || a.currentStage === "VISA_STAMPED").length;
  const deployedCount = applicants.filter((a) => a.currentStage === "DEPLOYED").length;

  const handleRowClick = (app: any) => {
    router.push(`/applicants/${app.id}`);
  };

  const tableColumns = [
    {
      header: t("applicants.tableHeaderName"),
      accessor: (a: any) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary-theme font-bold text-xs shrink-0 uppercase">
            {a.fullName ? a.fullName.substring(0, 2) : "CA"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-text-theme truncate text-xs">{a.fullName}</span>
            <span className="text-[11px] text-text-soft truncate font-medium">
              {a.phone || a.email || (locale === "bn" ? "কোনো ফোন নম্বর নেই" : "No phone listed")}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: t("applicants.tableHeaderPassport"),
      accessor: (a: any) => (
        <span className="font-mono text-xs font-semibold text-text-theme bg-bg-muted border border-border-theme px-2 py-0.5 rounded">
          {a.passportNumber}
        </span>
      ),
    },
    { header: t("applicants.tableHeaderTrade"), accessor: (a: any) => <span className="text-xs font-semibold text-text-theme">{a.trade}</span> },
    {
      header: t("applicants.tableHeaderStage"),
      accessor: (a: any) => <StatusBadge status={a.currentStage} />,
    },
    {
      header: locale === "bn" ? "রেকর্ড অবস্থা" : "Integrity",
      accessor: (a: any) => (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
            a.isArchived
              ? "text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30"
              : "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
          }`}
        >
          {a.isArchived
            ? locale === "bn"
              ? "আর্কাইভ করা"
              : "Archived"
            : locale === "bn"
            ? "সক্রিয় নিরীক্ষণ"
            : "Active Vetting"}
        </span>
      ),
    },
  ];

  // Actions header
  const headerActions = (
    <div className="flex items-center gap-2">
      {hasAccess("CREATE_APPLICANT") && (
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary-theme px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary-hover transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" /> {t("applicants.addApplicantBtn")}
        </button>
      )}
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="flex items-center gap-1.5 rounded-lg border border-border-theme bg-surface px-3 py-1.5 text-xs font-semibold text-text-theme hover:bg-bg-muted disabled:opacity-50 transition-colors cursor-pointer"
      >
        {isExporting ? (
          <Loader2 className="h-3.5 w-3.5 text-emerald-600 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
        )}
        {isExporting ? (locale === "bn" ? "এক্সপোর্ট হচ্ছে..." : "Exporting...") : t("common.exportCsv")}
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <PermissionGate permission="VIEW_APPLICANTS" showFallback={true}>
        <PageHeader
          title={t("applicants.pageTitle")}
          description={t("applicants.pageDesc")}
          breadcrumbs={[{ label: locale === "bn" ? "ইআরপি হাব" : "ERP Hub", href: "/dashboard" }, { label: t("nav.applicants") }]}
          actions={headerActions}
        />

        {/* Pipeline Quick-Filter Summary Strip */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "ALL", label: locale === "bn" ? "সব প্রার্থী" : "All Candidates", count: totalCount },
            { id: "SELECTED", label: locale === "bn" ? "মনোনীত" : "Selected", count: selectedCount },
            { id: "MEDICAL_WAITING", label: locale === "bn" ? "মেডিকেল" : "Medical", count: medicalCount },
            { id: "VISA_SUBMITTED", label: locale === "bn" ? "ভিসা প্রসেসিং" : "Visa Processing", count: visaCount },
            { id: "DEPLOYED", label: locale === "bn" ? "ফ্লাইট সম্পন্ন" : "Deployed", count: deployedCount },
          ].map((item) => {
            const isSelected = selectedStage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedStage(item.id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary-theme bg-primary-soft text-primary-theme font-bold shadow-xs"
                    : "border-border-theme bg-surface text-text-soft hover:bg-bg-muted hover:text-text-theme"
                }`}
              >
                <span>{item.label}</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                  isSelected ? "bg-primary-theme text-white" : "bg-bg-muted text-text-muted"
                }`}>
                  {formatNumber(item.count, locale)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col gap-3 rounded-xl border border-border-theme bg-surface p-4 shadow-xs sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 shrink-0 text-text-theme text-xs font-bold mr-1">
            <SlidersHorizontal className="h-4 w-4 text-primary-theme" /> {locale === "bn" ? "ফিল্টারসমূহ" : "Filters"}
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 flex-1">
            {/* Trade Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-text-soft uppercase tracking-wide">{locale === "bn" ? "ট্রেড ক্যাটাগরি" : "Trade Category"}</label>
              <select
                value={selectedTrade}
                onChange={(e) => setSelectedTrade(e.target.value)}
                className="w-full rounded-lg border border-border-theme bg-bg py-1 px-2.5 text-xs font-semibold outline-none focus:border-primary-theme text-text-theme"
              >
                <option value="ALL">{locale === "bn" ? "সব ট্রেড সেগমেন্ট" : "All Trade Segments"}</option>
                {availableTrades.map((trade) => (
                  <option key={trade} value={trade}>
                    {trade}
                  </option>
                ))}
              </select>
            </div>

            {/* Workflow Stage Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-text-soft uppercase tracking-wide">{locale === "bn" ? "প্রক্রিয়ার ধাপ (Milestone)" : "Logistics Milestone"}</label>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full rounded-lg border border-border-theme bg-bg py-1 px-2.5 text-xs font-semibold outline-none focus:border-primary-theme text-text-theme"
              >
                <option value="ALL">{locale === "bn" ? "সব ধাপ" : "All Stages"}</option>
                {availableStages.map((stage) => {
                  const translatedStage = t(`workflow.${stage}`);
                  const displayStage = translatedStage !== `workflow.${stage}` ? translatedStage : (WORKFLOW_LABELS[stage as WorkflowStage] || stage);
                  return (
                    <option key={stage} value={stage}>
                      {displayStage}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Soft-Archived Toggle */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-text-soft uppercase tracking-wide">{locale === "bn" ? "অডিট ভিউ" : "Audit View"}</label>
              <div className="flex h-8 items-center gap-2">
                <input
                  type="checkbox"
                  id="archived-toggle"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="h-4 w-4 rounded border-border-strong text-primary-theme focus:ring-primary-theme cursor-pointer accent-primary-theme"
                />
                <label
                  htmlFor="archived-toggle"
                  className="text-xs font-semibold text-text-theme cursor-pointer select-none"
                >
                  {locale === "bn" ? "শুধু আর্কাইভ করা ফাইল দেখান" : "Show Soft-Archived Files Only"}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Live Data rendering with beautiful loading/error and empty states */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-border-theme bg-surface p-5 shadow-sm space-y-4">
            <div className="relative h-12 w-12 rounded-2xl bg-surface border border-border-theme flex items-center justify-center shadow-lg">
              <Loader2 className="h-6 w-6 text-primary-theme animate-spin" />
            </div>
            <p className="text-xs text-text-soft font-bold animate-pulse">{locale === "bn" ? "ডাটাবেস থেকে আবেদনকারী তালিকা লোড হচ্ছে..." : "Loading live applicants from database..."}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-rose-100 bg-rose-50/50 p-6 text-center shadow-sm dark:border-rose-950/10 dark:bg-rose-950/5 space-y-4">
            <AlertCircle className="h-10 w-10 text-rose-500" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-900 dark:text-rose-400">{locale === "bn" ? "তালিকা লোড করতে ব্যর্থ হয়েছে" : "Failed to Load Directory"}</h3>
              <p className="text-xs text-rose-700/80 dark:text-rose-400/70 max-w-md">{error}</p>
            </div>
            <button
              onClick={fetchApplicants}
              className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-sm cursor-pointer"
            >
              {t("dashboard.retryBtn")}
            </button>
          </div>
        ) : (
          <DataTable
            data={filteredApplicants}
            columns={tableColumns}
            searchPlaceholder={t("applicants.searchPlaceholder")}
            searchField="fullName"
            onRowClick={handleRowClick}
            emptyStateTitle={
              showArchived
                ? locale === "bn"
                  ? "কোনো আর্কাইভড ফাইল পাওয়া যায়নি"
                  : "No archived files found"
                : locale === "bn"
                ? "কোনো সক্রিয় ফাইল পাওয়া যায়নি"
                : "No active vetting files found"
            }
            emptyStateDescription={
              locale === "bn"
                ? "অনুগ্রহ করে আপনার ফিল্টার রিসেট করুন বা সক্রিয় প্রার্থীদের তালিকায় ফিরে যান।"
                : "Try resetting your filters or toggle the view back to active candidate records."
            }
          />
        )}

        <AppModal
          isOpen={isCreateModalOpen}
          onClose={handleCancel}
          title={t("applicants.addModalTitle")}
          size="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {formError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 p-4 text-xs font-medium text-rose-800 dark:bg-rose-950/20 dark:border-rose-950/30 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
              {/* Section A: Identity */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-primary-theme uppercase tracking-wider border-b border-border-theme pb-1">
                  {locale === "bn" ? "ক. জাতীয় ও পাসপোর্ট পরিচয়" : "A. Identity Details"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AppInput
                    label={t("applicants.formFullName") + " *"}
                    value={formData.fullName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                    error={errors.fullName}
                    placeholder={locale === "bn" ? "উদা: মোহাম্মদ আল-আমিন" : "e.g. Mohammad Al-Amin"}
                    required
                  />
                  <AppInput
                    label={t("applicants.formPassport") + " *"}
                    value={formData.passportNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, passportNumber: e.target.value }))}
                    error={errors.passportNumber}
                    placeholder={locale === "bn" ? "উদা: A03498822" : "e.g. A03498822"}
                    required
                  />
                  <AppInput
                    label={t("applicants.formPassportExpiry") + " *"}
                    type="date"
                    value={formData.passportExpiry}
                    onChange={(e) => setFormData((prev) => ({ ...prev, passportExpiry: e.target.value }))}
                    error={errors.passportExpiry}
                    required
                  />
                  <AppInput
                    label={t("applicants.formDob") + " *"}
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                    error={errors.dateOfBirth}
                    required
                  />
                  <AppInput
                    label={t("applicants.formNationality") + " *"}
                    value={formData.nationality}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nationality: e.target.value }))}
                    error={errors.nationality}
                    required
                  />
                  <AppInput
                    label={t("applicants.formNid") + ` (${t("common.optional")})`}
                    value={formData.nidNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nidNumber: e.target.value }))}
                    error={errors.nidNumber}
                    placeholder={locale === "bn" ? "উদা: 4529082312" : "e.g. 4529082312"}
                  />
                </div>
              </div>

              {/* Section B: Contact */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[11px] font-bold text-primary-theme uppercase tracking-wider border-b border-border-theme pb-1">
                  {locale === "bn" ? "খ. যোগাযোগের বিবরণ" : "B. Contact Details"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AppInput
                    label={t("applicants.formPhone") + " *"}
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    error={errors.phone}
                    placeholder={locale === "bn" ? "উদা: +৮৮০-১৯১২-৩৪৫৬৭৮" : "e.g. +880-1912-345678"}
                    required
                  />
                  <AppInput
                    label={t("applicants.formEmail") + ` (${t("common.optional")})`}
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    error={errors.email}
                    placeholder={locale === "bn" ? "উদা: applicant@applicant.com" : "e.g. applicant@applicant.com"}
                  />
                  <div className="md:col-span-2">
                    <AppInput
                      label={t("applicants.formAddress") + ` (${t("common.optional")})`}
                      value={formData.address}
                      onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                      error={errors.address}
                      placeholder={locale === "bn" ? "উদা: বাড়ি ১৪, রোড ৩, ধানমন্ডি, ঢাকা" : "e.g. House 14, Road 3, Dhanmondi, Dhaka"}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <AppInput
                      label={t("applicants.formEmergency") + ` (${t("common.optional")})`}
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData((prev) => ({ ...prev, emergencyContact: e.target.value }))}
                      error={errors.emergencyContact}
                      placeholder={locale === "bn" ? "উদা: মোসাম্মৎ আমিনা বেগম (মাতা) - +৮৮০-১৯১২-৯৯৮৮৭৭" : "e.g. Mst. Amina Begum (Mother) - +880-1912-998877"}
                    />
                  </div>
                </div>
              </div>

              {/* Section C: Recruitment Details */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[11px] font-bold text-primary-theme uppercase tracking-wider border-b border-border-theme pb-1">
                  {locale === "bn" ? "গ. নিয়োগ ও এজেন্সির বিবরণ" : "C. Recruitment Details"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AppInput
                    label={t("applicants.formTrade") + " *"}
                    value={formData.trade}
                    onChange={(e) => setFormData((prev) => ({ ...prev, trade: e.target.value }))}
                    error={errors.trade}
                    placeholder={locale === "bn" ? "উদা: ইলেকট্রিশিয়ান, ওয়েল্ডার" : "e.g. Electrician, Welder"}
                    required
                  />
                  
                  <AppSelect
                    label={t("applicants.formJobOrder") + ` (${t("common.optional")})`}
                    value={formData.jobOrderId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({ ...prev, jobOrderId: val }));
                      if (val) {
                        const selectedJo = jobOrdersList.find(jo => jo.id === val);
                        if (selectedJo && !formData.trade) {
                          setFormData(prev => ({ ...prev, trade: selectedJo.trade }));
                        }
                      }
                    }}
                    error={errors.jobOrderId}
                  >
                    <option value="">{t("applicants.noJobOrderSelected")}</option>
                    {jobOrdersList.map((jo) => {
                      const slotsLeft = jo.remainingQuota ?? (jo.totalQuota - jo.allocatedQuota);
                      const isFull = slotsLeft <= 0;
                      return (
                        <option key={jo.id} value={jo.id} disabled={isFull}>
                          {jo.orderNumber} — {jo.trade} — {jo.country} — {isFull ? (locale === "bn" ? "পূর্ণ (০ টি স্লট বাকি)" : "FULL (0 slots left)") : (locale === "bn" ? `${formatNumber(slotsLeft, locale)} টি স্লট বাকি` : `${slotsLeft} slots left`)}
                        </option>
                      );
                    })}
                  </AppSelect>

                  {activeRoleName === "Agent" ? (
                    <div className="md:col-span-2 rounded-xl bg-indigo-50/50 p-4 border border-indigo-100 dark:bg-indigo-950/15 dark:border-indigo-950/30 text-indigo-700 dark:text-indigo-400">
                      <p className="font-bold text-xs mb-0.5">{locale === "bn" ? "রিক্রুটার স্কোপ সক্রিয়" : "Recruiter Scoping Active"}</p>
                      <p className="text-[11px] opacity-90">{locale === "bn" ? "এই আবেদনকারী আপনার এজেন্সি প্রোফাইলের অধীনে নিবন্ধিত হবে।" : "This applicant will be registered under your agency profile."}</p>
                    </div>
                  ) : (
                    <div className="md:col-span-2">
                      <AppSelect
                        label={t("applicants.formAgent") + ` (${t("common.optional")})`}
                        value={formData.agentId}
                        onChange={(e) => setFormData((prev) => ({ ...prev, agentId: e.target.value }))}
                        error={errors.agentId}
                      >
                        <option value="">{t("applicants.noAgentSelected")}</option>
                        {agentsList.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.companyName} ({agent.agentCode})
                          </option>
                        ))}
                      </AppSelect>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-theme">
              <button
                type="button"
                onClick={handleCancel}
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
                    {locale === "bn" ? "তৈরি হচ্ছে..." : "Creating..."}
                  </>
                ) : (
                  locale === "bn" ? "আবেদনকারী তৈরি করুন" : "Create Applicant"
                )}
              </button>
            </div>
          </form>
        </AppModal>
      </PermissionGate>
    </div>
  );
}
