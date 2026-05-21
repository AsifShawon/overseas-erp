"use client";

import React, { useState } from "react";
import { useMockAuth } from "@/context/MockAuthContext";

import { WorkflowStepper } from "@/components/shared/WorkflowStepper";
import { DocumentChecklist } from "@/components/shared/DocumentChecklist";
import { LedgerTable } from "@/components/shared/LedgerTable";
import { ReceiptPreview } from "@/components/shared/ReceiptPreview";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  MOCK_APPLICANTS,
  MOCK_LEDGERS,
  MOCK_INVOICES,
  MOCK_RECEIPTS,
  MockApplicant,
  MockDocument,
  MockReceipt,
} from "@/lib/mockData";
import { User, ShieldCheck, Mail, Phone, Calendar, Printer, FileText } from "lucide-react";

export default function ApplicantPortalPage() {
  const { user } = useMockAuth();

  // Find applicant record matching this user session (default is app-1 / Mohammad Al-Amin)
  const baseApplicant = MOCK_APPLICANTS.find((a) => a.id === user.applicantId) || MOCK_APPLICANTS[0];

  const [prevApplicantId, setPrevApplicantId] = useState(baseApplicant.id);
  const [applicant, setApplicant] = useState<MockApplicant>(baseApplicant);
  const [documents, setDocuments] = useState<MockDocument[]>(baseApplicant.documents);
  const [selectedReceipt, setSelectedReceipt] = useState<MockReceipt | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"progress" | "documents" | "ledger">("progress");

  // Adjust state synchronously if baseApplicant changes (e.g. from dynamic role switches)
  if (baseApplicant.id !== prevApplicantId) {
    setPrevApplicantId(baseApplicant.id);
    setApplicant(baseApplicant);
    setDocuments(baseApplicant.documents);
  }

  // Derive stable list constants to satisfy react-hooks/set-state-in-effect and avoid double render loops
  const ledgers = MOCK_LEDGERS.filter((l) => l.applicantId === baseApplicant.id);
  const invoice = MOCK_INVOICES.find((i) => i.applicantId === baseApplicant.id);
  const receipts = MOCK_RECEIPTS.filter((r) => r.applicantId === baseApplicant.id);

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
    setApplicant((prev) => ({ ...prev, documents: updatedDocs }));
  };

  const outstandingBalance = invoice ? invoice.outstanding : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Dynamic Header Box */}
      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
              Hello, {applicant.fullName}
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Applied Placement: <span className="font-bold text-slate-600 dark:text-slate-300">{applicant.trade}</span> • Passport No: <span className="font-mono">{applicant.passportNumber}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] rounded bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 font-bold dark:bg-indigo-950 dark:border-indigo-900">
            Portal Access Claimed
          </span>
          <StatusBadge status={applicant.currentStage} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("progress")}
          className={`px-6 py-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === "progress"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          My Emigration Timeline
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className={`px-6 py-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === "documents"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          My Attestation Files ({documents.length})
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={`px-6 py-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === "ledger"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          My Accounts & Ledger
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === "progress" && (
          <div className="space-y-6">
            <WorkflowStepper currentStage={applicant.currentStage} />

            {/* Demographics Summary Card */}
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 dark:border-slate-800">
                My Placement Demographics
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2 text-xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Contact Information</p>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Phone className="h-3.5 w-3.5" /> <span>{applicant.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Mail className="h-3.5 w-3.5" /> <span>{applicant.email || "No Email"}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Identity & Travel Documents</p>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Calendar className="h-3.5 w-3.5" /> <span>DOB: {applicant.dateOfBirth}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <FileText className="h-3.5 w-3.5" /> <span>Passport Expiry: {applicant.passportExpiry}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Interactive Warning Status</p>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span>Emigration clearance files checked</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <DocumentChecklist documents={documents} onUpload={handleUploadDocument} />
        )}

        {activeTab === "ledger" && (
          <div className="space-y-6">
            <LedgerTable entries={ledgers} outstandingBalance={outstandingBalance} />

            {/* Quick print receipt section */}
            {receipts.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
                  My Official Print Vouchers
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {receipts.map((rec) => (
                    <div key={rec.id} className="rounded-lg bg-slate-50 p-4 border border-slate-100 flex items-center justify-between dark:bg-slate-900/50 dark:border-slate-800">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{rec.receiptNo}</p>
                        <p className="text-[10px] text-slate-400">Amount Paid: ${rec.amountPaid.toLocaleString()} • Date: {rec.createdAt}</p>
                      </div>
                      <button
                        onClick={() => setSelectedReceipt(rec)}
                        className="flex items-center gap-1 rounded bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-400"
                      >
                        <Printer className="h-3.5 w-3.5 shrink-0" /> Print Voucher
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Voucher Overlay */}
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
