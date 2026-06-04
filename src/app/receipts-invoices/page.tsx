"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { ReceiptPreview } from "@/components/shared/ReceiptPreview";
import { useMockAuth } from "@/context/MockAuthContext";
import { FileSpreadsheet, Plus, Printer, Loader2, AlertCircle, FileText } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useT } from "@/i18n/useT";
import { formatDate, formatCurrency } from "@/i18n/format";

interface FlattenedInvoice {
  id: string;
  applicantId: string;
  applicantName: string;
  passportNumber: string;
  invoiceNo: string;
  amount: number;
  outstanding: number;
  dueDate: string;
  description: string;
  createdAt: string;
  status: "PAID" | "PARTIAL" | "DUE";
}

interface FlattenedReceipt {
  id: string;
  receiptNo: string;
  applicantId: string;
  applicantName: string;
  passportNumber: string;
  applicantPhone: string;
  invoiceId: string | null;
  linkedInvoiceNo: string;
  invoiceDescription: string;
  amountPaid: number;
  paymentMethod: string;
  referenceNo: string;
  receivedBy: string;
  createdAt: string;
  invoice?: {
    id: string;
    invoiceNo: string;
    amount: number;
    outstanding: number;
    description: string;
  };
}

export default function ReceiptsInvoicesPage() {
  const router = useRouter();
  const { accessToken } = useMockAuth();
  const toast = useToast();
  const { t, locale } = useT();

  const [activeTab, setActiveTab] = useState<"invoices" | "receipts">("invoices");

  const [invoices, setInvoices] = useState<FlattenedInvoice[]>([]);
  const [receipts, setReceipts] = useState<FlattenedReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [previewReceipt, setPreviewReceipt] = useState<any | undefined>(undefined);
  const [previewApplicant, setPreviewApplicant] = useState<any | undefined>(undefined);
  const [previewInvoice, setPreviewInvoice] = useState<any | undefined>(undefined);
  const [downloadingStatementId, setDownloadingStatementId] = useState<string | null>(null);

  const handleDownloadStatement = async (applicantId: string, applicantName: string) => {
    if (!accessToken) return;
    setDownloadingStatementId(applicantId);
    try {
      const res = await fetch(`/api/applicants/${applicantId}/statement/pdf`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        throw new Error(locale === "bn" ? "পিডিএফ স্টেটমেন্ট তৈরি করতে ব্যর্থ হয়েছে।" : "Failed to generate PDF statement.");
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `statement_${applicantName.replace(/\s+/g, "_")}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success(locale === "bn" ? "পিডিএফ স্টেটমেন্ট ডাউনলোড সফল হয়েছে।" : "PDF statement downloaded successfully.");
    } catch (err: any) {
      toast.error(err.message || (locale === "bn" ? "পিডিএফ ডাউনলোড করার সময় একটি ত্রুটি ঘটেছে।" : "An error occurred during PDF download."));
    } finally {
      setDownloadingStatementId(null);
    }
  };

  const handleExport = async () => {
    if (!accessToken) return;
    setIsExporting(true);
    try {
      const endpoint = activeTab === "invoices" ? "/api/exports/invoices" : "/api/exports/receipts";
      const filename = activeTab === "invoices" ? "invoices_export" : "receipts_export";
      
      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || (locale === "bn" ? "এক্সপোর্ট ফাইল তৈরি করতে ব্যর্থ হয়েছে।" : "Failed to generate CSV export"));
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success(locale === "bn" ? "আর্থিক বিবরণী সফলভাবে এক্সপোর্ট করা হয়েছে!" : "Financial statement registers exported successfully!");
    } catch (err: any) {
      toast.error(err.message || (locale === "bn" ? "এক্সপোর্ট করার সময় একটি ত্রুটি ঘটেছে।" : "An unexpected error occurred during export."));
    } finally {
      setIsExporting(false);
    }
  };

  const fetchFinanceData = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      };

      if (activeTab === "invoices") {
        const res = await fetch("/api/finance/invoices?pageSize=1000", { headers });
        if (!res.ok) throw new Error(locale === "bn" ? "ডাটাবেস থেকে ইনভয়েস লগ লোড করতে ব্যর্থ।" : "Failed to load invoice logs from database.");
        const data = await res.json();
        setInvoices(data.data || []);
      } else {
        const res = await fetch("/api/finance/receipts?pageSize=1000", { headers });
        if (!res.ok) throw new Error(locale === "bn" ? "ডাটাবেস থেকে রসিদ লগ লোড করতে ব্যর্থ।" : "Failed to load receipt logs from database.");
        const data = await res.json();
        setReceipts(data.data || []);
      }
    } catch (err: any) {
      console.error("Error fetching financial registers:", err);
      setError(err.message || (locale === "bn" ? "একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।" : "An unexpected error occurred."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, [accessToken, activeTab]);

  const handleOpenReceiptPreview = (rec: FlattenedReceipt) => {
    setPreviewReceipt({
      receiptNo: rec.receiptNo,
      createdAt: rec.createdAt,
      paymentMethod: rec.paymentMethod,
      referenceNo: rec.referenceNo,
      amountPaid: rec.amountPaid,
      receivedBy: rec.receivedBy,
    });
    setPreviewApplicant({
      fullName: rec.applicantName,
      passportNumber: rec.passportNumber,
      phone: rec.applicantPhone,
    });
    setPreviewInvoice(
      rec.invoice
        ? {
            invoiceNo: rec.invoice.invoiceNo,
            amount: rec.invoice.amount,
            outstanding: rec.invoice.outstanding,
            description: rec.invoice.description,
          }
        : undefined
    );
  };

  const invoiceColumns = [
    {
      header: t("invoicesReceipts.tableHeaderInvoice"),
      accessor: (inv: FlattenedInvoice) => (
        <span className="font-mono font-bold text-text-theme">{inv.invoiceNo}</span>
      ),
    },
    {
      header: locale === "bn" ? "আবেদনকারী প্রার্থী" : "Sourced Candidate",
      accessor: (inv: FlattenedInvoice) => (
        <div className="flex flex-col gap-0.5 text-text-theme">
          <span className="font-semibold text-text-theme">{inv.applicantName}</span>
          <span className="text-[10px] text-text-muted">{locale === "bn" ? "পাসপোর্ট" : "Passport"}: {inv.passportNumber}</span>
        </div>
      ),
    },
    {
      header: locale === "bn" ? "ইস্যুর তারিখ" : "Billed Date",
      accessor: (inv: FlattenedInvoice) => formatDate(inv.createdAt, locale),
    },
    {
      header: locale === "bn" ? "বিলের বিবরণ" : "Billing Description",
      accessor: (inv: FlattenedInvoice) => inv.description,
    },
    {
      header: t("invoicesReceipts.tableHeaderAmount"),
      accessor: (inv: FlattenedInvoice) => (
        <span className="font-semibold text-text-theme">
          {formatCurrency(inv.amount, "BDT", locale)}
        </span>
      ),
      cellClassName: "text-right",
    },
    {
      header: t("invoicesReceipts.tableHeaderOutstanding"),
      accessor: (inv: FlattenedInvoice) => (
        <span className={`font-bold ${inv.outstanding > 0 ? "text-rose-600" : "text-emerald-600"}`}>
          {formatCurrency(inv.outstanding, "BDT", locale)}
        </span>
      ),
      cellClassName: "text-right",
    },
    {
      header: locale === "bn" ? "পরিশোধের অবস্থা" : "Dues Status",
      accessor: (inv: FlattenedInvoice) =>
        inv.outstanding === 0 ? <StatusBadge status="PAID" /> : <StatusBadge status="DUE" />,
    },
    {
      header: locale === "bn" ? "অ্যাকশন" : "Actions",
      accessor: (inv: FlattenedInvoice) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDownloadStatement(inv.applicantId, inv.applicantName);
          }}
          disabled={downloadingStatementId === inv.applicantId}
          className="flex items-center gap-1.5 rounded bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20 cursor-pointer disabled:opacity-50"
        >
          {downloadingStatementId === inv.applicantId ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <FileText className="h-3 w-3 shrink-0" />
          )}
          {locale === "bn" ? "স্টেটমেন্ট পিডিএফ" : "Statement PDF"}
        </button>
      ),
      cellClassName: "text-right",
    },
  ];

  const getLocalizedMethod = (method: string) => {
    if (locale === "bn") {
      switch (method) {
        case "BANK_TRANSFER": return "ইলেকট্রনিক ব্যাংক ট্রান্সফার";
        case "CASH": return "কাউন্টার ক্যাশ ডেস্ক";
        case "MOBILE_BANKING": return "মোবাইল গেটওয়ে (বিকাশ/নগদ)";
        case "CHEQUE": return "ক্লিয়ারিং চেক";
        default: return method;
      }
    } else {
      switch (method) {
        case "BANK_TRANSFER": return "Electronic Bank Transfer";
        case "CASH": return "Counter Cash Desk";
        case "MOBILE_BANKING": return "Mobile Gateway (bKash/Nagad)";
        case "CHEQUE": return "Clearing Cheque";
        default: return method.replace("_", " ");
      }
    }
  };

  const receiptColumns = [
    {
      header: t("invoicesReceipts.tableHeaderReceipt"),
      accessor: (rec: FlattenedReceipt) => (
        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{rec.receiptNo}</span>
      ),
    },
    {
      header: locale === "bn" ? "আবেদনকারী প্রার্থী" : "Sourced Candidate",
      accessor: (rec: FlattenedReceipt) => (
        <div className="flex flex-col gap-0.5 text-text-theme">
          <span className="font-semibold text-text-theme">{rec.applicantName}</span>
          <span className="text-[10px] text-text-muted">{locale === "bn" ? "পাসপোর্ট" : "Passport"}: {rec.passportNumber}</span>
        </div>
      ),
    },
    {
      header: locale === "bn" ? "প্রাপ্তির তারিখ" : "Received Date",
      accessor: (rec: FlattenedReceipt) => formatDate(rec.createdAt, locale),
    },
    {
      header: t("invoicesReceipts.tableHeaderMethod"),
      accessor: (rec: FlattenedReceipt) => getLocalizedMethod(rec.paymentMethod),
    },
    {
      header: locale === "bn" ? "লেনদেন রেফারেন্স" : "Electronic Reference No",
      accessor: (rec: FlattenedReceipt) => rec.referenceNo,
    },
    {
      header: t("invoicesReceipts.tableHeaderAmount"),
      accessor: (rec: FlattenedReceipt) => (
        <span className="font-bold text-emerald-600">
          {formatCurrency(rec.amountPaid, "BDT", locale)}
        </span>
      ),
      cellClassName: "text-right",
    },
    {
      header: locale === "bn" ? "অ্যাকশন" : "Actions",
      accessor: (rec: FlattenedReceipt) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenReceiptPreview(rec);
            }}
            className="flex items-center gap-1 rounded bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/20 cursor-pointer"
          >
            <Printer className="h-3 w-3 shrink-0" /> {t("invoicesReceipts.printVoucher")}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadStatement(rec.applicantId, rec.applicantName);
            }}
            disabled={downloadingStatementId === rec.applicantId}
            className="flex items-center gap-1.5 rounded bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20 cursor-pointer disabled:opacity-50"
          >
            {downloadingStatementId === rec.applicantId ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <FileText className="h-3 w-3 shrink-0" />
            )}
            {locale === "bn" ? "স্টেটমেন্ট পিডিএফ" : "Statement PDF"}
          </button>
        </div>
      ),
      cellClassName: "text-right",
    },
  ];

  return (
    <div className="space-y-6">
      <PermissionGate permission="VIEW_ACCOUNTS" showFallback={true}>
        <PageHeader
          title={t("invoicesReceipts.pageTitle")}
          description={t("invoicesReceipts.pageDesc")}
          breadcrumbs={[
            { label: locale === "bn" ? "ড্যাশবোর্ড" : "ERP Hub", href: "/dashboard" },
            { label: locale === "bn" ? "ইনভয়েস ও রসিদ" : "Receipts & Invoices" }
          ]}
          actions={
            <div className="flex items-center gap-2">
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
                {isExporting ? (locale === "bn" ? "এক্সপোর্ট হচ্ছে..." : "Exporting...") : (locale === "bn" ? "CSV এক্সপোর্ট" : "Export CSV")}
              </button>
            </div>
          }
        />

        {/* Tab Headers */}
        <div className="flex border-b border-border-theme">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-6 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "invoices"
                ? "border-primary-theme text-primary-theme"
                : "border-transparent text-text-soft hover:text-text-theme"
            }`}
          >
            {locale === "bn" ? "প্রার্থীদের ইস্যুকৃত ইনভয়েস" : "Issued Candidate Invoices"}
          </button>
          <button
            onClick={() => setActiveTab("receipts")}
            className={`px-6 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "receipts"
                ? "border-primary-theme text-primary-theme"
                : "border-transparent text-text-soft hover:text-text-theme"
            }`}
          >
            {locale === "bn" ? "ক্যাশ কাউন্টার রসিদ লগ" : "Cash Desk Receipts Logs"}
          </button>
        </div>

        {/* Dynamic Catalog */}
        <div className="rounded-xl border border-border-theme bg-surface p-6 shadow-sm">
          <h3 className="text-xs font-bold text-text-theme uppercase tracking-wider mb-4">
            {activeTab === "invoices"
              ? (locale === "bn" ? "প্রার্থী বিলিং রেজিস্টার" : "Candidate Billing Register")
              : (locale === "bn" ? "সমন্বিত পেমেন্ট অডিট" : "Consolidated Payment Audits")}
          </h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="h-7 w-7 text-indigo-600 animate-spin" />
              <p className="text-xs text-slate-500 font-bold">{locale === "bn" ? "লেনদেনের হিসাব লোড হচ্ছে..." : "Retrieving ledger log entries..."}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-rose-50/50 dark:bg-rose-950/5 rounded-lg border border-rose-100 dark:border-rose-950/20">
              <AlertCircle className="h-10 w-10 text-rose-500" />
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-bold text-rose-900 dark:text-rose-400">{locale === "bn" ? "লগ লোড করতে ব্যর্থ" : "Failed to Load Logs"}</h4>
                <p className="text-xs text-rose-700/80 dark:text-rose-400/70">{error}</p>
              </div>
              <button
                onClick={fetchFinanceData}
                className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-500 cursor-pointer"
              >
                {locale === "bn" ? "পুনরায় চেষ্টা করুন" : "Retry Connection"}
              </button>
            </div>
          ) : activeTab === "invoices" ? (
            <DataTable
              data={invoices}
              columns={invoiceColumns}
              searchPlaceholder={locale === "bn" ? "ইনভয়েস নম্বর দিয়ে খুঁজুন..." : "Search invoices by number..."}
              searchField="invoiceNo"
              emptyStateTitle={locale === "bn" ? "কোনো ইনভয়েস রেকর্ড পাওয়া যায়নি" : "No service invoices recorded"}
              emptyStateDescription={locale === "bn" ? "নতুন লজিস্টিক এবং ভিসা ইনভয়েস প্রতিটি প্রার্থীর বায়ো-ডেটা ফাইল থেকে যোগ করা যেতে পারে।" : "Custom logistics and embassy invoices can be registered under each candidate dossier."}
            />
          ) : (
            <DataTable
              data={receipts}
              columns={receiptColumns}
              searchPlaceholder={locale === "bn" ? "রসিদ নম্বর দিয়ে খুঁজুন..." : "Search receipts by number..."}
              searchField="receiptNo"
              emptyStateTitle={locale === "bn" ? "কোনো পেমেন্ট রসিদ পাওয়া যায়নি" : "No payment logs recorded"}
              emptyStateDescription={locale === "bn" ? "ব্যাংক ট্রান্সফার এবং ক্যাশ ডেস্ক পেমেন্টগুলো প্রার্থীর স্টেটমেন্ট ট্যাবে এন্ট্রি করা হয়।" : "Electronic bank transfers and cash counter desk payments are recorded inside candidate statements."}
            />
          )}
        </div>
      </PermissionGate>

      {/* Printer Overlay */}
      {previewReceipt && previewApplicant && (
        <ReceiptPreview
          receipt={previewReceipt}
          applicant={previewApplicant}
          invoice={previewInvoice}
          onClose={() => setPreviewReceipt(undefined)}
        />
      )}
    </div>
  );
}

