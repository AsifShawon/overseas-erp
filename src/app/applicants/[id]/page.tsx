"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMockAuth } from "@/context/MockAuthContext";
import { useToast } from "@/context/ToastContext";
import { ApplicantProfileCard } from "@/components/shared/ApplicantProfileCard";
import { PortalAccessPanel } from "@/components/shared/PortalAccessPanel";
import { DocumentChecklist } from "@/components/shared/DocumentChecklist";
import { LedgerTable } from "@/components/shared/LedgerTable";
import { WorkflowStepper } from "@/components/shared/WorkflowStepper";
import { ReceiptPreview } from "@/components/shared/ReceiptPreview";
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
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [transitionSuccess, setTransitionSuccess] = useState<boolean>(false);

  // Invoicing states
  const [invoicing, setInvoicing] = useState<boolean>(false);
  const [invoicingError, setInvoicingError] = useState<string | null>(null);
  const [invoicingSuccess, setInvoicingSuccess] = useState<boolean>(false);

  // Receipt states
  const [recordingReceipt, setRecordingReceipt] = useState<boolean>(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [receiptSuccess, setReceiptSuccess] = useState<boolean>(false);

  // Archiving/Restoring states
  const [archiveModalOpen, setArchiveModalOpen] = useState<boolean>(false);
  const [archiveReason, setArchiveReason] = useState<string>("");
  const [archiveAction, setArchiveAction] = useState<"ARCHIVE" | "RESTORE">("ARCHIVE");
  const [isMutatingArchive, setIsMutatingArchive] = useState<boolean>(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [archiveSuccess, setArchiveSuccess] = useState<boolean>(false);

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
              Loading Candidate Dossier...
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
              Fetching verified biographical details and transactional history ledger from PostgreSQL database.
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
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Session Expired</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Your authentication session has expired. Please sign in again.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm"
        >
          Go to Login
        </button>
      </div>
    );
  }

  // Handle Cohort-Scoped Access Denied
  if (statusCode === 403) {
    return (
      <div className="text-center py-16 space-y-4 animate-in fade-in duration-300">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Access Denied</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          You do not have the required permissions to view this candidate dossier or it is restricted by sourcing boundaries.
        </p>
        <button
          onClick={() => router.push("/applicants")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Directory
        </button>
      </div>
    );
  }

  // Handle Dossier Not Found
  if (statusCode === 404 || !dbData) {
    return (
      <div className="text-center py-16 space-y-4 animate-in fade-in duration-300">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Candidate File Not Found</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          The requested applicant file ID is either restricted by sourcing boundaries or has been permanently archived.
        </p>
        <button
          onClick={() => router.push("/applicants")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Directory
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
      verifiedBy: doc.verifiedById ? "Staff Auditor" : undefined,
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
    receivedBy: "Accounts Officer",
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
      const res = await fetch(`/api/applicants/${id}/documents/${docId}`, {
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

      const updatedData = await res.json();
      setDbData(updatedData);
    } catch (err: any) {
      toast.error("Verification Error: " + err.message);
    }
  };

  const handleUploadDocument = async (docType: string, file: File, expiryDate?: string, remarks?: string) => {
    if (!accessToken) return;
    const formData = new FormData();
    formData.append("documentType", docType);
    formData.append("file", file);
    if (expiryDate) formData.append("expiryDate", expiryDate);
    if (remarks) formData.append("remarks", remarks);

    const res = await fetch(`/api/applicants/${id}/documents`, {
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

    const updatedData = await res.json();
    setDbData(updatedData);
  };

  const handleDownloadDocument = async (docId: string, fileName: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`/api/applicants/${id}/documents/${docId}/download`, {
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
      toast.error("Download Error: " + err.message);
    }
  };

  const handleRecordPayment = async (amount: number, method: string, ref: string, invoiceId: string) => {
    if (!accessToken) return;
    try {
      setRecordingReceipt(true);
      setReceiptError(null);
      setReceiptSuccess(false);

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
      setReceiptSuccess(true);

      if (receipt) {
        const mappedReceipt: MockReceipt = {
          id: receipt.id,
          receiptNo: receipt.receiptNo,
          applicantId: receipt.applicantId,
          invoiceId: receipt.invoiceId,
          amountPaid: Number(receipt.amountPaid),
          paymentMethod: receipt.paymentMethod as MockReceipt["paymentMethod"],
          referenceNo: receipt.referenceNo,
          receivedBy: "Accounts Officer",
          createdAt: new Date(receipt.createdAt).toISOString(),
        };
        setSelectedReceipt(mappedReceipt);
      }
    } catch (err: any) {
      setReceiptError(err.message || "An error occurred during payment recording.");
    } finally {
      setRecordingReceipt(false);
    }
  };

  const handleRecordInvoice = async (amount: number, desc: string, dueDate: string) => {
    if (!accessToken) return;
    try {
      setInvoicing(true);
      setInvoicingError(null);
      setInvoicingSuccess(false);

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
      setInvoicingSuccess(true);
    } catch (err: any) {
      setInvoicingError(err.message || "An error occurred during invoice creation.");
    } finally {
      setInvoicing(false);
    }
  };

  const handleWorkflowTransition = async (newStage: WorkflowStage, notes: string) => {
    if (!accessToken) return;
    try {
      setTransitioning(true);
      setTransitionError(null);
      setTransitionSuccess(false);

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
      setTransitionSuccess(true);
    } catch (err: any) {
      setTransitionError(err.message || "An error occurred during stage transition.");
    } finally {
      setTransitioning(false);
    }
  };

  const handleSoftArchiveSubmit = async () => {
    if (!accessToken) return;
    if (archiveAction === "ARCHIVE" && archiveReason.trim().length < 5) {
      setArchiveError("Please provide an archive explanation containing at least 5 characters.");
      return;
    }
    
    try {
      setIsMutatingArchive(true);
      setArchiveError(null);
      
      const res = await fetch(`/api/applicants/${id}/archive`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action: archiveAction,
          reason: archiveReason,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP error ${res.status}`);
      }

      const updatedData = await res.json();
      setDbData(updatedData);
      setArchiveModalOpen(false);
      setArchiveSuccess(true);
    } catch (err: any) {
      setArchiveError(err.message || "An unexpected error occurred.");
    } finally {
      setIsMutatingArchive(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
        <div className="space-y-1">
          <button
            onClick={() => router.push("/applicants")}
            className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-wider"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Applicants Directory
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
            Placement Trade Segment: <span className="font-bold text-slate-600 dark:text-slate-300">{applicant.trade}</span>
          </p>
        </div>

        {/* Soft Archive Controls */}
        {canArchive && (
          <div className="flex items-center gap-2">
            {applicant.isArchived ? (
              <button
                onClick={() => {
                  setArchiveAction("RESTORE");
                  setArchiveReason("");
                  setArchiveError(null);
                  setArchiveModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20 transition-all hover:scale-105 active:scale-95 duration-200"
              >
                <RotateCcw className="h-4 w-4" /> Emigration Recovery
              </button>
            ) : (
              <button
                onClick={() => {
                  setArchiveAction("ARCHIVE");
                  setArchiveReason("");
                  setArchiveError(null);
                  setArchiveModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/20 transition-all hover:scale-105 active:scale-95 duration-200"
              >
                <Archive className="h-4 w-4" /> Soft Archive Candidate
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
            Candidate Dossier Sections
          </h3>
          <button
            onClick={() => setActiveTab("bio")}
            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition-all ${
              activeTab === "bio"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-900"
            }`}
          >
            <User className="h-4 w-4" /> Bio-Data & Demographics
          </button>
          <button
            onClick={() => setActiveTab("compliance")}
            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition-all ${
              activeTab === "compliance"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-900"
            }`}
          >
            <FileText className="h-4 w-4" /> Compliance Checklist
          </button>
          <button
            onClick={() => setActiveTab("financial")}
            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition-all ${
              activeTab === "financial"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-900"
            }`}
          >
            <CreditCard className="h-4 w-4" /> Ledger & Accounts
          </button>

          {/* Interactive Warning Banner */}
          <div className="mt-8 rounded-lg bg-indigo-50/50 p-3.5 border border-indigo-100/50 dark:bg-indigo-950/10 dark:border-indigo-900/10">
            <div className="flex gap-1.5 items-center text-[10px] text-indigo-800 dark:text-indigo-400 font-bold mb-1">
              <Sparkles className="h-3.5 w-3.5 shrink-0 animate-pulse" /> LIVE READ-ONLY MODE
            </div>
            <p className="text-[9px] text-indigo-700/80 leading-normal dark:text-indigo-400/80">
              Applicant data is now loaded from PostgreSQL. Mutations will be enabled in the next phases.
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
              <h3 className="text-sm font-bold uppercase tracking-wider">LIVE READ-ONLY MODE</h3>
            </div>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              The action <span className="font-bold text-slate-800 dark:text-white">"{readOnlyAlert.action}"</span> is deactivated in this phase.
            </p>
            <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
              Applicant data is now loaded live from PostgreSQL. Mutations (workflow transitions, document uploads, payment entries, invoices, and archiving) will be enabled in upcoming Phase 4 developments.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setReadOnlyAlert(null)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 hover:shadow-indigo-600/30"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Glassmorphic Transition Success Alert Modal */}
      {transitionSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-emerald-100 bg-white p-6 shadow-xl dark:border-emerald-900/30 dark:bg-slate-950 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-5 w-5 animate-pulse shrink-0" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Transition Successful</h3>
            </div>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Candidate workflow stage successfully updated and audit history, log tracks, and system alerts generated.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setTransitionSuccess(false)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 hover:shadow-emerald-600/30"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Glassmorphic Transition Error Alert Modal */}
      {transitionError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-rose-100 bg-white p-6 shadow-xl dark:border-rose-900/30 dark:bg-slate-950 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Transition Denied</h3>
            </div>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {transitionError}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setTransitionError(null)}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700 shadow-sm shadow-rose-600/20 hover:shadow-rose-600/30"
              >
                Dismiss
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
                Processing Invoice Posting...
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Writing double-entry ledger entries and updating outstanding balances securely.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Glassmorphic Invoicing Success Alert Modal */}
      {invoicingSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-emerald-100 bg-white p-6 shadow-xl dark:border-emerald-900/30 dark:bg-slate-950 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-5 w-5 animate-pulse shrink-0" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Invoice Issued</h3>
            </div>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Service invoice successfully generated. The transaction has been posted as a debit entry in the applicant's ledger.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setInvoicingSuccess(false)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 hover:shadow-emerald-600/30"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Glassmorphic Invoicing Error Alert Modal */}
      {invoicingError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-rose-100 bg-white p-6 shadow-xl dark:border-rose-900/30 dark:bg-slate-950 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Invoice Failed</h3>
            </div>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {invoicingError}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setInvoicingError(null)}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700 shadow-sm shadow-rose-600/20 hover:shadow-rose-600/30"
              >
                Dismiss
              </button>
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
                Recording Payment Receipt...
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Writing double-entry credit ledger entries and decrementing invoice dues securely.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Glassmorphic Receipt Success Alert Modal */}
      {receiptSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-emerald-100 bg-white p-6 shadow-xl dark:border-emerald-900/30 dark:bg-slate-950 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-5 w-5 animate-pulse shrink-0" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Payment Recorded</h3>
            </div>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Candidate payment receipt successfully processed. The transaction has been posted as a credit entry in the candidate's statement.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setReceiptSuccess(false)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 hover:shadow-emerald-600/30"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Glassmorphic Receipt Error Alert Modal */}
      {receiptError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-rose-100 bg-white p-6 shadow-xl dark:border-rose-900/30 dark:bg-slate-950 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Receipt Failed</h3>
            </div>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {receiptError}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setReceiptError(null)}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700 shadow-sm shadow-rose-600/20 hover:shadow-rose-600/30"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Soft Archive / Restore Modal */}
      {archiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${
                archiveAction === "ARCHIVE" 
                  ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400"
                  : "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400"
              }`}>
                {archiveAction === "ARCHIVE" ? <Archive className="h-5 w-5" /> : <RotateCcw className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {archiveAction === "ARCHIVE" ? "Soft Archive Candidate Dossier" : "Recover Candidate Dossier"}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Change the active status of candidate file. No records will be deleted.
                </p>
              </div>
            </div>

            {archiveError && (
              <div className="mt-4 flex gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/10 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/20">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="font-medium">{archiveError}</span>
              </div>
            )}

            <div className="mt-4 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {archiveAction === "ARCHIVE" ? "Reason for Archiving (Required)" : "Reason for Restoring (Optional)"}
              </label>
              <textarea
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                placeholder={
                  archiveAction === "ARCHIVE"
                    ? "Specify the reasons (e.g. Duplicate dossier, candidate withdrew, emigrated under different program...)"
                    : "Specify the restore reasons (optional)..."
                }
                rows={3}
                disabled={isMutatingArchive}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200 transition-all duration-200 placeholder:text-slate-400"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setArchiveModalOpen(false)}
                disabled={isMutatingArchive}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSoftArchiveSubmit}
                disabled={isMutatingArchive || (archiveAction === "ARCHIVE" && archiveReason.trim().length < 5)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-all duration-200 shadow-md ${
                  archiveAction === "ARCHIVE"
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 disabled:bg-rose-400 disabled:opacity-50"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 disabled:bg-emerald-400 disabled:opacity-50"
                }`}
              >
                {isMutatingArchive ? (
                  <>
                    <Globe2 className="h-3.5 w-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {archiveAction === "ARCHIVE" ? "Archive Dossier" : "Recover Dossier"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Soft Archive Success Modal */}
      {archiveSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-6 shadow-2xl dark:border-emerald-900/30 dark:bg-slate-950 animate-in zoom-in-95 duration-200 text-center space-y-4">
            <div className="relative flex items-center justify-center h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 mx-auto">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Dossier State Mutated
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                Candidate dossier has been successfully updated. Audit log histories and system alerts have been recorded successfully.
              </p>
            </div>
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setArchiveSuccess(false)}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

