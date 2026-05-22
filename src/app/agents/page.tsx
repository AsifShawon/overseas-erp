"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatCard } from "@/components/ui/StatCard";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { useMockAuth } from "@/context/MockAuthContext";
import { useToast } from "@/context/ToastContext";
import { AppModal } from "@/components/ui/AppModal";
import { AppInput } from "@/components/ui/AppInput";
import { AppSelect } from "@/components/ui/AppSelect";
import { 
  Award, 
  FileSpreadsheet, 
  Plus, 
  Loader2, 
  AlertCircle, 
  Edit, 
  Ban, 
  Power, 
  Copy, 
  Check, 
  Globe2 
} from "lucide-react";

export default function AgentsPage() {
  const { hasAccess, accessToken, activeRoleName } = useMockAuth();
  const toast = useToast();

  // Core registry data states
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [tierFilter, setTierFilter] = useState("ALL");

  // Modals & form submission states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Create Form State
  const initialFormState = {
    companyName: "",
    fullName: "",
    email: "",
    phone: "",
    licenseNo: "",
    tier: "C" as "A" | "B" | "C",
    agentCode: "",
    accessMode: "TEMP_PASSWORD" as "TEMP_PASSWORD" | "INVITE_LINK",
  };
  const [formData, setFormData] = useState(initialFormState);

  // One-time success credentials display state
  const [successData, setSuccessData] = useState<any | null>(null);

  // Edit Form State
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    id: "",
    companyName: "",
    phone: "",
    licenseNo: "",
    tier: "C" as "A" | "B" | "C",
    isActive: true,
  });

  // Fetch live Sourcing Agents from PostgreSQL API
  const fetchAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const res = await fetch("/api/agents", {
        method: "GET",
        headers,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to load sourcing partners registry.");
      }

      const data = await res.json();
      setAgents(data.data || []);
    } catch (err: any) {
      console.error("Error fetching agents:", err);
      setError(err.message || "An unexpected error occurred while loading sourcing partners.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchAgents();
    }
  }, [accessToken]);

  // Handle Clipboard Copy with visual micro-feedback
  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast.error("Failed to copy credentials.");
    }
  };

  // Close modals safely and reset states
  const handleCancelCreate = () => {
    setFormData(initialFormState);
    setSuccessData(null);
    setErrors({});
    setFormError(null);
    setIsCreateModalOpen(false);
  };

  const handleCancelEdit = () => {
    setSelectedAgent(null);
    setErrors({});
    setFormError(null);
    setIsEditModalOpen(false);
  };

  // POST Request - Create new agent and provision credentials
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setErrors({});

    // Client-side validations
    const validationErrors: Record<string, string> = {};
    if (!formData.companyName.trim()) validationErrors.companyName = "Agency / Company Name is required";
    if (!formData.fullName.trim()) validationErrors.fullName = "Lead Representative Name is required";
    
    if (!formData.email.trim()) {
      validationErrors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      validationErrors.email = "Please specify a valid email address";
    }
    
    if (!formData.phone.trim()) validationErrors.phone = "Contact number is required";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormError("Please satisfy all highlighted requirements.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Record<string, any> = {
        companyName: formData.companyName.trim(),
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        tier: formData.tier,
        accessMode: formData.accessMode,
      };

      if (formData.licenseNo.trim()) payload.licenseNo = formData.licenseNo.trim();
      if (formData.agentCode.trim()) payload.agentCode = formData.agentCode.trim();

      const res = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Failed to register sourcing partner.");
      }

      toast.success("Sourcing agent created successfully!");
      
      // If temporary password or dev activation is provided, show credentials before closing
      if (resData.tempPassword || resData.devActivationLink) {
        setSuccessData({
          username: resData.username,
          tempPassword: resData.tempPassword,
          devActivationLink: resData.devActivationLink,
        });
        fetchAgents(); // Reload list background
      } else {
        // Safe activation invitation fallback (e.g. invite mode in production)
        handleCancelCreate();
        fetchAgents();
      }
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred during creation.");
      toast.error(err.message || "Failed to register sourcing agent.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit modal for specific agent
  const handleEditClick = (agent: any) => {
    setSelectedAgent(agent);
    setEditForm({
      id: agent.id,
      companyName: agent.companyName,
      phone: agent.phone || "",
      licenseNo: agent.licenseNo || "",
      tier: agent.tier || "C",
      isActive: agent.isActive ?? true,
    });
    setIsEditModalOpen(true);
  };

  // PATCH Request - Update agent profile
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setErrors({});

    const validationErrors: Record<string, string> = {};
    if (!editForm.companyName.trim()) validationErrors.companyName = "Agency name is required";
    if (!editForm.phone.trim()) validationErrors.phone = "Phone number is required";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormError("Please satisfy all highlighted requirements.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/agents/${editForm.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          companyName: editForm.companyName.trim(),
          phone: editForm.phone.trim(),
          licenseNo: editForm.licenseNo.trim() || null,
          tier: editForm.tier,
          isActive: editForm.isActive,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Failed to update sourcing partner.");
      }

      toast.success("Sourcing agent updated successfully!");
      handleCancelEdit();
      fetchAgents();
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred during update.");
      toast.error(err.message || "Failed to update agent.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // PATCH Request - Quick Inline Suspend / Reactivate licensing state
  const handleToggleActive = async (agent: any) => {
    const nextState = !agent.isActive;
    const actionText = nextState ? "activate" : "suspend";
    
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          isActive: nextState,
        }),
      });

      if (!res.ok) {
        const resData = await res.json().catch(() => ({}));
        throw new Error(resData.error || `Failed to ${actionText} agent.`);
      }

      toast.success(`Agent license ${nextState ? "activated" : "suspended"} successfully!`);
      fetchAgents();
    } catch (err: any) {
      toast.error(err.message || `An error occurred while toggling agent state.`);
    }
  };

  // Excel/CSV Exporter (Client-side execution, fully offline/edge friendly)
  const handleExport = () => {
    if (agents.length === 0) {
      toast.error("No sourcing partner records available to export.");
      return;
    }

    const headers = ["Agent Code", "Agency Name", "License No", "Tier", "Lead Rep", "Email", "Phone", "Status"];
    const rows = filteredAgents.map(a => [
      a.agentCode,
      a.companyName,
      a.licenseNo || "N/A",
      `Tier ${a.tier}`,
      a.fullName,
      a.email,
      a.phone || "N/A",
      a.isActive ? "Active Supply" : "Suspended"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sourcing_agents_registry_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Sourcing partners registry exported successfully!");
  };

  // Client-side filtering logic
  const filteredAgents = agents.filter((agt) => {
    if (tierFilter !== "ALL" && agt.tier !== tierFilter) return false;
    return true;
  });

  // Derived dashboard metrics
  const totalAgents = agents.length;
  const activeAgents = agents.filter((a) => a.isActive).length;
  const tierACount = agents.filter((a) => a.tier === "A").length;

  const tableColumns = [
    {
      header: "Agent Code",
      accessor: (a: any) => (
        <span className="font-mono font-bold text-primary-theme">
          {a.agentCode}
        </span>
      ),
    },
    {
      header: "Agency / Sourcing Partner",
      accessor: (a: any) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-text-theme">{a.companyName}</span>
          <span className="text-[10px] text-text-soft">License No: {a.licenseNo || "N/A"}</span>
        </div>
      ),
    },
    {
      header: "Lead Representative",
      accessor: (a: any) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-text-theme">{a.fullName}</span>
          <span className="text-[10px] text-text-soft">{a.email}</span>
        </div>
      ),
    },
    { 
      header: "Contact Number", 
      accessor: (a: any) => <span className="text-text-theme">{a.phone || "N/A"}</span> 
    },
    {
      header: "Agency Tier",
      accessor: (a: any) => (
        <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
          a.tier === "A" 
            ? "bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30" 
            : a.tier === "B" 
              ? "bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/30" 
              : "bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-900/30 dark:border-slate-800/40 dark:text-slate-400"
        }`}>
          <Award className="h-3 w-3 shrink-0" /> Tier {a.tier} Partner
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (a: any) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          a.isActive 
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30" 
            : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30"
        }`}>
          {a.isActive ? "Active Supply" : "License Suspended"}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: (a: any) => (
        <div className="flex items-center gap-1.5">
          {hasAccess("MANAGE_AGENTS") && (
            <>
              <button
                onClick={() => handleEditClick(a)}
                className="p-1.5 text-text-soft hover:text-primary-theme hover:bg-bg-muted rounded-lg transition-colors cursor-pointer"
                title="Edit Sourcing Partner Profile"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleToggleActive(a)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  a.isActive
                    ? "text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/15"
                    : "text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/15"
                }`}
                title={a.isActive ? "Suspend Sourcing Partner" : "Activate Sourcing Partner"}
              >
                {a.isActive ? <Ban className="h-4 w-4" /> : <Power className="h-4 w-4" />}
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PermissionGate 
        permission="VIEW_COMMISSIONS" 
        showFallback={true} 
        fallbackMessage="Access to Agent Sourcing partnerships, tier commissions, and licenses is restricted to administrative and accounts departments."
      >
        <PageHeader
          title="Sourcing Agents Registry"
          description="Track external supply licenses, company representative records, and tier commissions payouts."
          breadcrumbs={[{ label: "ERP Hub", href: "/dashboard" }, { label: "Agents" }]}
          actions={
            <div className="flex items-center gap-2">
              {hasAccess("MANAGE_AGENTS") && (
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-primary-theme px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-hover shadow-primary-theme/20 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Sourcing Agent
                </button>
              )}
              <button 
                onClick={handleExport}
                className="flex items-center gap-1.5 rounded-lg border border-border-theme bg-surface px-3.5 py-2 text-xs font-semibold text-text-theme hover:bg-bg-muted transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export CSV
              </button>
            </div>
          }
        />

        {/* Live Dynamic Analytics Cards */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl border border-border-theme bg-surface animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Total Registered Agents"
              value={totalAgents}
              description="External sourcing agencies registered"
              iconName="Users"
            />
            <StatCard
              title="Active Partnerships"
              value={`${activeAgents} Active`}
              description="Licensed for labor supply pipelines"
              iconName="UserCheck"
            />
            <StatCard
              title="Gold-Tier (Class A)"
              value={`${tierACount} Partners`}
              description="Primary sourcing agencies"
              iconName="Star"
            />
          </div>
        )}

        {/* Dynamic Filter bar */}
        <div className="flex flex-col gap-4 rounded-xl border border-border-theme bg-surface p-5 shadow-sm sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-text-soft text-xs font-bold mr-2">
            <span>Filter Partners:</span>
          </div>
          <div className="flex gap-2">
            {["ALL", "A", "B", "C"].map((tier) => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
                  tierFilter === tier
                    ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950"
                    : "bg-surface text-text-soft border-border-theme hover:bg-bg-muted"
                }`}
              >
                {tier === "ALL" ? "All Partners" : `Tier ${tier}`}
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
            <p className="text-xs text-text-soft font-bold animate-pulse">Querying live sourcing agent registry...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-rose-100 bg-rose-50/50 p-6 text-center shadow-sm dark:border-rose-950/10 dark:bg-rose-950/5 space-y-4">
            <AlertCircle className="h-10 w-10 text-rose-500" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-900 dark:text-rose-400">Failed to Load Agents</h3>
              <p className="text-xs text-rose-700/80 dark:text-rose-400/70 max-w-md">{error}</p>
            </div>
            <button
              onClick={fetchAgents}
              className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-sm cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <DataTable
            data={filteredAgents}
            columns={tableColumns}
            searchPlaceholder="Search by Sourcing Partner Name..."
            searchField="companyName"
            emptyStateTitle="No matching agent partners found"
            emptyStateDescription="Verify if the agents have been seeded in the database or register a new one to begin."
          />
        )}

        {/* ========================================== */}
        {/* ADD SOURCING AGENT MODAL                   */}
        {/* ========================================== */}
        <AppModal
          isOpen={isCreateModalOpen}
          onClose={handleCancelCreate}
          title={successData ? "Sourcing Credentials Provisioned" : "Add Sourcing Agent"}
          size="lg"
        >
          {successData ? (
            <div className="space-y-6 py-4">
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 dark:bg-emerald-950/20 dark:border-emerald-950/30 text-emerald-800 dark:text-emerald-400 flex items-start gap-2.5">
                <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5 animate-bounce" />
                <div className="space-y-0.5">
                  <h5 className="font-bold text-xs">Sourcing Partner Registration Confirmed!</h5>
                  <p className="text-[10px] opacity-90">Cryptographic system User role mappings and permissions written successfully.</p>
                </div>
              </div>

              <div className="rounded-xl border border-border-theme bg-bg-muted p-5 space-y-4 shadow-inner">
                {/* Username */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-text-soft uppercase tracking-wide">Portal Access Username</span>
                  <div className="flex items-center justify-between bg-surface rounded-lg border border-border-theme px-3.5 py-2">
                    <span className="font-mono text-xs text-text-theme font-bold">{successData.username}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(successData.username, "username")}
                      className="text-text-soft hover:text-primary-theme transition-colors cursor-pointer"
                    >
                      {copiedField === "username" ? <Check className="h-4.5 w-4.5 text-emerald-600" /> : <Copy className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                {/* Password (if TEMP_PASSWORD) */}
                {successData.tempPassword && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-text-soft uppercase tracking-wide">Temporary Password</span>
                    <div className="flex items-center justify-between bg-surface rounded-lg border border-border-theme px-3.5 py-2">
                      <span className="font-mono text-xs text-text-theme font-bold tracking-wider">{successData.tempPassword}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(successData.tempPassword, "password")}
                        className="text-text-soft hover:text-primary-theme transition-colors cursor-pointer"
                      >
                        {copiedField === "password" ? <Check className="h-4.5 w-4.5 text-emerald-600" /> : <Copy className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Dev Activation Link */}
                {successData.devActivationLink && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-text-soft uppercase tracking-wide">Dev Activation Link</span>
                    <div className="flex items-center justify-between bg-surface rounded-lg border border-border-theme px-3.5 py-2">
                      <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold truncate max-w-[280px]">{successData.devActivationLink}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(successData.devActivationLink, "activationLink")}
                        className="text-text-soft hover:text-primary-theme transition-colors cursor-pointer"
                      >
                        {copiedField === "activationLink" ? <Check className="h-4.5 w-4.5 text-emerald-600" /> : <Copy className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3.5">
                <div className="flex gap-2.5 rounded-xl bg-rose-50 border border-rose-100/40 p-4 dark:bg-rose-950/15 dark:border-rose-950/30 text-rose-800 dark:text-rose-400 text-xs shadow-sm">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-500" />
                  <p className="font-semibold leading-relaxed">
                    Save or print these credentials now. The temporary password will not be shown again.
                  </p>
                </div>
                <div className="flex gap-2.5 rounded-xl bg-amber-50 border border-amber-100/40 p-4 dark:bg-amber-950/15 dark:border-amber-950/30 text-amber-800 dark:text-amber-400 text-xs shadow-sm">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 text-amber-500" />
                  <p className="font-semibold leading-relaxed">
                    The agent should change this password after their first login.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-border-theme">
                <button
                  onClick={() => {
                    setSuccessData(null);
                    setIsCreateModalOpen(false);
                    setFormData(initialFormState);
                  }}
                  className="rounded-xl bg-primary-theme px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-hover shadow-primary-theme/20 cursor-pointer"
                >
                  Done & Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-6">
              {formError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 p-4 text-xs font-medium text-rose-800 dark:bg-rose-950/20 dark:border-rose-950/30 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
                {/* Agency Core info */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-primary-theme uppercase tracking-wider border-b border-border-theme pb-1">
                    A. Sourcing Agency Identity
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AppInput
                      label="Company / Agency Name *"
                      value={formData.companyName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
                      error={errors.companyName}
                      placeholder="e.g. Chowdhury Sourcing Ltd"
                      required
                    />
                    <AppInput
                      label="License Number (Optional)"
                      value={formData.licenseNo}
                      onChange={(e) => setFormData((prev) => ({ ...prev, licenseNo: e.target.value }))}
                      error={errors.licenseNo}
                      placeholder="e.g. RL-9082"
                    />
                    <AppSelect
                      label="Agency Partnership Tier *"
                      value={formData.tier}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tier: e.target.value as "A" | "B" | "C" }))}
                      error={errors.tier}
                      required
                    >
                      <option value="C">Tier C Partner (Basic scale)</option>
                      <option value="B">Tier B Partner (Mid scale)</option>
                      <option value="A">Tier A Partner (Premium gold scale)</option>
                    </AppSelect>
                    <AppInput
                      label="Agent Code (Optional - Auto Generated)"
                      value={formData.agentCode}
                      onChange={(e) => setFormData((prev) => ({ ...prev, agentCode: e.target.value }))}
                      error={errors.agentCode}
                      placeholder="e.g. AGT-004"
                    />
                  </div>
                </div>

                {/* Lead representative info */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[11px] font-bold text-primary-theme uppercase tracking-wider border-b border-border-theme pb-1">
                    B. Representative & Access Controls
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AppInput
                      label="Lead Representative Full Name *"
                      value={formData.fullName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                      error={errors.fullName}
                      placeholder="e.g. Kabir Chowdhury"
                      required
                    />
                    <AppInput
                      label="Contact Email Address *"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      error={errors.email}
                      placeholder="e.g. agent@agent.com"
                      required
                    />
                    <AppInput
                      label="Contact Number *"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      error={errors.phone}
                      placeholder="e.g. +880-1711-234567"
                      required
                    />
                    <AppSelect
                      label="Access Mode / Credential Handshake *"
                      value={formData.accessMode}
                      onChange={(e) => setFormData((prev) => ({ ...prev, accessMode: e.target.value as "TEMP_PASSWORD" | "INVITE_LINK" }))}
                      error={errors.accessMode}
                      required
                    >
                      <option value="TEMP_PASSWORD">Temporary Password (Instant Display)</option>
                      <option value="INVITE_LINK">Generate Invite Link (Activation flow)</option>
                    </AppSelect>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-theme">
                <button
                  type="button"
                  onClick={handleCancelCreate}
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
                      Provisioning...
                    </>
                  ) : (
                    "Create Agent Profile"
                  )}
                </button>
              </div>
            </form>
          )}
        </AppModal>

        {/* ========================================== */}
        {/* EDIT SOURCING AGENT MODAL                     */}
        {/* ========================================== */}
        <AppModal
          isOpen={isEditModalOpen}
          onClose={handleCancelEdit}
          title="Edit Sourcing Agent"
          size="lg"
        >
          {selectedAgent && (
            <form onSubmit={handleEditSubmit} className="space-y-6">
              {formError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 p-4 text-xs font-medium text-rose-800 dark:bg-rose-950/20 dark:border-rose-950/30 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
                {/* Agency Core details */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-primary-theme uppercase tracking-wider border-b border-border-theme pb-1">
                    Agency & Partnership Controls (Agent: {selectedAgent.agentCode})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AppInput
                      label="Company / Agency Name *"
                      value={editForm.companyName}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, companyName: e.target.value }))}
                      error={errors.companyName}
                      placeholder="e.g. Chowdhury Sourcing Ltd"
                      required
                    />
                    <AppInput
                      label="License Number"
                      value={editForm.licenseNo}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, licenseNo: e.target.value }))}
                      error={errors.licenseNo}
                      placeholder="e.g. RL-9082"
                    />
                    <AppSelect
                      label="Agency Partnership Tier *"
                      value={editForm.tier}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, tier: e.target.value as "A" | "B" | "C" }))}
                      error={errors.tier}
                      required
                    >
                      <option value="C">Tier C Partner (Basic scale)</option>
                      <option value="B">Tier B Partner (Mid scale)</option>
                      <option value="A">Tier A Partner (Premium gold scale)</option>
                    </AppSelect>
                    <AppInput
                      label="Representative Contact Phone *"
                      value={editForm.phone}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                      error={errors.phone}
                      required
                    />
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-text-soft uppercase tracking-wide">License Integrity & Status</label>
                      <div className="flex h-10 items-center gap-2">
                        <input
                          type="checkbox"
                          id="edit-active-toggle"
                          checked={editForm.isActive}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                          className="h-4 w-4 rounded border-border-strong text-primary-theme focus:ring-primary-theme cursor-pointer accent-primary-theme"
                        />
                        <label
                          htmlFor="edit-active-toggle"
                          className="text-xs font-semibold text-text-theme cursor-pointer select-none"
                        >
                          Licensing Status: Active (Set false to suspend system access & applicant creation)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-theme">
                <button
                  type="button"
                  onClick={handleCancelEdit}
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
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
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
