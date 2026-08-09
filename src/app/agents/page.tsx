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
import { useT } from "@/i18n/useT";
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
  const { hasAccess, accessToken } = useMockAuth();
  const toast = useToast();
  const { t, locale } = useT();

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
        throw new Error(
          errorData.error || 
          (locale === "bn" ? "সোর্সিং পার্টনারদের তালিকা লোড করতে ব্যর্থ হয়েছে।" : "Failed to load sourcing partners registry.")
        );
      }

      const data = await res.json();
      setAgents(data.data || []);
    } catch (err: any) {
      console.error("Error fetching agents:", err);
      setError(
        err.message || 
        (locale === "bn" ? "সোর্সিং পার্টনার লোড করার সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।" : "An unexpected error occurred while loading sourcing partners.")
      );
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
      toast.success(locale === "bn" ? "ক্লিপবোর্ডে কপি করা হয়েছে!" : "Copied to clipboard!");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast.error(locale === "bn" ? "ক্রেডেন্সিয়াল কপি করা সম্ভব হয়নি।" : "Failed to copy credentials.");
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
    if (!formData.companyName.trim()) {
      validationErrors.companyName = locale === "bn" ? "এজেন্সি / কোম্পানির নাম আবশ্যক" : "Agency / Company Name is required";
    }
    if (!formData.fullName.trim()) {
      validationErrors.fullName = locale === "bn" ? "প্রধান এজেন্টের নাম আবশ্যক" : "Lead Representative Name is required";
    }
    
    if (!formData.email.trim()) {
      validationErrors.email = locale === "bn" ? "ইমেল ঠিকানা আবশ্যক" : "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      validationErrors.email = locale === "bn" ? "অনুগ্রহ করে একটি সঠিক ইমেল প্রদান করুন" : "Please specify a valid email address";
    }
    
    if (!formData.phone.trim()) {
      validationErrors.phone = locale === "bn" ? "যোগাযোগের মোবাইল নম্বর আবশ্যক" : "Contact number is required";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormError(locale === "bn" ? "অনুগ্রহ করে সব আবশ্যক ঘর পূরণ করুন।" : "Please satisfy all highlighted requirements.");
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
        throw new Error(resData.error || (locale === "bn" ? "সোর্সিং পার্টনার নিবন্ধন করতে ব্যর্থ হয়েছে।" : "Failed to register sourcing partner."));
      }

      toast.success(locale === "bn" ? "সোর্সিং এজেন্ট সফলভাবে তৈরি হয়েছে!" : "Sourcing agent created successfully!");
      
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
      setFormError(err.message || (locale === "bn" ? "অপ্রত্যাশিত ত্রুটি ঘটেছে।" : "An unexpected error occurred during creation."));
      toast.error(err.message || (locale === "bn" ? "এজেন্ট তৈরি করতে ব্যর্থ হয়েছে।" : "Failed to register sourcing agent."));
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
    if (!editForm.companyName.trim()) {
      validationErrors.companyName = locale === "bn" ? "এজেন্সির নাম আবশ্যক" : "Agency name is required";
    }
    if (!editForm.phone.trim()) {
      validationErrors.phone = locale === "bn" ? "মোবাইল নম্বর আবশ্যক" : "Phone number is required";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormError(locale === "bn" ? "অনুগ্রহ করে সব আবশ্যক ঘর পূরণ করুন।" : "Please satisfy all highlighted requirements.");
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
        throw new Error(resData.error || (locale === "bn" ? "সোর্সিং পার্টনার আপডেট করতে ব্যর্থ হয়েছে।" : "Failed to update sourcing partner."));
      }

      toast.success(locale === "bn" ? "সোর্সিং এজেন্ট সফলভাবে আপডেট করা হয়েছে!" : "Sourcing agent updated successfully!");
      handleCancelEdit();
      fetchAgents();
    } catch (err: any) {
      setFormError(err.message || (locale === "bn" ? "অপ্রত্যাশিত ত্রুটি ঘটেছে।" : "An unexpected error occurred during update."));
      toast.error(err.message || (locale === "bn" ? "এজেন্ট আপডেট করতে ব্যর্থ হয়েছে।" : "Failed to update agent."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // PATCH Request - Quick Inline Suspend / Reactivate licensing state
  const handleToggleActive = async (agent: any) => {
    const nextState = !agent.isActive;
    const actionText = nextState 
      ? (locale === "bn" ? "সক্রিয়" : "activate") 
      : (locale === "bn" ? "স্থগিত" : "suspend");
    
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
        throw new Error(resData.error || (locale === "bn" ? `এজেন্ট ${actionText} করতে ব্যর্থ হয়েছে।` : `Failed to ${actionText} agent.`));
      }

      toast.success(
        locale === "bn" 
          ? `এজেন্ট লাইসেন্স সফলভাবে ${nextState ? "সক্রিয়" : "স্থগিত"} করা হয়েছে!` 
          : `Agent license ${nextState ? "activated" : "suspended"} successfully!`
      );
      fetchAgents();
    } catch (err: any) {
      toast.error(err.message || (locale === "bn" ? `এজেন্টের অবস্থা পরিবর্তন করার সময় ত্রুটি ঘটেছে।` : `An error occurred while toggling agent state.`));
    }
  };

  // Excel/CSV Exporter (Client-side execution, fully offline/edge friendly)
  const handleExport = () => {
    if (agents.length === 0) {
      toast.error(locale === "bn" ? "এক্সপোর্ট করার জন্য কোনো সোর্সিং পার্টনার রেকর্ড পাওয়া যায়নি।" : "No sourcing partner records available to export.");
      return;
    }

    const headers = locale === "bn" 
      ? ["এজেন্ট কোড", "এজেন্সি কোম্পানির নাম", "লাইসেন্স নম্বর", "পার্টনার ক্যাটাগরি", "প্রধান এজেন্টের নাম", "ইমেল", "মোবাইল নং", "অবস্থা"]
      : ["Agent Code", "Agency Name", "License No", "Tier", "Lead Rep", "Email", "Phone", "Status"];

    const rows = filteredAgents.map(a => [
      a.agentCode,
      a.companyName,
      a.licenseNo || "N/A",
      locale === "bn" ? `ক্যাটাগরি ${a.tier}` : `Tier ${a.tier}`,
      a.fullName,
      a.email,
      a.phone || "N/A",
      locale === "bn" ? (a.isActive ? "সক্রিয় সরবরাহ" : "স্থগিত") : (a.isActive ? "Active Supply" : "Suspended")
    ]);

    // Convert to CSV using a safe Blob URL
    const csvText = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(","))
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sourcing_agents_registry_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(locale === "bn" ? "সোর্সিং পার্টনারদের তালিকা সফলভাবে এক্সপোর্ট করা হয়েছে!" : "Sourcing partners registry exported successfully!");
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
      header: t("agents.tableHeaderCode"),
      accessor: (a: any) => (
        <span className="font-mono font-bold text-primary-theme bg-primary-soft border border-primary-theme/20 px-2 py-0.5 rounded text-xs">
          {a.agentCode}
        </span>
      ),
    },
    {
      header: t("agents.tableHeaderCompany"),
      accessor: (a: any) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-muted text-text-theme font-bold text-xs shrink-0 uppercase border border-border-theme">
            <Globe2 className="h-4 w-4 text-primary-theme" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-text-theme truncate text-xs">{a.companyName}</span>
            <span className="text-[11px] text-text-soft truncate font-medium">
              {locale === "bn" ? "লাইসেন্স নং: " : "License: "}
              <span className="font-mono text-text-muted">{a.licenseNo || "N/A"}</span>
            </span>
          </div>
        </div>
      ),
    },
    {
      header: locale === "bn" ? "প্রধান প্রতিনিধি" : "Lead Representative",
      accessor: (a: any) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-text-theme text-xs">{a.fullName}</span>
          <span className="text-[11px] text-text-soft font-mono font-medium">{a.email}</span>
        </div>
      ),
    },
    { 
      header: t("agents.tableHeaderPhone"), 
      accessor: (a: any) => <span className="text-text-theme font-mono font-semibold text-xs">{a.phone || "N/A"}</span> 
    },
    {
      header: t("common.status"),
      accessor: (a: any) => (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold border ${
          a.isActive 
            ? "bg-success-soft text-success-theme border-success-theme/30" 
            : "bg-danger-soft text-danger-theme border-danger-theme/30"
        }`}>
          {locale === "bn"
            ? (a.isActive ? "সক্রিয় সরবরাহ" : "লাইসেন্স স্থগিত")
            : (a.isActive ? "Active Supply" : "License Suspended")
          }
        </span>
      ),
    },
    {
      header: t("common.actions"),
      accessor: (a: any) => (
        <div className="flex items-center gap-1">
          {hasAccess("MANAGE_AGENTS") && (
            <>
              <button
                onClick={() => handleEditClick(a)}
                className="p-1 text-text-soft hover:text-primary-theme hover:bg-bg-muted rounded-md transition-colors cursor-pointer"
                title={locale === "bn" ? "সম্পাদন" : "Edit Profile"}
              >
                <Edit className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleToggleActive(a)}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  a.isActive
                    ? "text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20"
                    : "text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/20"
                }`}
                title={locale === "bn" ? (a.isActive ? "স্থগিত করুন" : "সক্রিয় করুন") : (a.isActive ? "Suspend" : "Activate")}
              >
                {a.isActive ? <Ban className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
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
        fallbackMessage={
          locale === "bn"
            ? "এজেন্ট সোর্সিং অংশীদারিত্ব, টায়ার কমিশন এবং লাইসেন্সিং অ্যাক্সেস শুধুমাত্র প্রশাসনিক এবং হিসাব বিভাগের জন্য সীমাবদ্ধ।"
            : "Access to Agent Sourcing partnerships, tier commissions, and licenses is restricted to administrative and accounts departments."
        }
      >
        <PageHeader
          title={t("agents.pageTitle")}
          description={t("agents.pageDesc")}
          breadcrumbs={[
            { label: locale === "bn" ? "ইআরপি হাব" : "ERP Hub", href: "/dashboard" }, 
            { label: t("nav.agents") }
          ]}
          actions={
            <div className="flex items-center gap-2">
              {hasAccess("MANAGE_AGENTS") && (
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-primary-theme px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-hover shadow-primary-theme/20 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> {t("agents.addAgentBtn")}
                </button>
              )}
              <button 
                onClick={handleExport}
                className="flex items-center gap-1.5 rounded-lg border border-border-theme bg-surface px-3.5 py-2 text-xs font-semibold text-text-theme hover:bg-bg-muted transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> {t("common.exportCsv")}
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
              title={locale === "bn" ? "মোট নিবন্ধিত এজেন্ট" : "Total Registered Agents"}
              value={totalAgents}
              description={locale === "bn" ? "নিবন্ধিত বহিরাগত সোর্সিং সংস্থা" : "External sourcing agencies registered"}
              iconName="Users"
            />
            <StatCard
              title={locale === "bn" ? "সক্রিয় অংশীদারিত্ব" : "Active Partnerships"}
              value={locale === "bn" ? `${activeAgents} জন সক্রিয়` : `${activeAgents} Active`}
              description={locale === "bn" ? "শ্রম সরবরাহ পাইপলাইনের জন্য অনুমোদিত" : "Licensed for labor supply pipelines"}
              iconName="UserCheck"
            />
            <StatCard
              title={locale === "bn" ? "গোল্ড-টায়ার (ক্লাস এ)" : "Gold-Tier (Class A)"}
              value={locale === "bn" ? `${tierACount} টি সংস্থা` : `${tierACount} Partners`}
              description={locale === "bn" ? "প্রধান সোর্সিং এজেন্সিসমূহ" : "Primary sourcing agencies"}
              iconName="Star"
            />
          </div>
        )}



        {/* Live Database Data Table Rendering */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-border-theme bg-surface shadow-sm space-y-4">
            <div className="relative h-12 w-12 rounded-2xl bg-surface border border-border-theme flex items-center justify-center shadow-lg">
              <Loader2 className="h-6 w-6 text-primary-theme animate-spin" />
            </div>
            <p className="text-xs text-text-soft font-bold animate-pulse">
              {locale === "bn" ? "সরাসরি সোর্সিং এজেন্ট ডেটা অনুসন্ধান করা হচ্ছে..." : "Querying live sourcing agent registry..."}
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-rose-100 bg-rose-50/50 p-6 text-center shadow-sm dark:border-rose-950/10 dark:bg-rose-950/5 space-y-4">
            <AlertCircle className="h-10 w-10 text-rose-500" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-900 dark:text-rose-400">
                {locale === "bn" ? "এজেন্ট লোড করতে ব্যর্থ" : "Failed to Load Agents"}
              </h3>
              <p className="text-xs text-rose-700/80 dark:text-rose-400/70 max-w-md">{error}</p>
            </div>
            <button
              onClick={fetchAgents}
              className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-sm cursor-pointer"
            >
              {t("dashboard.retryBtn")}
            </button>
          </div>
        ) : (
          <DataTable
            data={filteredAgents}
            columns={tableColumns}
            searchPlaceholder={t("agents.searchPlaceholder")}
            searchField="companyName"
            emptyStateTitle={locale === "bn" ? "কোনো ম্যাচিং এজেন্ট পার্টনার পাওয়া যায়নি" : "No matching agent partners found"}
            emptyStateDescription={locale === "bn" ? "যাচাই করুন এজেন্ট ডাটাবেসে নিবন্ধিত আছে কিনা অথবা শুরু করতে একটি নতুন এজেন্ট যোগ করুন।" : "Verify if the agents have been seeded in the database or register a new one to begin."}
          />
        )}

        {/* ========================================== */}
        {/* ADD SOURCING AGENT MODAL                   */}
        {/* ========================================== */}
        <AppModal
          isOpen={isCreateModalOpen}
          onClose={handleCancelCreate}
          title={
            successData 
              ? (locale === "bn" ? "সোর্সিং ক্রেডেন্সিয়াল প্রস্তুত করা হয়েছে" : "Sourcing Credentials Provisioned") 
              : t("agents.addModalTitle")
          }
          size="lg"
        >
          {successData ? (
            <div className="space-y-6 py-4">
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 dark:bg-emerald-950/20 dark:border-emerald-950/30 text-emerald-800 dark:text-emerald-400 flex items-start gap-2.5">
                <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5 animate-bounce" />
                <div className="space-y-0.5">
                  <h5 className="font-bold text-xs">
                    {locale === "bn" ? "সোর্সিং পার্টনার নিবন্ধন নিশ্চিত করা হয়েছে!" : "Sourcing Partner Registration Confirmed!"}
                  </h5>
                  <p className="text-[10px] opacity-90">
                    {locale === "bn" ? "সিস্টেম ইউজার রোল ম্যাপিং এবং পারমিশন সফলভাবে সম্পন্ন হয়েছে।" : "Cryptographic system User role mappings and permissions written successfully."}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border-theme bg-bg-muted p-5 space-y-4 shadow-inner">
                {/* Username */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-text-soft uppercase tracking-wide">
                    {locale === "bn" ? "পোর্টাল ইউজারনেম" : "Portal Access Username"}
                  </span>
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
                    <span className="text-[10px] font-bold text-text-soft uppercase tracking-wide">
                      {locale === "bn" ? "সাময়িক পাসওয়ার্ড" : "Temporary Password"}
                    </span>
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
                    <span className="text-[10px] font-bold text-text-soft uppercase tracking-wide">
                      {locale === "bn" ? "ডেভেলপার অ্যাক্টিভেশন লিঙ্ক" : "Dev Activation Link"}
                    </span>
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
                    {locale === "bn" 
                      ? "এই ক্রেডেন্সিয়ালগুলো এখন সংরক্ষণ বা প্রিন্ট করুন। সাময়িক পাসওয়ার্ডটি রিফ্রেশ করার পর আর দেখা যাবে না।" 
                      : "Save or print these credentials now. The temporary password will not be shown again."}
                  </p>
                </div>
                <div className="flex gap-2.5 rounded-xl bg-amber-50 border border-amber-100/40 p-4 dark:bg-amber-950/15 dark:border-amber-950/30 text-amber-800 dark:text-amber-400 text-xs shadow-sm">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 text-amber-500" />
                  <p className="font-semibold leading-relaxed">
                    {locale === "bn"
                      ? "প্রথমবার সাইন-ইনের পর এজেন্টের এই পাসওয়ার্ডটি পরিবর্তন করা উচিত।"
                      : "The agent should change this password after their first login."}
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
                  {locale === "bn" ? "সম্পন্ন ও বন্ধ করুন" : "Done & Close"}
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
                    {locale === "bn" ? "ক. সোর্সিং এজেন্সি বিবরণ" : "A. Sourcing Agency Identity"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AppInput
                      label={locale === "bn" ? "এজেন্সি / কোম্পানির নাম *" : "Company / Agency Name *"}
                      value={formData.companyName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
                      error={errors.companyName}
                      placeholder="e.g. Chowdhury Sourcing Ltd"
                      required
                    />
                    <AppInput
                      label={locale === "bn" ? "লাইসেন্স নম্বর (ঐচ্ছিক)" : "License Number (Optional)"}
                      value={formData.licenseNo}
                      onChange={(e) => setFormData((prev) => ({ ...prev, licenseNo: e.target.value }))}
                      error={errors.licenseNo}
                      placeholder="e.g. RL-9082"
                    />
                    <AppSelect
                      label={locale === "bn" ? "এজেন্সি পার্টনারশিপ টায়ার *" : "Agency Partnership Tier *"}
                      value={formData.tier}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tier: e.target.value as "A" | "B" | "C" }))}
                      error={errors.tier}
                      required
                    >
                      <option value="C">{locale === "bn" ? "টায়ার সি পার্টনার (বেসিক স্কেল)" : "Tier C Partner (Basic scale)"}</option>
                      <option value="B">{locale === "bn" ? "টায়ার বি পার্টনার (মিড স্কেল)" : "Tier B Partner (Mid scale)"}</option>
                      <option value="A">{locale === "bn" ? "টায়ার এ পার্টনার (প্রিমিয়াম গোল্ড স্কেল)" : "Tier A Partner (Premium gold scale)"}</option>
                    </AppSelect>
                    <AppInput
                      label={locale === "bn" ? "এজেন্ট কোড (ঐচ্ছিক - স্বয়ংক্রিয় প্রস্তুত)" : "Agent Code (Optional - Auto Generated)"}
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
                    {locale === "bn" ? "খ. প্রতিনিধি ও প্রবেশাধিকার নিয়ন্ত্রণ" : "B. Representative & Access Controls"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AppInput
                      label={locale === "bn" ? "প্রধান এজেন্টের সম্পূর্ণ নাম *" : "Lead Representative Full Name *"}
                      value={formData.fullName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                      error={errors.fullName}
                      placeholder="e.g. Kabir Chowdhury"
                      required
                    />
                    <AppInput
                      label={locale === "bn" ? "ইমেল ঠিকানা *" : "Contact Email Address *"}
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      error={errors.email}
                      placeholder="e.g. agent@agent.com"
                      required
                    />
                    <AppInput
                      label={locale === "bn" ? "মোবাইল ফোন নম্বর *" : "Contact Number *"}
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      error={errors.phone}
                      placeholder="e.g. +880-1711-234567"
                      required
                    />
                    <AppSelect
                      label={locale === "bn" ? "অ্যাক্সেস মোড / ক্রেডেন্সিয়াল হ্যান্ডশেক *" : "Access Mode / Credential Handshake *"}
                      value={formData.accessMode}
                      onChange={(e) => setFormData((prev) => ({ ...prev, accessMode: e.target.value as "TEMP_PASSWORD" | "INVITE_LINK" }))}
                      error={errors.accessMode}
                      required
                    >
                      <option value="TEMP_PASSWORD">{locale === "bn" ? "সাময়িক পাসওয়ার্ড (সরাসরি প্রদর্শন)" : "Temporary Password (Instant Display)"}</option>
                      <option value="INVITE_LINK">{locale === "bn" ? "আমন্ত্রণ লিঙ্ক তৈরি করুন (অ্যাক্টিভেশন ফ্লো)" : "Generate Invite Link (Activation flow)"}</option>
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
                      {locale === "bn" ? "প্রস্তুত হচ্ছে..." : "Provisioning..."}
                    </>
                  ) : (
                    locale === "bn" ? "এজেন্ট প্রোফাইল তৈরি করুন" : "Create Agent Profile"
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
          title={locale === "bn" ? "সোর্সিং এজেন্ট সম্পাদন" : "Edit Sourcing Agent"}
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
                    {locale === "bn"
                      ? `এজেন্সি ও অংশীদারিত্ব নিয়ন্ত্রণ (এজেন্ট কোড: ${selectedAgent.agentCode})`
                      : `Agency & Partnership Controls (Agent: ${selectedAgent.agentCode})`
                    }
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AppInput
                      label={locale === "bn" ? "এজেন্সি / কোম্পানির নাম *" : "Company / Agency Name *"}
                      value={editForm.companyName}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, companyName: e.target.value }))}
                      error={errors.companyName}
                      placeholder="e.g. Chowdhury Sourcing Ltd"
                      required
                    />
                    <AppInput
                      label={locale === "bn" ? "লাইসেন্স নম্বর" : "License Number"}
                      value={editForm.licenseNo}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, licenseNo: e.target.value }))}
                      error={errors.licenseNo}
                      placeholder="e.g. RL-9082"
                    />
                    <AppSelect
                      label={locale === "bn" ? "এজেন্সি পার্টনারশিপ টায়ার *" : "Agency Partnership Tier *"}
                      value={editForm.tier}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, tier: e.target.value as "A" | "B" | "C" }))}
                      error={errors.tier}
                      required
                    >
                      <option value="C">{locale === "bn" ? "টায়ার সি পার্টনার (বেসিক স্কেল)" : "Tier C Partner (Basic scale)"}</option>
                      <option value="B">{locale === "bn" ? "টায়ার বি পার্টনার (মিড স্কেল)" : "Tier B Partner (Mid scale)"}</option>
                      <option value="A">{locale === "bn" ? "টায়ার এ পার্টনার (প্রিমিয়াম গোল্ড স্কেল)" : "Tier A Partner (Premium gold scale)"}</option>
                    </AppSelect>
                    <AppInput
                      label={locale === "bn" ? "মোবাইল ফোন নম্বর *" : "Representative Contact Phone *"}
                      value={editForm.phone}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                      error={errors.phone}
                      required
                    />
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-text-soft uppercase tracking-wide">
                        {locale === "bn" ? "লাইসেন্স ও অবস্থা" : "License Integrity & Status"}
                      </label>
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
                          {locale === "bn"
                            ? "লাইসেন্স স্ট্যাটাস: সক্রিয় (সিস্টেম প্রবেশ ও প্রার্থী তৈরি স্থগিত করতে আনচেক করুন)"
                            : "Licensing Status: Active (Set false to suspend system access & applicant creation)"
                          }
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
                      {locale === "bn" ? "সংরক্ষণ হচ্ছে..." : "Saving..."}
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
