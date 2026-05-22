"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { ReceiptPreview } from "@/components/shared/ReceiptPreview";
import { useMockAuth } from "@/context/MockAuthContext";
import { FileSpreadsheet, Plus, Printer, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/context/ToastContext";

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

  const [activeTab, setActiveTab] = useState<"invoices" | "receipts">("invoices");

  const [invoices, setInvoices] = useState<FlattenedInvoice[]>([]);
  const [receipts, setReceipts] = useState<FlattenedReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [previewReceipt, setPreviewReceipt] = useState<any | undefined>(undefined);
  const [previewApplicant, setPreviewApplicant] = useState<any | undefined>(undefined);
  const [previewInvoice, setPreviewInvoice] = useState<any | undefined>(undefined);

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
        throw new Error(errData.error || "Failed to generate CSV export");
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Financial statement registers exported successfully!");
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred during export.");
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
        if (!res.ok) throw new Error("Failed to load invoice logs from database.");
        const data = await res.json();
        setInvoices(data.data || []);
      } else {
        const res = await fetch("/api/finance/receipts?pageSize=1000", { headers });
        if (!res.ok) throw new Error("Failed to load receipt logs from database.");
        const data = await res.json();
        setReceipts(data.data || []);
      }
    } catch (err: any) {
      console.error("Error fetching financial registers:", err);
      setError(err.message || "An unexpected error occurred.");
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
      header: "Invoice Number",
      accessor: (inv: FlattenedInvoice) => (
        <span className="font-mono font-bold text-text-theme">{inv.invoiceNo}</span>
      ),
    },
    {
      header: "Sourced Candidate",
      accessor: (inv: FlattenedInvoice) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-text-theme">{inv.applicantName}</span>
          <span className="text-[10px] text-text-muted">Passport: {inv.passportNumber}</span>
        </div>
      ),
    },
    { header: "Billed Date", accessor: (inv: FlattenedInvoice) => inv.createdAt },
    { header: "Billing Description", accessor: (inv: FlattenedInvoice) => inv.description },
    {
      header: "Billed Total",
      accessor: (inv: FlattenedInvoice) => (
        <span className="font-semibold text-text-theme">
          ${inv.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
      ),
      cellClassName: "text-right",
    },
    {
      header: "Arrears Due",
      accessor: (inv: FlattenedInvoice) => (
        <span className={`font-bold ${inv.outstanding > 0 ? "text-rose-600" : "text-emerald-600"}`}>
          ${inv.outstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
      ),
      cellClassName: "text-right",
    },
    {
      header: "Dues Status",
      accessor: (inv: FlattenedInvoice) =>
        inv.outstanding === 0 ? <StatusBadge status="PAID" /> : <StatusBadge status="ACCRUED" />,
    },
  ];

  const receiptColumns = [
    {
      header: "Receipt Number",
      accessor: (rec: FlattenedReceipt) => (
        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{rec.receiptNo}</span>
      ),
    },
    {
      header: "Sourced Candidate",
      accessor: (rec: FlattenedReceipt) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-text-theme">{rec.applicantName}</span>
          <span className="text-[10px] text-text-muted">Passport: {rec.passportNumber}</span>
        </div>
      ),
    },
    { header: "Received Date", accessor: (rec: FlattenedReceipt) => rec.createdAt },
    { header: "Gateway Method", accessor: (rec: FlattenedReceipt) => rec.paymentMethod.replace("_", " ") },
    { header: "Electronic Reference No", accessor: (rec: FlattenedReceipt) => rec.referenceNo },
    {
      header: "Amount Paid",
      accessor: (rec: FlattenedReceipt) => (
        <span className="font-bold text-emerald-600">
          ${rec.amountPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
      ),
      cellClassName: "text-right",
    },
    {
      header: "Action Vouchers",
      accessor: (rec: FlattenedReceipt) => (
        <button
          onClick={() => handleOpenReceiptPreview(rec)}
          className="flex items-center gap-1 rounded bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/20"
        >
          <Printer className="h-3 w-3 shrink-0" /> Print Voucher
        </button>
      ),
      cellClassName: "text-right",
    },
  ];

  return (
    <div className="space-y-6">
      <PermissionGate permission="VIEW_ACCOUNTS" showFallback={true}>
        <PageHeader
          title="Billings, Receipts & Invoices"
          description="Regulatory logistics invoicing center. Manage Counter Cash Desk payments, bank transfer confirmations, and official printed vouchers."
          breadcrumbs={[{ label: "ERP Hub", href: "/dashboard" }, { label: "Receipts & Invoices" }]}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/applicants")}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500"
              >
                <Plus className="h-4 w-4" /> Record Counter Receipt
              </button>
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
          }
        />

        {/* Tab Headers */}
        <div className="flex border-b border-border-theme">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-6 py-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === "invoices"
                ? "border-primary-theme text-primary-theme"
                : "border-transparent text-text-soft hover:text-text-theme"
            }`}
          >
            Issued Candidate Invoices
          </button>
          <button
            onClick={() => setActiveTab("receipts")}
            className={`px-6 py-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === "receipts"
                ? "border-primary-theme text-primary-theme"
                : "border-transparent text-text-soft hover:text-text-theme"
            }`}
          >
            Cash Desk Receipts Logs
          </button>
        </div>

        {/* Dynamic Catalog */}
        <div className="rounded-xl border border-border-theme bg-surface p-6 shadow-sm">
          <h3 className="text-xs font-bold text-text-theme uppercase tracking-wider mb-4">
            {activeTab === "invoices" ? "Candidate Billing Register" : "Consolidated Payment Audits"}
          </h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="h-7 w-7 text-indigo-600 animate-spin" />
              <p className="text-xs text-slate-500 font-bold">Retrieving ledger log entries...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-rose-50/50 dark:bg-rose-950/5 rounded-lg border border-rose-100 dark:border-rose-950/20">
              <AlertCircle className="h-10 w-10 text-rose-500" />
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-bold text-rose-900 dark:text-rose-400">Failed to Load Logs</h4>
                <p className="text-xs text-rose-700/80 dark:text-rose-400/70">{error}</p>
              </div>
              <button
                onClick={fetchFinanceData}
                className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-500"
              >
                Retry Connection
              </button>
            </div>
          ) : activeTab === "invoices" ? (
            <DataTable
              data={invoices}
              columns={invoiceColumns}
              searchPlaceholder="Search invoices by number..."
              searchField="invoiceNo"
              emptyStateTitle="No service invoices recorded"
              emptyStateDescription="Custom logistics and embassy invoices can be registered under each candidate dossier."
            />
          ) : (
            <DataTable
              data={receipts}
              columns={receiptColumns}
              searchPlaceholder="Search receipts by number..."
              searchField="receiptNo"
              emptyStateTitle="No payment logs recorded"
              emptyStateDescription="Electronic bank transfers and cash counter desk payments are recorded inside candidate statements."
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
