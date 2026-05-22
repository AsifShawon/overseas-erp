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

export default function ApplicantsPage() {
  const router = useRouter();
  const { hasAccess, accessToken } = useMockAuth();
  const toast = useToast();

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
    if (!formData.fullName.trim()) validationErrors.fullName = "Full name is required";
    if (!formData.passportNumber.trim()) validationErrors.passportNumber = "Passport number is required";
    if (!formData.passportExpiry) validationErrors.passportExpiry = "Passport expiry date is required";
    if (!formData.dateOfBirth) validationErrors.dateOfBirth = "Date of birth is required";
    if (!formData.nationality.trim()) validationErrors.nationality = "Nationality is required";
    if (!formData.phone.trim()) validationErrors.phone = "Phone number is required";
    if (!formData.trade.trim()) validationErrors.trade = "Trade category is required";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormError("Please satisfy all required fields highlighted below.");
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
        throw new Error(resData.error || "Failed to create candidate record.");
      }

      toast.success("Candidate registered successfully!");
      handleCancel();
      fetchApplicants(); // reload directory list
    } catch (err: any) {
      setFormError(err.message || "An unexpected network error occurred.");
      toast.error(err.message || "An error occurred during candidate registration.");
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
      setError(err.message || "An unexpected error occurred while loading candidates.");
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

  const handleRowClick = (app: any) => {
    router.push(`/applicants/${app.id}`);
  };

  const tableColumns = [
    {
      header: "Candidate Name",
      accessor: (a: any) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-text-theme">{a.fullName}</span>
          <span className="text-[10px] text-text-soft">{a.email || "No claimed email"}</span>
        </div>
      ),
    },
    { header: "Passport Number", accessor: (a: any) => <span className="font-mono text-text-theme">{a.passportNumber}</span> },
    { header: "Contact Phone", accessor: (a: any) => <span className="text-text-theme">{a.phone}</span> },
    { header: "Applied Trade", accessor: (a: any) => <span className="text-text-theme">{a.trade}</span> },
    {
      header: "Workflow Status",
      accessor: (a: any) => <StatusBadge status={a.currentStage} />,
    },
    {
      header: "Integrity",
      accessor: (a: any) => (
        <span
          className={`text-[10px] font-bold ${
            a.isArchived
              ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 dark:bg-rose-950/20"
              : "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 dark:bg-emerald-950/20"
          }`}
        >
          {a.isArchived ? "Archived" : "Active Vetting"}
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
          className="flex items-center gap-1.5 rounded-lg bg-primary-theme px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-hover shadow-primary-theme/20 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Applicant
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
        {isExporting ? "Exporting..." : "Export CSV"}
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <PermissionGate permission="VIEW_APPLICANTS" showFallback={true}>
        <PageHeader
          title="Applicants Directory"
          description="Register candidates, track compliance statuses, passport expirations, and logistics workflow milestones."
          breadcrumbs={[{ label: "ERP Hub", href: "/dashboard" }, { label: "Applicants" }]}
          actions={headerActions}
        />

        {/* Dense Filters Bar */}
        <div className="flex flex-col gap-4 rounded-xl border border-border-theme bg-surface p-5 shadow-sm sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 shrink-0 text-text-theme text-xs font-bold mr-2">
            <SlidersHorizontal className="h-4 w-4 text-primary-theme" /> Vetting Filters
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 flex-1">
            {/* Trade Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-text-soft uppercase tracking-wide">Trade Category</label>
              <select
                value={selectedTrade}
                onChange={(e) => setSelectedTrade(e.target.value)}
                className="w-full rounded-lg border border-border-theme bg-bg p-1.5 text-xs font-medium outline-none focus:border-primary-theme focus:bg-surface text-text-theme"
              >
                <option value="ALL">All Trade Segments</option>
                {availableTrades.map((trade) => (
                  <option key={trade} value={trade}>
                    {trade}
                  </option>
                ))}
              </select>
            </div>

            {/* Workflow Stage Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-text-soft uppercase tracking-wide">Logistics Milestone</label>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full rounded-lg border border-border-theme bg-bg p-1.5 text-xs font-medium outline-none focus:border-primary-theme focus:bg-surface text-text-theme"
              >
                <option value="ALL">All Stages</option>
                {availableStages.map((stage) => (
                  <option key={stage} value={stage}>
                    {WORKFLOW_LABELS[stage as WorkflowStage] || stage}
                  </option>
                ))}
              </select>
            </div>

            {/* Soft-Archived Toggle */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-text-soft uppercase tracking-wide">Audit View</label>
              <div className="flex h-9 items-center gap-2">
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
                  Show Soft-Archived Files Only
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
            <p className="text-xs text-text-soft font-bold animate-pulse">Loading live applicants from database...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-rose-100 bg-rose-50/50 p-6 text-center shadow-sm dark:border-rose-950/10 dark:bg-rose-950/5 space-y-4">
            <AlertCircle className="h-10 w-10 text-rose-500" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-900 dark:text-rose-400">Failed to Load Directory</h3>
              <p className="text-xs text-rose-700/80 dark:text-rose-400/70 max-w-md">{error}</p>
            </div>
            <button
              onClick={fetchApplicants}
              className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-sm"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <DataTable
            data={filteredApplicants}
            columns={tableColumns}
            searchPlaceholder="Search candidates by name..."
            searchField="fullName"
            onRowClick={handleRowClick}
            emptyStateTitle={showArchived ? "No archived files found" : "No active vetting files found"}
            emptyStateDescription="Try resetting your filters or toggle the view back to active candidate records."
          />
        )}

        <AppModal
          isOpen={isCreateModalOpen}
          onClose={handleCancel}
          title="Register New Applicant"
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
                  A. Identity Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AppInput
                    label="Full Name *"
                    value={formData.fullName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                    error={errors.fullName}
                    placeholder="e.g. Mohammad Al-Amin"
                    required
                  />
                  <AppInput
                    label="Passport Number *"
                    value={formData.passportNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, passportNumber: e.target.value }))}
                    error={errors.passportNumber}
                    placeholder="e.g. A03498822"
                    required
                  />
                  <AppInput
                    label="Passport Expiry Date *"
                    type="date"
                    value={formData.passportExpiry}
                    onChange={(e) => setFormData((prev) => ({ ...prev, passportExpiry: e.target.value }))}
                    error={errors.passportExpiry}
                    required
                  />
                  <AppInput
                    label="Date of Birth *"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                    error={errors.dateOfBirth}
                    required
                  />
                  <AppInput
                    label="Nationality *"
                    value={formData.nationality}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nationality: e.target.value }))}
                    error={errors.nationality}
                    required
                  />
                  <AppInput
                    label="NID Number (Optional)"
                    value={formData.nidNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nidNumber: e.target.value }))}
                    error={errors.nidNumber}
                    placeholder="e.g. 4529082312"
                  />
                </div>
              </div>

              {/* Section B: Contact */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[11px] font-bold text-primary-theme uppercase tracking-wider border-b border-border-theme pb-1">
                  B. Contact Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AppInput
                    label="Phone Number *"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    error={errors.phone}
                    placeholder="e.g. +880-1912-345678"
                    required
                  />
                  <AppInput
                    label="Email Address (Optional)"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    error={errors.email}
                    placeholder="e.g. applicant@applicant.com"
                  />
                  <div className="md:col-span-2">
                    <AppInput
                      label="Home Address (Optional)"
                      value={formData.address}
                      onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                      error={errors.address}
                      placeholder="e.g. House 14, Road 3, Dhanmondi, Dhaka"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <AppInput
                      label="Emergency Contact (Optional)"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData((prev) => ({ ...prev, emergencyContact: e.target.value }))}
                      error={errors.emergencyContact}
                      placeholder="e.g. Mst. Amina Begum (Mother) - +880-1912-998877"
                    />
                  </div>
                </div>
              </div>

              {/* Section C: Recruitment Details */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[11px] font-bold text-primary-theme uppercase tracking-wider border-b border-border-theme pb-1">
                  C. Recruitment Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AppInput
                    label="Applied Trade Category *"
                    value={formData.trade}
                    onChange={(e) => setFormData((prev) => ({ ...prev, trade: e.target.value }))}
                    error={errors.trade}
                    placeholder="e.g. Electrician, Welder"
                    required
                  />
                  
                  <AppSelect
                    label="Job Order Placement (Optional)"
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
                    <option value="">No Placement Order (Unlinked)</option>
                    {jobOrdersList.map((jo) => (
                      <option key={jo.id} value={jo.id}>
                        {jo.orderNumber} - {jo.employerName} ({jo.country} - {jo.trade})
                      </option>
                    ))}
                  </AppSelect>

                  {activeRoleName === "Agent" ? (
                    <div className="md:col-span-2 rounded-xl bg-indigo-50/50 p-4 border border-indigo-100 dark:bg-indigo-950/15 dark:border-indigo-950/30 text-indigo-700 dark:text-indigo-400">
                      <p className="font-bold text-xs mb-0.5">Recruiter Scoping Active</p>
                      <p className="text-[11px] opacity-90">This applicant will be registered under your agency profile.</p>
                    </div>
                  ) : (
                    <div className="md:col-span-2">
                      <AppSelect
                        label="Agent Sourced Sourcing (Optional)"
                        value={formData.agentId}
                        onChange={(e) => setFormData((prev) => ({ ...prev, agentId: e.target.value }))}
                        error={errors.agentId}
                      >
                        <option value="">Walk-in Candidate (No Agent)</option>
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
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-primary-theme px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-hover shadow-primary-theme/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Applicant"
                )}
              </button>
            </div>
          </form>
        </AppModal>
      </PermissionGate>
    </div>
  );
}
