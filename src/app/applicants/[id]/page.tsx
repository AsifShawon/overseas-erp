"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMockAuth } from "@/context/MockAuthContext";
import { useToast } from "@/context/ToastContext";
import { useDialog } from "@/context/DialogContext";
import { ApplicantProfileCard } from "@/components/shared/ApplicantProfileCard";
import { PortalAccessPanel } from "@/components/shared/PortalAccessPanel";
import { DocumentChecklist } from "@/components/shared/DocumentChecklist";
import { LedgerTable } from "@/components/shared/LedgerTable";
import { WorkflowStepper } from "@/components/shared/WorkflowStepper";
import { ReceiptPreview } from "@/components/shared/ReceiptPreview";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AppButton } from "@/components/ui/AppButton";
import { AppBadge } from "@/components/ui/AppBadge";
import { Tabs } from "@/components/ui/Tabs";
import { SummaryStrip } from "@/components/ui/SummaryStrip";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorPanel, EmptyPanel } from "@/components/ui/PageState";
import { useT } from "@/i18n/useT";
import { formatCurrency } from "@/i18n/format";
import {
  MockApplicant,
  MockDocument,
  MockLedgerEntry,
  MockReceipt,
  MockInvoice,
  WorkflowStage,
} from "@/lib/mockData";
import {
  User,
  FileText,
  CreditCard,
  ArrowLeft,
  Archive,
  RotateCcw,
  GitBranch,
  Loader2,
} from "lucide-react";

interface DBApplicant {
  id: string;
  userId: string | null;
  agentId: string | null;
  jobOrderId: string | null;
  passportNumber: string;
  passportExpiry: string | Date;
  nationality: string;
  fullName: string;
  phone: string;
  email: string | null;
  dateOfBirth: string | Date;
  nidNumber: string | null;
  address: string | null;
  emergencyContact: string | null;
  isArchived: boolean;
  archivedAt: string | Date | null;
  trade: string;
  currentStage: WorkflowStage;
  createdAt: string | Date;
  updatedAt: string | Date;
  agent?: {
    id: string;
    agentCode: string;
    companyName: string;
  } | null;
  jobOrder?: {
    id: string;
    orderNumber: string;
    employerName: string;
    country: string;
    trade: string;
    salary: number | string;
    totalQuota: number;
    allocatedQuota: number;
    commissionAmount: number | string;
    status: string;
  } | null;
  workflows?: Array<{
    id: string;
    applicantId: string;
    oldStage: WorkflowStage;
    newStage: WorkflowStage;
    changedById: string;
    changeNotes: string | null;
    timestamp: string | Date;
  }>;
  documents?: Array<{
    id: string;
    applicantId: string;
    documentType: string;
    fileUrl: string;
    fileName: string;
    status: string;
    expiryDate: string | Date | null;
    verifiedById: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
  }>;
  invoices?: Array<{
    id: string;
    applicantId: string;
    invoiceNo: string;
    amount: number | string;
    outstanding: number | string;
    dueDate: string | Date;
    description: string;
    createdAt: string | Date;
  }>;
  receipts?: Array<{
    id: string;
    applicantId: string;
    invoiceId: string | null;
    receiptNo: string;
    amountPaid: number | string;
    paymentMethod: string;
    referenceNo: string | null;
    receivedById: string;
    createdAt: string | Date;
  }>;
  ledgerEntries?: Array<{
    id: string;
    applicantId: string;
    transactionType: string;
    referenceId: string;
    debit: number | string;
    credit: number | string;
    runningBalance: number | string;
    timestamp: string | Date;
  }>;
}

export default function ApplicantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user, accessToken, loading: authLoading, hasAccess } = useMockAuth();
  const toast = useToast();
  const { prompt } = useDialog();
  const { t, locale } = useT();

  const canArchive =
    user && (
      hasAccess("ARCHIVE_APPLICANT") ||
      hasAccess("UPDATE_APPLICANT") ||
      ["Super Admin", "Operations Admin"].includes(user.roleName)
    );

  // Dynamic state for dynamic PostgreSQL loads
  const [dbData, setDbData] = useState<DBApplicant | null>(null);
  const [fetching, setFetching] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  // Transitioning & Mutation states
  const [transitioning, setTransitioning] = useState<boolean>(false);

  // Invoicing states
  const [invoicing, setInvoicing] = useState<boolean>(false);

  // Receipt states
  const [recordingReceipt, setRecordingReceipt] = useState<boolean>(false);

  // Tab and Interactive state
  const [activeTab, setActiveTab] = useState<
    "bio" | "workflow" | "compliance" | "financial"
  >("bio");
  const [selectedReceipt, setSelectedReceipt] = useState<MockReceipt | undefined>(undefined);
  const [readOnlyAlert, setReadOnlyAlert] = useState<{ action: string } | null>(null);

  // Extract loadData to be callable after mutations
  const loadData = async () => {
    if (!accessToken) return;
    try {
      setFetching(true);
      setFetchError(null);
      setStatusCode(null);

      const res = await fetch(`/api/applicants/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setStatusCode(res.status);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      setDbData(data);
    } catch (err: any) {
      setFetchError(err.message || "An error occurred.");
    } finally {
      setFetching(false);
    }
  };

  // Load applicant details from API route
  useEffect(() => {
    if (authLoading) return;

    if (!accessToken) {
      setStatusCode(401);
      setFetchError("Unauthorized.");
      setFetching(false);
      return;
    }

    loadData();
  }, [id, accessToken, authLoading]);

  // Auth/fetch loading — skeleton mirrors the real dossier layout
  if (authLoading || fetching) {
    return (
      <div className="space-y-5">
        <div className="space-y-3">
          <Skeleton className="h-3 w-28" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10" circle />
            <Skeleton className="h-6 w-56" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Unauthorized session
  if (statusCode === 401) {
    return (
      <ErrorPanel
        title={locale === "bn" ? "সেশন শেষ হয়েছে" : "Session expired"}
        message={
          locale === "bn"
            ? "আপনার নিরাপত্তা সেশন শেষ হয়ে গেছে। অনুগ্রহ করে আবার লগইন করুন।"
            : "Your authentication session has expired. Please sign in again."
        }
        onRetry={() => router.push("/login")}
        retryLabel={locale === "bn" ? "লগইন" : "Go to login"}
      />
    );
  }

  // Scope-restricted access
  if (statusCode === 403) {
    return (
      <ErrorPanel
        title={t("common.accessDenied")}
        message={
          locale === "bn"
            ? "আপনার এই আবেদনকারীর ফাইল দেখার অনুমতি নেই।"
            : "You do not have permission to view this candidate dossier."
        }
        onRetry={() => router.push("/applicants")}
        retryLabel={t("applicantDetail.backBtn")}
      />
    );
  }

  // Not found
  if (statusCode === 404 || !dbData) {
    return (
      <EmptyPanel
        iconName="FileQuestion"
        title={
          locale === "bn" ? "আবেদনকারী ফাইল পাওয়া যায়নি" : "Candidate not found"
        }
        description={
          locale === "bn"
            ? "অনুরোধ করা ফাইলটি খুঁজে পাওয়া যায়নি বা এটি আপনার স্কোপের বাইরে।"
            : "The requested applicant could not be found, or it falls outside your access scope."
        }
        action={
          <AppButton variant="secondary" onClick={() => router.push("/applicants")}>
            <ArrowLeft className="h-4 w-4" />
            {t("applicantDetail.backBtn")}
          </AppButton>
        }
      />
    );
  }

  // Mapping layer to align dynamic DB fields with strict mock interface expectations
  const applicant: MockApplicant = {
    id: dbData.id,
    fullName: dbData.fullName,
    phone: dbData.phone,
    email: dbData.email,
    passportNumber: dbData.passportNumber,
    passportExpiry: new Date(dbData.passportExpiry).toISOString().split("T")[0],
    nationality: dbData.nationality,
    dateOfBirth: new Date(dbData.dateOfBirth).toISOString().split("T")[0],
    nidNumber: dbData.nidNumber,
    address: dbData.address,
    emergencyContact: dbData.emergencyContact,
    trade: dbData.trade,
    currentStage: dbData.currentStage,
    isArchived: dbData.isArchived,
    archivedAt: dbData.archivedAt ? new Date(dbData.archivedAt).toISOString() : null,
    agentId: dbData.agentId,
    jobOrderId: dbData.jobOrderId,
    userId: dbData.userId,
    documents: (dbData.documents || []).map((doc) => ({
      id: doc.id,
      documentType: doc.documentType as MockDocument["documentType"],
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      status: doc.status as MockDocument["status"],
      expiryDate: doc.expiryDate ? new Date(doc.expiryDate).toISOString().split("T")[0] : undefined,
      verifiedBy: doc.verifiedById ? (locale === "bn" ? "অডিটর দ্বারা অডিটেড" : "Staff Auditor") : undefined,
    })),
  };

  const documents: MockDocument[] = applicant.documents;

  const invoices: MockInvoice[] = (dbData.invoices || []).map((inv) => ({
    id: inv.id,
    invoiceNo: inv.invoiceNo,
    applicantId: inv.applicantId,
    amount: Number(inv.amount),
    outstanding: Number(inv.outstanding),
    dueDate: new Date(inv.dueDate).toISOString().split("T")[0],
    description: inv.description,
    createdAt: new Date(inv.createdAt).toISOString().split("T")[0],
  }));

  const receipts: MockReceipt[] = (dbData.receipts || []).map((rec) => ({
    id: rec.id,
    receiptNo: rec.receiptNo,
    applicantId: rec.applicantId,
    invoiceId: rec.invoiceId,
    amountPaid: Number(rec.amountPaid),
    paymentMethod: rec.paymentMethod as MockReceipt["paymentMethod"],
    referenceNo: rec.referenceNo,
    receivedBy: locale === "bn" ? "অ্যাকাউন্টস অফিসার" : "Accounts Officer",
    createdAt: new Date(rec.createdAt).toISOString(),
  }));

  const ledgers: MockLedgerEntry[] = (dbData.ledgerEntries || []).map((entry) => {
    // Map dynamic double entry reference id back to real invoice/receipt numbers
    const referenceNo =
      invoices.find((i) => i.id === entry.referenceId)?.invoiceNo ||
      receipts.find((r) => r.id === entry.referenceId)?.receiptNo ||
      entry.referenceId;

    return {
      id: entry.id,
      applicantId: entry.applicantId,
      transactionType: entry.transactionType as MockLedgerEntry["transactionType"],
      referenceNo,
      debit: Number(entry.debit),
      credit: Number(entry.credit),
      runningBalance: Number(entry.runningBalance),
      timestamp: new Date(entry.timestamp).toISOString(),
    };
  });

  const outstandingBalance = invoices.reduce((acc, inv) => acc + inv.outstanding, 0);
  const invoice = invoices[0]; // Primary billing record passed to ReceiptPreview helper

  // --- Safe-Freeze Handlers for LIVE READ-ONLY MODE ---

  const handleVerifyDocument = async (docId: string, status: "VERIFIED" | "REJECTED", remarks?: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status, remarks }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Verification action failed. HTTP ${res.status}`);
      }

      await loadData();
    } catch (err: any) {
      toast.error((locale === "bn" ? "যাচাইকরণ ত্রুটি: " : "Verification Error: ") + err.message);
    }
  };

  const handleUploadDocument = async (docType: string, file: File, expiryDate?: string, remarks?: string) => {
    if (!accessToken) return;
    const formData = new FormData();
    formData.append("applicantId", id);
    formData.append("documentType", docType);
    formData.append("file", file);
    if (expiryDate) formData.append("expiryDate", expiryDate);
    if (remarks) formData.append("remarks", remarks);

    const res = await fetch("/api/documents/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Upload failed. HTTP ${res.status}`);
    }

    await loadData();
  };

  const handleDownloadDocument = async (docId: string, fileName: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`/api/documents/${docId}/download`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to download file. HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      toast.error((locale === "bn" ? "ডাউনলোড ত্রুটি: " : "Download Error: ") + err.message);
    }
  };

  const handleRecordPayment = async (amount: number, method: string, ref: string, invoiceId: string) => {
    if (!accessToken) return;
    try {
      setRecordingReceipt(true);

      const res = await fetch(`/api/applicants/${id}/receipts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          invoiceId,
          amountPaid: amount,
          paymentMethod: method,
          referenceNo: ref,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to record payment receipt. HTTP ${res.status}`);
      }

      const { receipt, applicant: updatedData } = await res.json();
      setDbData(updatedData);
      toast.success(t("applicantDetail.receiptSuccess"));

      if (receipt) {
        const mappedReceipt: MockReceipt = {
          id: receipt.id,
          receiptNo: receipt.receiptNo,
          applicantId: receipt.applicantId,
          invoiceId: receipt.invoiceId,
          amountPaid: Number(receipt.amountPaid),
          paymentMethod: receipt.paymentMethod as MockReceipt["paymentMethod"],
          referenceNo: receipt.referenceNo,
          receivedBy: locale === "bn" ? "অ্যাকাউন্টস অফিসার" : "Accounts Officer",
          createdAt: new Date(receipt.createdAt).toISOString(),
        };
        setSelectedReceipt(mappedReceipt);
      }
    } catch (err: any) {
      toast.error(err.message || (locale === "bn" ? "পেমেন্ট রেকর্ড করার সময় ত্রুটি ঘটেছে।" : "An error occurred during payment recording."));
    } finally {
      setRecordingReceipt(false);
    }
  };

  const handleRecordInvoice = async (amount: number, desc: string, dueDate: string) => {
    if (!accessToken) return;
    try {
      setInvoicing(true);

      const res = await fetch(`/api/applicants/${id}/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          amount,
          dueDate,
          description: desc,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to issue invoice. HTTP ${res.status}`);
      }

      const updatedData = await res.json();
      setDbData(updatedData);
      toast.success(t("applicantDetail.invoiceSuccess"));
    } catch (err: any) {
      toast.error(err.message || (locale === "bn" ? "ইনভয়েস তৈরি করার সময় ত্রুটি ঘটেছে।" : "An error occurred during invoice creation."));
    } finally {
      setInvoicing(false);
    }
  };

  const handleWorkflowTransition = async (newStage: WorkflowStage, notes: string) => {
    if (!accessToken) return;
    try {
      setTransitioning(true);

      const res = await fetch(`/api/applicants/${id}/workflows`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nextStage: newStage,
          remarks: notes,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to transition stage. HTTP ${res.status}`);
      }

      const updatedData = await res.json();
      setDbData(updatedData);
      toast.success(locale === "bn" ? "আবেদনকারীর প্রক্রিয়ার ধাপ সফলভাবে আপডেট করা হয়েছে!" : "Candidate workflow stage successfully updated!");
    } catch (err: any) {
      toast.error(err.message || (locale === "bn" ? "ধাপ পরিবর্তনের সময় ত্রুটি ঘটেছে।" : "An error occurred during stage transition."));
    } finally {
      setTransitioning(false);
    }
  };

  const handleSoftArchive = async (action: "ARCHIVE" | "RESTORE") => {
    if (!accessToken) return;

    const isArchive = action === "ARCHIVE";
    const reason = await prompt({
      title: isArchive
        ? locale === "bn"
          ? "আবেদনকারী ফাইল আর্কাইভ করুন"
          : "Soft Archive Candidate Dossier"
        : locale === "bn"
        ? "আবেদনকারী ফাইল পুনরুদ্ধার করুন"
        : "Recover Candidate Dossier",
      description: isArchive 
        ? locale === "bn"
          ? "আর্কাইভ করার কারণ উল্লেখ করুন (কমপক্ষে ৫ অক্ষর)। কোনো রেকর্ড মুছে ফেলা হবে না।"
          : "Please specify the reason for archiving (minimum 5 characters). No records will be deleted."
        : locale === "bn"
        ? "ফাইলটি পুনরুদ্ধার করার কারণ উল্লেখ করুন (ঐচ্ছিক)।"
        : "Please specify the reason for restoring the candidate file (optional).",
      placeholder: isArchive
        ? locale === "bn"
          ? "উদা: ডুপ্লিকেট ফাইল, প্রার্থী নিজে প্রত্যাহার করেছেন, অন্য প্রোগ্রামে চলে গেছেন..."
          : "e.g. Duplicate dossier, candidate withdrew, emigrated under different program..."
        : locale === "bn"
        ? "পুনরুদ্ধার করার কারণ লিখুন (ঐচ্ছিক)..."
        : "Specify the restore reasons (optional)...",
      confirmLabel: isArchive
        ? locale === "bn"
          ? "আর্কাইভ করুন"
          : "Archive Dossier"
        : locale === "bn"
        ? "পুনরুদ্ধার করুন"
        : "Recover Dossier",
      cancelLabel: t("common.cancel"),
      isDanger: isArchive,
    });

    if (reason === null) return; // Cancelled
    if (isArchive && reason.trim().length < 5) {
      toast.error(locale === "bn" ? "অনুগ্রহ করে কমপক্ষে ৫ অক্ষরের একটি আর্কাইভ ব্যাখ্যা প্রদান করুন।" : "Please provide an archive explanation containing at least 5 characters.");
      return;
    }

    try {
      const res = await fetch(`/api/applicants/${id}/archive`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action,
          reason: reason.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP error ${res.status}`);
      }

      const updatedData = await res.json();
      setDbData(updatedData);
      toast.success(isArchive ? t("applicantDetail.archiveSuccess") : t("applicantDetail.restoreSuccess"));
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred during status mutation.");
    }
  };

  return (
    <div className="space-y-5">
      {/* ---------------- Record header ---------------- */}
      <div className="space-y-3">
        <nav aria-label="Breadcrumb" className="text-[11px] text-text-soft">
          <button
            type="button"
            onClick={() => router.push("/applicants")}
            className="inline-flex items-center gap-1 transition-colors hover:text-primary-theme cursor-pointer"
          >
            <ArrowLeft className="h-3 w-3" />
            {t("applicantDetail.backBtn")}
          </button>
        </nav>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-sm font-semibold uppercase text-primary-theme">
              {applicant.fullName ? applicant.fullName.substring(0, 2) : "CA"}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-semibold tracking-tight text-text-theme sm:text-2xl">
                  {applicant.fullName}
                </h1>
                <StatusBadge status={applicant.currentStage} />
                {applicant.isArchived && (
                  <AppBadge variant="neutral" dot>
                    {locale === "bn" ? "আর্কাইভড" : "Archived"}
                  </AppBadge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-text-soft">
                <span className="font-mono">{applicant.passportNumber}</span>
                <span className="mx-1.5">·</span>
                {applicant.trade}
              </p>
            </div>
          </div>

          {canArchive && (
            <div className="flex shrink-0 items-center gap-2">
              {applicant.isArchived ? (
                <AppButton
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSoftArchive("RESTORE")}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t("applicantDetail.restoreCandidate")}
                </AppButton>
              ) : (
                <AppButton
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSoftArchive("ARCHIVE")}
                >
                  <Archive className="h-3.5 w-3.5" />
                  {t("applicantDetail.softArchiveCandidate")}
                </AppButton>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ---------------- Key facts at a glance ---------------- */}
      <SummaryStrip
        items={[
          {
            label: locale === "bn" ? "বর্তমান ধাপ" : "Current Stage",
            value: <StatusBadge status={applicant.currentStage} />,
          },
          {
            label: locale === "bn" ? "জব অর্ডার" : "Job Order",
            value: dbData.jobOrder?.orderNumber || (locale === "bn" ? "নির্ধারিত নয়" : "Unassigned"),
          },
          {
            label: locale === "bn" ? "গন্তব্য" : "Destination",
            value: dbData.jobOrder?.country || "—",
          },
          {
            label: locale === "bn" ? "এজেন্ট" : "Agent",
            value: dbData.agent?.companyName || (locale === "bn" ? "সরাসরি" : "Direct"),
          },
          {
            label: locale === "bn" ? "বকেয়া" : "Outstanding",
            value: formatCurrency(outstandingBalance, "BDT", locale),
            tone: outstandingBalance > 0 ? "danger" : "success",
          },
        ]}
      />

      {/* ---------------- Tabbed dossier ---------------- */}
      <Tabs
        tabs={[
          { id: "bio", label: t("applicantDetail.tabBioData"), icon: User },
          {
            id: "workflow",
            label: locale === "bn" ? "ওয়ার্কফ্লো" : "Workflow",
            icon: GitBranch,
          },
          {
            id: "compliance",
            label: t("applicantDetail.tabCompliance"),
            icon: FileText,
            count: documents.length,
          },
          {
            id: "financial",
            label: t("applicantDetail.tabLedger"),
            icon: CreditCard,
            count: ledgers.length,
          },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as typeof activeTab)}
      />

      <div>
        {activeTab === "bio" && (
          <div className="space-y-5">
            <ApplicantProfileCard applicant={applicant} />
            <PortalAccessPanel
              applicant={applicant}
              accessToken={accessToken}
              userRole={user ? user.roleName : null}
              onRefresh={loadData}
            />
          </div>
        )}

        {activeTab === "workflow" && (
          <WorkflowStepper
            currentStage={applicant.currentStage}
            onTransition={handleWorkflowTransition}
          />
        )}

        {activeTab === "compliance" && (
          <DocumentChecklist
            documents={documents}
            onUpload={handleUploadDocument}
            onVerify={handleVerifyDocument}
            onDownload={handleDownloadDocument}
          />
        )}

        {activeTab === "financial" && (
          <LedgerTable
            entries={ledgers}
            outstandingBalance={outstandingBalance}
            onRecordPayment={handleRecordPayment}
            onRecordInvoice={handleRecordInvoice}
            invoices={invoices}
            applicantName={applicant.fullName}
            passportNumber={applicant.passportNumber}
            trade={applicant.trade}
            applicantId={applicant.id}
          />
        )}
      </div>

      {/* Receipt preview modal */}
      {selectedReceipt && (
        <ReceiptPreview
          receipt={selectedReceipt}
          applicant={applicant}
          invoice={invoices.find((i) => i.id === selectedReceipt.invoiceId)}
          onClose={() => setSelectedReceipt(undefined)}
        />
      )}

      {/*
        Non-blocking progress toast for finance writes. Replaces the previous
        full-screen overlays — the ledger post is quick and the user should not
        lose sight of the record while it completes.
      */}
      {(invoicing || recordingReceipt) && (
        <div
          role="status"
          aria-live="polite"
          className="app-dialog-enter fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-md border border-border-theme bg-surface-elevated px-4 py-3 shadow-md"
        >
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary-theme" />
          <p className="text-xs font-medium text-text-theme">
            {invoicing
              ? locale === "bn"
                ? "ইনভয়েস পোস্ট করা হচ্ছে..."
                : "Posting invoice..."
              : locale === "bn"
                ? "রসিদ রেকর্ড করা হচ্ছে..."
                : "Recording receipt..."}
          </p>
        </div>
      )}
    </div>
  );
}
