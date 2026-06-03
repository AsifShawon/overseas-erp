"use client";

import React, { useState, useEffect, useEffectEvent } from "react";
import { useMockAuth } from "@/context/MockAuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";

import { WorkflowStepper } from "@/components/shared/WorkflowStepper";
import { DocumentChecklist } from "@/components/shared/DocumentChecklist";
import { LedgerTable } from "@/components/shared/LedgerTable";
import { ReceiptPreview } from "@/components/shared/ReceiptPreview";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  MockApplicant,
  MockDocument,
  MockLedgerEntry,
  MockReceipt,
  MockInvoice,
} from "@/lib/mockData";
import { User, ShieldCheck, Mail, Phone, Calendar, Printer, FileText, XCircle, Loader2 } from "lucide-react";
import { useT } from "@/i18n/useT";

export default function ApplicantPortalPage() {
  const router = useRouter();
  const { user, accessToken } = useMockAuth();
  const toast = useToast();
  const { t } = useT();

  // React state elements for dynamic API dossier rendering
  const [applicant, setApplicant] = useState<MockApplicant | null>(null);
  const [documents, setDocuments] = useState<MockDocument[]>([]);
  const [ledgers, setLedgers] = useState<MockLedgerEntry[]>([]);
  const [invoice, setInvoice] = useState<MockInvoice | undefined>(undefined);
  const [receipts, setReceipts] = useState<MockReceipt[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedReceipt, setSelectedReceipt] = useState<MockReceipt | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"progress" | "documents" | "ledger">("progress");

  const fetchDossier = useEffectEvent(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/applicant/portal", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Access Denied. You do not have permissions to view this portal.");
        }
        const data = await res.json();
        throw new Error(data.error || "Failed to retrieve emigration dossier.");
      }

      const data = await res.json();
      setApplicant(data);
      setDocuments(data.documents || []);
      setLedgers(data.ledgerEntries || []);
      setInvoice(data.invoices?.[0] || undefined);
      setReceipts(data.receipts || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected connection error occurred.");
    } finally {
      setLoading(false);
    }
  });
  
  // 1. Strict Role-Guard Redirection
  useEffect(() => {
    if (user && user.roleName !== "Applicant") {
      router.push("/dashboard");
    }
  }, [user, router]);

  // 2. Fetch live applicant dossier via GET /api/applicant/portal
  useEffect(() => {
    void fetchDossier();
  }, [accessToken]);

  // 3. Document Secure Upload handler
  const handleUploadDocument = async (
    docType: string,
    file: File,
    expiryDate?: string,
    remarks?: string
  ) => {
    if (!applicant || !accessToken) return;

    const formData = new FormData();
    formData.append("applicantId", applicant.id);
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
      const data = await res.json();
      throw new Error(data.error || t("applicantPortal.errorUpload"));
    }

    await fetchDossier();
  };

  // 4. Secure streamed downloads using JWT validation
  const handleDownloadDocument = async (docId: string, fileName: string) => {
    if (!applicant || !accessToken) return;
    try {
      const res = await fetch(`/api/documents/${docId}/download`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Access Denied. You cannot view files from other candidates.");
        }
        throw new Error("Failed to download compliance file.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error("Secure download failed:", err);
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred during download.");
    }
  };

  // 5. Elegant Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin dark:text-indigo-400" />
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{t("applicantPortal.retrievingDossier")}</p>
      </div>
    );
  }

  // 6. Error/403 state layout
  if (error) {
    return (
      <div className="rounded-xl border border-rose-100 bg-rose-50/20 p-6 shadow-sm max-w-2xl mx-auto dark:border-rose-950/20 dark:bg-rose-950/5">
        <div className="flex gap-3">
          <XCircle className="h-6 w-6 text-rose-600 shrink-0 dark:text-rose-400" />
          <div>
            <h4 className="text-sm font-bold text-rose-900 dark:text-rose-400 font-bold">{t("applicantPortal.portalRestriction")}</h4>
            <p className="mt-2 text-xs text-rose-700/80 dark:text-rose-400/80 leading-relaxed">
              {error}
            </p>
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="rounded bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 transition"
              >
                {t("applicantPortal.retryHandshake")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 7. Empty state layout
  if (!applicant) {
    return (
      <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl bg-slate-50/30 text-slate-500 max-w-2xl mx-auto dark:border-slate-800 dark:bg-slate-950">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">{t("applicantPortal.noActiveDossier")}</h3>
        <p className="mt-2 text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          {t("applicantPortal.noActiveDossierDesc")}
        </p>
      </div>
    );
  }

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
              {t("applicantPortal.hello", { name: applicant.fullName })}
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              {t("applicantPortal.appliedPlacement")}: <span className="font-bold text-slate-600 dark:text-slate-300">{applicant.trade}</span> • {t("applicantPortal.passportNumber")}: <span className="font-mono">{applicant.passportNumber}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] rounded bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 font-bold dark:bg-indigo-950 dark:border-indigo-900">
            {t("applicantPortal.portalAccessClaimed")}
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
          {t("applicantPortal.tabTimeline")}
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className={`px-6 py-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === "documents"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          {t("applicantPortal.tabDocuments", { count: documents.length })}
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={`px-6 py-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === "ledger"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          {t("applicantPortal.tabLedger")}
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === "progress" && (
          <div className="space-y-6">
            <WorkflowStepper currentStage={applicant.currentStage} showActionBox={false} />

            {/* Demographics Summary Card */}
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 dark:border-slate-800">
                {t("applicantPortal.placementDemographics")}
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2 text-xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{t("applicantPortal.contactInfo")}</p>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Phone className="h-3.5 w-3.5" /> <span>{applicant.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Mail className="h-3.5 w-3.5" /> <span>{applicant.email || t("applicantPortal.noEmail")}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{t("applicants.personalDetailsSec")}</p>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Calendar className="h-3.5 w-3.5" /> <span>{t("applicantPortal.dob", { date: applicant.dateOfBirth })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <FileText className="h-3.5 w-3.5" /> <span>{t("applicantPortal.passportExpiry", { date: applicant.passportExpiry })}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{t("applicantPortal.interactiveWarningStatus")}</p>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span>{t("applicantPortal.clearanceChecked")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <DocumentChecklist 
            documents={documents} 
            onUpload={handleUploadDocument} 
            onDownload={handleDownloadDocument} 
          />
        )}

        {activeTab === "ledger" && (
          <div className="space-y-6">
            <LedgerTable entries={ledgers} outstandingBalance={outstandingBalance} />

            {/* Quick print receipt section */}
            {receipts.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
                  {t("applicantPortal.printVouchers")}
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {receipts.map((rec) => (
                    <div key={rec.id} className="rounded-lg bg-slate-50 p-4 border border-slate-100 flex items-center justify-between dark:bg-slate-900/50 dark:border-slate-800">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{rec.receiptNo}</p>
                        <p className="text-[10px] text-slate-400">{t("applicantPortal.amountPaid")}: ${rec.amountPaid.toLocaleString()} • {t("applicantPortal.date")}: {rec.createdAt}</p>
                      </div>
                      <button
                        onClick={() => setSelectedReceipt(rec)}
                        className="flex items-center gap-1 rounded bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-400"
                      >
                        <Printer className="h-3.5 w-3.5 shrink-0" /> {t("applicantPortal.printVoucherBtn")}
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
