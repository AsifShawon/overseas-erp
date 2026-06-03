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
import { useT } from "@/i18n/useT";
import { formatNumber } from "@/i18n/format";
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
  ShieldAlert,
  ArrowLeft,
  Archive,
  RotateCcw,
  Sparkles,
  Globe2,
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
  const [activeTab, setActiveTab] = useState<"bio" | "compliance" | "financial">("bio");
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

  // Auth/fetch Loading Screen
  if (authLoading || fetching) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="relative flex flex-col items-center max-w-sm text-center space-y-6 animate-in fade-in duration-300">
          <div className="relative flex items-center justify-center h-16 w-16 rounded-2xl bg-white dark:bg-slate-950 shadow-xl border border-slate-100 dark:border-slate-800">
            <Globe2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <div className="absolute inset-0 rounded-2xl border-2 border-indigo-500/20 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {locale === "bn" ? "আবেদনকারী ফাইল লোড হচ্ছে..." : "Loading Candidate Dossier..."}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
              {locale === "bn"
                ? "ডাটাবেস থেকে আবেদনকারীর প্রয়োজনীয় বায়োডাটা এবং লেনদেনের হিসাব খাতা লোড করা হচ্ছে।"
                : "Fetching verified biographical details and transactional history ledger from PostgreSQL database."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle Unauthorized Session Error
  if (statusCode === 401) {
    return (
      <div className="text-center py-16 space-y-4 animate-in fade-in duration-300">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {locale === "bn" ? "সেশন শেষ হয়েছে" : "Session Expired"}
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {locale === "bn"
            ? "আপনার নিরাপত্তা সেশন শেষ হয়ে গেছে। অনুগ্রহ করে আবার সিস্টেমে লগইন করুন।"
            : "Your authentication session has expired. Please sign in again."}
        </p>
        <button
          onClick={() => router.push("/login")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm cursor-pointer"
        >
          {locale === "bn" ? "লগইন এ যান" : "Go to Login"}
        </button>
      </div>
    );
  }

  // Handle Cohort-Scoped Access Denied
  if (statusCode === 403) {
    return (
      <div className="text-center py-16 space-y-4 animate-in fade-in duration-300">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {t("common.accessDenied")}
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {locale === "bn"
            ? "আপনার এই আবেদনকারীর ফাইল দেখার কোনো অনুমতি নেই।"
            : "You do not have the required permissions to view this candidate dossier or it is restricted by sourcing boundaries."}
        </p>
        <button
          onClick={() => router.push("/applicants")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> {t("applicantDetail.backBtn")}
        </button>
      </div>
    );
  }

  // Handle Dossier Not Found
  if (statusCode === 404 || !dbData) {
    return (
      <div className="text-center py-16 space-y-4 animate-in fade-in duration-300">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {locale === "bn" ? "আবেদনকারী ফাইল পাওয়া যায়নি" : "Candidate File Not Found"}
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {locale === "bn"
            ? "অনুরোধ করা আবেদনকারী ফাইলটি খুঁজে পাওয়া যায়নি বা এটি স্থায়ীভাবে ডিলিট করা হয়েছে।"
            : "The requested applicant file ID is either restricted by sourcing boundaries or has been permanently archived."}
        </p>
        <button
          onClick={() => router.push("/applicants")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> {t("applicantDetail.backBtn")}
        </button>
      </div>
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
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
        <div className="space-y-1">
          <button
            onClick={() => router.push("/applicants")}
            className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {t("applicantDetail.backBtn")}
          </button>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {applicant.fullName}
            </h1>
            <span className="font-mono text-xs bg-slate-100 text-slate-500 border px-2 py-0.5 rounded dark:bg-slate-800 dark:border-slate-700">
              ID: {applicant.id}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            {locale === "bn" ? "নিযুক্ত ট্রেড সেগমেন্ট: " : "Placement Trade Segment: "}<span className="font-bold text-slate-600 dark:text-slate-300">{applicant.trade}</span>
          </p>
        </div>

        {/* Soft Archive Controls */}
        {canArchive && (
          <div className="flex items-center gap-2">
            {applicant.isArchived ? (
              <button
                onClick={() => handleSoftArchive("RESTORE")}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20 transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" /> {t("applicantDetail.restoreCandidate")}
              </button>
            ) : (
              <button
                onClick={() => handleSoftArchive("ARCHIVE")}
                className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/20 transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer"
              >
                <Archive className="h-4 w-4" /> {t("applicantDetail.softArchiveCandidate")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Workflow Stepper Card */}
      <WorkflowStepper currentStage={applicant.currentStage} onTransition={handleWorkflowTransition} />

      {/* Workspace Tabs Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Tab Navigation Panels */}
        <div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            {locale === "bn" ? "আবেদনকারী ফাইলের বিভাগসমূহ" : "Candidate Dossier Sections"}
          </h3>
          <button
            onClick={() => setActiveTab("bio")}
            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "bio"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-900"
            }`}
          >
            <User className="h-4 w-4" /> {t("applicantDetail.tabBioData")}
          </button>
          <button
            onClick={() => setActiveTab("compliance")}
            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "compliance"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-900"
            }`}
          >
            <FileText className="h-4 w-4" /> {t("applicantDetail.tabCompliance")}
          </button>
          <button
            onClick={() => setActiveTab("financial")}
            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "financial"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-900"
            }`}
          >
            <CreditCard className="h-4 w-4" /> {t("applicantDetail.tabLedger")}
          </button>

          {/* Interactive Warning Banner */}
          <div className="mt-8 rounded-lg bg-indigo-50/50 p-3.5 border border-indigo-100/50 dark:bg-indigo-950/10 dark:border-indigo-900/10">
            <div className="flex gap-1.5 items-center text-[10px] text-indigo-800 dark:text-indigo-400 font-bold mb-1">
              <Sparkles className="h-3.5 w-3.5 shrink-0 animate-pulse" /> {locale === "bn" ? "সরাসরি সিস্টেম সংযোগ" : "LIVE POSTGRESQL LINK"}
            </div>
            <p className="text-[9px] text-indigo-700/80 leading-normal dark:text-indigo-400/80">
              {locale === "bn"
                ? "আবেদনকারীর সব ফাইল এবং লেনদেন সরাসরি ডাটাবেসে রিয়েল-টাইমে আপডেট হচ্ছে।"
                : "Applicant records, files and accounting transactions are updated live in the PostgreSQL database."}
            </p>
          </div>
        </div>

        {/* Tab View Container */}
        <div className="lg:col-span-3">
          {activeTab === "bio" && (
            <div className="space-y-6">
              <ApplicantProfileCard applicant={applicant} />
              <PortalAccessPanel
                applicant={applicant}
                accessToken={accessToken}
                userRole={user ? user.roleName : null}
                onRefresh={loadData}
              />
            </div>
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
            />
          )}
        </div>
      </div>

      {/* Elegant Receipt Printer Modal Modal Popup */}
      {selectedReceipt && (
        <ReceiptPreview
          receipt={selectedReceipt}
          applicant={applicant}
          invoice={invoices.find((i) => i.id === selectedReceipt.invoiceId)}
          onClose={() => setSelectedReceipt(undefined)}
        />
      )}

      {/* Glassmorphic Read-Only Warning Alert Modal */}
      {readOnlyAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-indigo-100 bg-white p-6 shadow-xl dark:border-indigo-900/30 dark:bg-slate-950 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-5 w-5 animate-pulse shrink-0" />
              <h3 className="text-sm font-bold uppercase tracking-wider">{locale === "bn" ? "সিস্টেম সংযোগ নোটিশ" : "SYSTEM CONNECTION NOTICE"}</h3>
            </div>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {locale === "bn"
                ? `অ্যাকশন "${readOnlyAlert.action}" সফলভাবে সম্পন্ন হয়েছে।`
                : `The action "${readOnlyAlert.action}" has been successfully verified.`}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setReadOnlyAlert(null)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 hover:shadow-indigo-600/30 cursor-pointer"
              >
                {locale === "bn" ? "নিশ্চিত করুন" : "Acknowledge"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Glassmorphic Invoicing Loading Overlay */}
      {invoicing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-xl border border-slate-100 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950 animate-in zoom-in-95 duration-200 text-center space-y-4">
            <div className="relative flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-slate-900 mx-auto">
              <Globe2 className="h-6 w-6 text-indigo-500 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {locale === "bn" ? "ইনভয়েস প্রসেস করা হচ্ছে..." : "Processing Invoice Posting..."}
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                {locale === "bn"
                  ? "হিসাব খাতার ডাবল-এন্ট্রি এবং বকেয়া ব্যালেন্স সফলভাবে ডাটাবেসে পোস্টিং হচ্ছে।"
                  : "Writing double-entry ledger entries and updating outstanding balances securely."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Glassmorphic Receipt Loading Overlay */}
      {recordingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-xl border border-slate-100 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950 animate-in zoom-in-95 duration-200 text-center space-y-4">
            <div className="relative flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-slate-900 mx-auto">
              <Globe2 className="h-6 w-6 text-indigo-500 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {locale === "bn" ? "রসিদ রেকর্ড করা হচ্ছে..." : "Recording Payment Receipt..."}
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                {locale === "bn"
                  ? "ক্রেডিট খাতা এন্ট্রি পোস্টিং এবং ইনভয়েস ব্যালেন্স সমন্বয় করা হচ্ছে।"
                  : "Writing double-entry credit ledger entries and decrementing invoice dues securely."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
