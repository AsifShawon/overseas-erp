"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { ReceiptPreview } from "@/components/shared/ReceiptPreview";
import {
  MOCK_INVOICES,
  MOCK_RECEIPTS,
  MOCK_APPLICANTS,
  MockInvoice,
  MockReceipt,
  MockApplicant,
} from "@/lib/mockData";
import { FileSpreadsheet, Plus, Printer } from "lucide-react";

interface FlattenedInvoice extends MockInvoice {
  applicantName: string;
  passportNumber: string;
}

interface FlattenedReceipt extends MockReceipt {
  applicantName: string;
  passportNumber: string;
}

export default function ReceiptsInvoicesPage() {
  const [activeTab, setActiveTab] = useState<"invoices" | "receipts">("invoices");
  const [previewReceipt, setPreviewReceipt] = useState<MockReceipt | undefined>(undefined);
  const [previewApplicant, setPreviewApplicant] = useState<MockApplicant | undefined>(undefined);
  const [previewInvoice, setPreviewInvoice] = useState<MockInvoice | undefined>(undefined);

  // Flatten lists with candidate names
  const allInvoices: FlattenedInvoice[] = MOCK_INVOICES.map((inv) => {
    const app = MOCK_APPLICANTS.find((a) => a.id === inv.applicantId);
    return {
      ...inv,
      applicantName: app ? app.fullName : "Unknown Candidate",
      passportNumber: app ? app.passportNumber : "N/A",
    };
  });

  const allReceipts: FlattenedReceipt[] = MOCK_RECEIPTS.map((rec) => {
    const app = MOCK_APPLICANTS.find((a) => a.id === rec.applicantId);
    return {
      ...rec,
      applicantName: app ? app.fullName : "Unknown Candidate",
      passportNumber: app ? app.passportNumber : "N/A",
    };
  });

  const handleOpenReceiptPreview = (rec: MockReceipt) => {
    const app = MOCK_APPLICANTS.find((a) => a.id === rec.applicantId);
    const inv = MOCK_INVOICES.find((i) => i.id === rec.invoiceId);
    setPreviewReceipt(rec);
    setPreviewApplicant(app);
    setPreviewInvoice(inv);
  };

  const invoiceColumns = [
    { header: "Invoice Number", accessor: (inv: FlattenedInvoice) => <span className="font-mono font-bold">{inv.invoiceNo}</span> },
    {
      header: "Sourced Candidate",
      accessor: (inv: FlattenedInvoice) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-slate-900 dark:text-white">{inv.applicantName}</span>
          <span className="text-[10px] text-slate-400">Passport: {inv.passportNumber}</span>
        </div>
      ),
    },
    { header: "Billed Date", accessor: (inv: FlattenedInvoice) => inv.createdAt },
    { header: "Billing Description", accessor: (inv: FlattenedInvoice) => inv.description },
    {
      header: "Billed Total",
      accessor: (inv: FlattenedInvoice) => (
        <span className="font-semibold text-slate-900 dark:text-white">
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
        inv.outstanding === 0 ? (
          <StatusBadge status="PAID" />
        ) : (
          <StatusBadge status="ACCRUED" />
        ),
    },
  ];

  const receiptColumns = [
    { header: "Receipt Number", accessor: (rec: FlattenedReceipt) => <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{rec.receiptNo}</span> },
    {
      header: "Sourced Candidate",
      accessor: (rec: FlattenedReceipt) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-slate-900 dark:text-white">{rec.applicantName}</span>
          <span className="text-[10px] text-slate-400">Passport: {rec.passportNumber}</span>
        </div>
      ),
    },
    { header: "Received Date", accessor: (rec: FlattenedReceipt) => rec.createdAt },
    { header: "Gateway Method", accessor: (rec: FlattenedReceipt) => rec.paymentMethod.replace("_", " ") },
    { header: "Electronic Reference No", accessor: (rec: FlattenedReceipt) => rec.referenceNo || "Cash Counter Desk" },
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
          description="Regulatory logistics invoicing center. ManageCounter Cash Desk payments, bank transfer confirmations, and official printed vouchers."
          breadcrumbs={[{ label: "ERP Hub", href: "/dashboard" }, { label: "Receipts & Invoices" }]}
          actions={
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500">
                <Plus className="h-4 w-4" /> Record Counter Receipt
              </button>
              <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export Excel
              </button>
            </div>
          }
        />

        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-6 py-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === "invoices"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Issued Candidate Invoices
          </button>
          <button
            onClick={() => setActiveTab("receipts")}
            className={`px-6 py-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === "receipts"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Cash Desk Receipts Logs
          </button>
        </div>

        {/* Dynamic Catalog */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
            {activeTab === "invoices" ? "Candidate Billing Register" : "Consolidated Payment Audits"}
          </h3>
          {activeTab === "invoices" ? (
            <DataTable
              data={allInvoices}
              columns={invoiceColumns}
              searchPlaceholder="Search invoices by number..."
              searchField="invoiceNo"
            />
          ) : (
            <DataTable
              data={allReceipts}
              columns={receiptColumns}
              searchPlaceholder="Search receipts by number..."
              searchField="receiptNo"
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
