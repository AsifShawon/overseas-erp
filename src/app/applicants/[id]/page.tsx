"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMockAuth } from "@/context/MockAuthContext";
import { ApplicantProfileCard } from "@/components/shared/ApplicantProfileCard";
import { DocumentChecklist } from "@/components/shared/DocumentChecklist";
import { LedgerTable } from "@/components/shared/LedgerTable";
import { WorkflowStepper } from "@/components/shared/WorkflowStepper";
import { ReceiptPreview } from "@/components/shared/ReceiptPreview";
import {
  MOCK_APPLICANTS,
  MOCK_INVOICES,
  MOCK_RECEIPTS,
  MOCK_LEDGERS,
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
} from "lucide-react";

export default function ApplicantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user } = useMockAuth();

  // Find base applicant record
  const baseApplicant = MOCK_APPLICANTS.find((a) => a.id === id);

  // Stateful applicant data for simulation
  const [prevId, setPrevId] = useState(id);
  const [applicant, setApplicant] = useState<MockApplicant | undefined>(baseApplicant);
  const [documents, setDocuments] = useState<MockDocument[]>(baseApplicant ? baseApplicant.documents : []);
  const [ledgers, setLedgers] = useState<MockLedgerEntry[]>(
    baseApplicant ? MOCK_LEDGERS.filter((l) => l.applicantId === baseApplicant.id) : []
  );
  const [invoice, setInvoice] = useState<MockInvoice | undefined>(
    baseApplicant ? MOCK_INVOICES.find((i) => i.applicantId === baseApplicant.id) : undefined
  );
  const [receipts, setReceipts] = useState<MockReceipt[]>(
    baseApplicant ? MOCK_RECEIPTS.filter((r) => r.applicantId === baseApplicant.id) : []
  );
  const [activeTab, setActiveTab] = useState<"bio" | "compliance" | "financial">("bio");
  const [selectedReceipt, setSelectedReceipt] = useState<MockReceipt | undefined>(undefined);

  // Adjust state synchronously if id or baseApplicant changes to satisfy react-hooks/set-state-in-effect and avoid double renders
  if (id !== prevId) {
    setPrevId(id);
    setApplicant(baseApplicant);
    setDocuments(baseApplicant ? baseApplicant.documents : []);
    setLedgers(baseApplicant ? MOCK_LEDGERS.filter((l) => l.applicantId === baseApplicant.id) : []);
    setInvoice(baseApplicant ? MOCK_INVOICES.find((i) => i.applicantId === baseApplicant.id) : undefined);
    setReceipts(baseApplicant ? MOCK_RECEIPTS.filter((r) => r.applicantId === baseApplicant.id) : []);
  }

  if (!applicant) {
    return (
      <div className="text-center py-16 space-y-4">
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

  // Scoped Data check: if Agent, can only view their own candidate
  const isAgent = user.roleName === "Agent";
  if (isAgent && applicant.agentId !== user.agentCode) {
    return (
      <div className="text-center py-16 space-y-4">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Access Denied (Cohort Scoped)</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Recruitment agents are strictly bound to applicants sourced under their license. Vetting other cohort groups is restricted.
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

  // --- Handlers for Simulator Actions ---

  // Verify / Reject Compliance Document
  const handleVerifyDocument = (docId: string, status: "VERIFIED" | "REJECTED") => {
    const updatedDocs = documents.map((doc) => {
      if (doc.id === docId) {
        return {
          ...doc,
          status,
          verifiedBy: status === "VERIFIED" ? user.fullName : undefined,
        };
      }
      return doc;
    });
    setDocuments(updatedDocs);
    setApplicant((prev) => prev ? { ...prev, documents: updatedDocs } : undefined);
  };

  // Upload Document Simulator
  const handleUploadDocument = (docType: string, fileName: string) => {
    const newDoc: MockDocument = {
      id: `doc-sim-${Date.now()}`,
      documentType: docType as MockDocument["documentType"],
      fileName,
      fileUrl: "#",
      status: "PENDING_VERIFICATION",
    };
    const updatedDocs = [...documents, newDoc];
    setDocuments(updatedDocs);
    setApplicant((prev) => prev ? { ...prev, documents: updatedDocs } : undefined);
  };

  // Record Cash / Bank Payment
  const handleRecordPayment = (amount: number, method: string, ref: string) => {
    const activeOutstanding = invoice ? invoice.outstanding : 0;
    const newOutstanding = Math.max(0, activeOutstanding - amount);
    
    // Update Invoice Dues
    if (invoice) {
      setInvoice({
        ...invoice,
        outstanding: newOutstanding,
      });
    }

    // Generate Double Entry Ledger Log
    const debitVal = ledgers.length > 0 ? ledgers[ledgers.length - 1].runningBalance : 0;
    const runningBal = Math.max(0, debitVal - amount);

    const newLedger: MockLedgerEntry = {
      id: `ldg-sim-${Date.now()}`,
      applicantId: applicant.id,
      transactionType: "RECEIPT",
      referenceNo: `REC-SIM-${Date.now().toString().substring(8)}`,
      debit: 0,
      credit: amount,
      runningBalance: runningBal,
      timestamp: new Date().toISOString(),
    };
    
    const newReceipt: MockReceipt = {
      id: `rec-sim-${Date.now()}`,
      receiptNo: newLedger.referenceNo,
      applicantId: applicant.id,
      invoiceId: invoice?.id || null,
      amountPaid: amount,
      paymentMethod: method as MockReceipt["paymentMethod"],
      referenceNo: ref,
      receivedBy: user.fullName,
      createdAt: new Date().toISOString(),
    };

    setLedgers([...ledgers, newLedger]);
    setReceipts([...receipts, newReceipt]);
    setSelectedReceipt(newReceipt); // Trigger print-receipt voucher popup instantly!
  };

  // Issue Custom Service Invoice
  const handleRecordInvoice = (amount: number, desc: string) => {
    const currentOutstanding = invoice ? invoice.outstanding : 0;
    const newOutstanding = currentOutstanding + amount;

    if (invoice) {
      setInvoice({
        ...invoice,
        amount: invoice.amount + amount,
        outstanding: newOutstanding,
        description: desc,
      });
    } else {
      const newInv: MockInvoice = {
        id: `inv-sim-${Date.now()}`,
        invoiceNo: `INV-SIM-${Date.now().toString().substring(8)}`,
        applicantId: applicant.id,
        amount: amount,
        outstanding: amount,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        description: desc,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setInvoice(newInv);
    }

    // Ledger Entry
    const lastBal = ledgers.length > 0 ? ledgers[ledgers.length - 1].runningBalance : 0;
    const newLedger: MockLedgerEntry = {
      id: `ldg-sim-${Date.now()}`,
      applicantId: applicant.id,
      transactionType: "INVOICE",
      referenceNo: `INV-SIM-${Date.now().toString().substring(8)}`,
      debit: amount,
      credit: 0,
      runningBalance: lastBal + amount,
      timestamp: new Date().toISOString(),
    };

    setLedgers([...ledgers, newLedger]);
  };

  // Workflow State Transition
  const handleWorkflowTransition = (newStage: WorkflowStage, _notes: string) => {
    const updated = {
      ...applicant,
      currentStage: newStage,
    };
    setApplicant(updated);
  };

  // Soft Archiving Audit Toggle
  const handleSoftArchive = () => {
    const archived = !applicant.isArchived;
    const updated = {
      ...applicant,
      isArchived: archived,
      archivedAt: archived ? new Date().toISOString() : null,
    };
    setApplicant(updated);
  };

  // Outstanding balance calculation
  const outstandingBalance = invoice ? invoice.outstanding : 0;

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

        {/* Soft Archive Controls (Super Admin & Ops only) */}
        {["Super Admin", "Operations Admin"].includes(user.roleName) && (
          <div className="flex items-center gap-2">
            {applicant.isArchived ? (
              <button
                onClick={handleSoftArchive}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20"
              >
                <RotateCcw className="h-4 w-4 animate-spin-slow" /> Emigration Emigration Recovery
              </button>
            ) : (
              <button
                onClick={handleSoftArchive}
                className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/20"
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
              <Sparkles className="h-3.5 w-3.5 shrink-0 animate-pulse" /> SIMULATOR ACTIVE
            </div>
            <p className="text-[9px] text-indigo-700/80 leading-normal dark:text-indigo-400/80">
              Any changes made inside documents, ledgers, or stepper transitions are saved in the client session state.
            </p>
          </div>
        </div>

        {/* Tab View Container */}
        <div className="lg:col-span-3">
          {activeTab === "bio" && <ApplicantProfileCard applicant={applicant} />}

          {activeTab === "compliance" && (
            <DocumentChecklist
              documents={documents}
              onUpload={handleUploadDocument}
              onVerify={handleVerifyDocument}
            />
          )}

          {activeTab === "financial" && (
            <LedgerTable
              entries={ledgers}
              outstandingBalance={outstandingBalance}
              onRecordPayment={handleRecordPayment}
              onRecordInvoice={handleRecordInvoice}
            />
          )}
        </div>
      </div>

      {/* Elegant Receipt Printer Modal Modal Popup */}
      {selectedReceipt && (
        <ReceiptPreview
          receipt={selectedReceipt}
          applicant={applicant}
          invoice={invoice}
          onClose={() => setSelectedReceipt(undefined)}
        />
      )}
    </div>
  );
}
