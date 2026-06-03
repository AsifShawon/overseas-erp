// src/components/shared/LedgerTable.tsx
"use client";

import React, { useState } from "react";
import { MockLedgerEntry, MockInvoice } from "@/lib/mockData";
import { StatusBadge } from "../ui/StatusBadge";
import { useMockAuth } from "@/context/MockAuthContext";
import { Landmark, Printer, CreditCard, Receipt as ReceiptIcon, FilePlus, X } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useT } from "@/i18n/useT";
import { formatDate, formatCurrency } from "@/i18n/format";

interface LedgerTableProps {
  entries: MockLedgerEntry[];
  outstandingBalance: number;
  onRecordPayment?: (amount: number, method: string, ref: string, invoiceId: string) => void | Promise<void>;
  onRecordInvoice?: (amount: number, desc: string, dueDate: string) => void | Promise<void>;
  invoices?: MockInvoice[];
}

export function LedgerTable({
  entries,
  outstandingBalance,
  onRecordPayment,
  onRecordInvoice,
  invoices = [],
}: LedgerTableProps) {
  const { user } = useMockAuth();
  const toast = useToast();
  const { t, locale } = useT();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"PAYMENT" | "INVOICE">("PAYMENT");

  // Form States
  const [amount, setAmount] = useState("");
  const [descOrRef, setDescOrRef] = useState("");
  const [payMethod, setPayMethod] = useState("BANK_TRANSFER");
  const [dueDate, setDueDate] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      toast.warning(locale === "bn" ? "অনুগ্রহ করে শূন্যের চেয়ে বেশি একটি সঠিক পরিমাণ প্রবেশ করান।" : "Please enter a valid amount greater than zero.");
      return;
    }

    if (modalType === "PAYMENT" && onRecordPayment) {
      if (!selectedInvoiceId) {
        toast.warning(locale === "bn" ? "অনুগ্রহ করে পেমেন্ট সম্পাদন করার জন্য একটি বকেয়া ইনভয়েস নির্বাচন করুন।" : "Please select an outstanding invoice to apply payment.");
        return;
      }
      onRecordPayment(val, payMethod, descOrRef || "TXN_MOCK_REF", selectedInvoiceId);
    } else if (modalType === "INVOICE" && onRecordInvoice) {
      if (!dueDate) {
        toast.warning(locale === "bn" ? "কাস্টম ইনভয়েসের জন্য পরিশোধের শেষ তারিখ আবশ্যক।" : "Due date is required for custom invoices.");
        return;
      }
      const parsedDate = Date.parse(dueDate);
      if (isNaN(parsedDate)) {
        toast.warning(locale === "bn" ? "অনুগ্রহ করে একটি সঠিক পরিশোধের শেষ তারিখ লিখুন।" : "Please enter a valid due date.");
        return;
      }
      onRecordInvoice(val, descOrRef || "KSA Medical/Embassy invoice", dueDate);
    }

    // Reset
    setAmount("");
    setDescOrRef("");
    setDueDate("");
    setSelectedInvoiceId("");
    setModalOpen(false);
  };

  const isAccounts = ["Super Admin", "Accounts Officer"].includes(user.roleName);

  return (
    <div className="space-y-6">
      {/* Overview Balance Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm flex items-center justify-between gap-4">
          <div>
            <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wide">
              {t("applicantDetail.outstandingBalanceCard")}
            </p>
            <h3 className="mt-2 text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-none">
              {formatCurrency(outstandingBalance, "BDT", locale)}
            </h3>
          </div>
          <div className={`rounded-xl p-3 shrink-0 ${outstandingBalance > 0 ? "bg-rose-50 text-rose-600 dark:bg-rose-950/20" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20"}`}>
            <Landmark className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm flex items-center justify-between gap-4">
          <div>
            <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wide">
              {locale === "bn" ? "স্টেটমেন্টের অবস্থা" : "Statement Status"}
            </p>
            <h3 className="mt-2 text-[15px] md:text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {outstandingBalance === 0 
                ? (locale === "bn" ? "অ্যাকাউন্ট সম্পূর্ণ পরিশোধিত" : "Account Fully Paid") 
                : (locale === "bn" ? "কিস্তি বকেয়া রয়েছে" : "Installment Arrears Due")}
            </h3>
          </div>
          <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950/20 shrink-0">
            <ReceiptIcon className="h-6 w-6" />
          </div>
        </div>

        {/* Staff Actions Panel */}
        {isAccounts && (
          <div className="flex gap-3 items-center justify-end sm:col-span-2 lg:col-span-1">
            <button
              onClick={() => {
                setModalType("PAYMENT");
                setModalOpen(true);
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-3 text-xs md:text-sm font-bold text-white transition hover:bg-emerald-700 shadow-sm cursor-pointer"
            >
              <CreditCard className="h-4.5 w-4.5" /> {t("applicantDetail.recordReceiptBtn")}
            </button>
            <button
              onClick={() => {
                setModalType("INVOICE");
                setModalOpen(true);
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-5 py-3 text-xs md:text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200 shadow-sm cursor-pointer"
            >
              <FilePlus className="h-4.5 w-4.5" /> {locale === "bn" ? "ইনভয়েস ইস্যু করুন" : "Issue Invoice"}
            </button>
          </div>
        )}
      </div>

      {/* Main Ledger Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
            {locale === "bn" ? "ডাবল-এন্ট্রি লেজার লগ" : "Double-Entry Ledger Log"}
          </h3>
          <button
            onClick={() => toast.info(locale === "bn" ? "ভাউচার প্রিন্ট করার প্রক্রিয়া অনুকরণ করা হচ্ছে..." : "Simulating print statement download...")}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs md:text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 cursor-pointer"
          >
            <Printer className="h-4 w-4" /> {locale === "bn" ? "স্টেটমেন্ট প্রিন্ট করুন" : "Print Statement"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm leading-relaxed">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-900/30">
                <th className="px-6 py-4.5 text-[14px] md:text-[15px]">{locale === "bn" ? "পোস্টিংয়ের তারিখ" : "Posting Date"}</th>
                <th className="px-6 py-4.5 text-[14px] md:text-[15px]">{locale === "bn" ? "লেনদেনের ধরণ" : "Transaction Type"}</th>
                <th className="px-6 py-4.5 text-[14px] md:text-[15px]">{locale === "bn" ? "রেফারেন্স ডকুমেন্ট" : "Reference Document"}</th>
                <th className="px-6 py-4.5 text-[14px] md:text-[15px] text-right">{locale === "bn" ? "ডেবিট (পাওনা পরিমাণ)" : "Debit (Amount Owed)"}</th>
                <th className="px-6 py-4.5 text-[14px] md:text-[15px] text-right">{locale === "bn" ? "ক্রেডিট (পরিশোধিত পরিমাণ)" : "Credit (Amount Paid)"}</th>
                <th className="px-6 py-4.5 text-[14px] md:text-[15px] text-right font-bold">{locale === "bn" ? "চলতি ব্যালেন্স" : "Running Balance"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 text-text-theme">
                  <td className="px-6 py-4.5 text-text-soft font-semibold">{formatDate(entry.timestamp, locale)}</td>
                  <td className="px-6 py-4.5">
                    <StatusBadge status={entry.transactionType} className="text-xs md:text-sm px-2 py-0.5" />
                  </td>
                  {/* Keep invoice/passport numbers raw/untranslated */}
                  <td className="px-6 py-4.5 font-mono font-bold">{entry.referenceNo}</td>
                  <td className="px-6 py-4.5 text-right text-rose-600 font-bold">
                    {entry.debit > 0 ? formatCurrency(entry.debit, "BDT", locale) : "-"}
                  </td>
                  <td className="px-6 py-4.5 text-right text-emerald-600 font-bold">
                    {entry.credit > 0 ? formatCurrency(entry.credit, "BDT", locale) : "-"}
                  </td>
                  <td className="px-6 py-4.5 text-right font-extrabold text-slate-950 dark:text-white">
                    {formatCurrency(entry.runningBalance, "BDT", locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Ledger Transaction Modal Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm transition-all duration-300">
          <div className="absolute inset-0 cursor-default" onClick={() => setModalOpen(false)} />
          
          <div className="relative w-full max-w-md mx-4 sm:mx-auto max-h-[90vh] flex flex-col rounded-2xl border border-border-theme bg-surface p-6 md:p-8 shadow-2xl transition-all duration-300 dark:bg-slate-950 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-border-theme shrink-0">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-slate-950 dark:text-white leading-normal">
                  {modalType === "PAYMENT" ? t("applicantDetail.receiptModalTitle") : t("applicantDetail.invoiceModalTitle")}
                </h3>
                <p className="mt-1 text-xs md:text-sm text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">
                  {locale === "bn" ? "ডাবল-এন্ট্রি লেনদেনসমূহ ফরেনসিক লেজার টাইমস্ট্যাম্প সহ সংরক্ষিত হয়।" : "Double-entry transactions are saved with forensic ledger timestamps."}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-text-soft hover:bg-bg-muted hover:text-text-theme transition-colors cursor-pointer shrink-0"
                aria-label="Close Modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-5 pr-1">
              {modalType === "PAYMENT" && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-text-theme leading-relaxed">
                    {t("applicantDetail.selectInvoice")}
                  </label>
                  {(() => {
                    const outstandingInvoices = invoices.filter((inv) => inv.outstanding > 0);
                    if (outstandingInvoices.length === 0) {
                      return (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs md:text-sm text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-400 leading-relaxed font-semibold">
                          {locale === "bn" ? "পেমেন্ট রেকর্ড করার জন্য কোনো বকেয়া ইনভয়েস নেই। অনুগ্রহ করে প্রথমে একটি ইনভয়েস ইস্যু করুন।" : "No outstanding invoices available to record payments against. Please issue an invoice first."}
                        </div>
                      );
                    }
                    return (
                      <select
                        value={selectedInvoiceId}
                        onChange={(e) => setSelectedInvoiceId(e.target.value)}
                        required
                        className="w-full rounded-xl border border-border-theme bg-slate-50 py-3 px-4 text-[15px] leading-relaxed outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 text-text-theme"
                      >
                        <option value="">{locale === "bn" ? "-- ইনভয়েস নির্বাচন করুন --" : "-- Choose Invoice --"}</option>
                        {outstandingInvoices.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.invoiceNo} - {inv.description} ({locale === "bn" ? "বকেয়া" : "Owed"}: {formatCurrency(Number(inv.outstanding), "BDT", locale)})
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-theme leading-relaxed">
                  {locale === "bn" ? "লেনদেনের পরিমাণ (BDT)" : "Transaction Amount (BDT)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 1500.00"
                  className="w-full rounded-xl border border-border-theme bg-slate-50 py-3 px-4 text-[15px] leading-relaxed outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 text-text-theme"
                  disabled={modalType === "PAYMENT" && invoices.filter((inv) => inv.outstanding > 0).length === 0}
                />
              </div>

              {modalType === "PAYMENT" ? (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-text-theme leading-relaxed">
                      {locale === "bn" ? "পেমেন্ট গেটওয়ে/পদ্ধতি" : "Payment Gateway/Method"}
                    </label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="w-full rounded-xl border border-border-theme bg-slate-50 py-3 px-4 text-[15px] leading-relaxed outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 text-text-theme"
                      disabled={invoices.filter((inv) => inv.outstanding > 0).length === 0}
                    >
                      <option value="BANK_TRANSFER">{locale === "bn" ? "ইলেকট্রনিক ব্যাংক ট্রান্সফার" : "Electronic Bank Transfer"}</option>
                      <option value="CASH">{locale === "bn" ? "কাউন্টার ক্যাশ ডেস্ক" : "Counter Cash Desk"}</option>
                      <option value="MOBILE_BANKING">{locale === "bn" ? "মোবাইল গেটওয়ে (বিকাশ/নগদ)" : "Mobile Gateway (bKash/Nagad)"}</option>
                      <option value="CHEQUE">{locale === "bn" ? "ক্লিয়ারিং চেক" : "Clearing Cheque"}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-text-theme leading-relaxed">
                      {locale === "bn" ? "ব্যাংক হ্যাশ / লেনদেন রেফারেন্স" : "Bank Hash / Transaction Ref"}
                    </label>
                    <input
                      type="text"
                      value={descOrRef}
                      onChange={(e) => setDescOrRef(e.target.value)}
                      placeholder="e.g. FT889211029"
                      className="w-full rounded-xl border border-border-theme bg-slate-50 py-3 px-4 text-[15px] leading-relaxed outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 text-text-theme"
                      disabled={invoices.filter((inv) => inv.outstanding > 0).length === 0}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-text-theme leading-relaxed">
                      {locale === "bn" ? "বিলিং বিবরণ / লেজার নোট" : "Billing Description / Ledger Note"}
                    </label>
                    <input
                      type="text"
                      required
                      value={descOrRef}
                      onChange={(e) => setDescOrRef(e.target.value)}
                      placeholder="e.g. Visa Processing Stamping fee"
                      className="w-full rounded-xl border border-border-theme bg-slate-50 py-3 px-4 text-[15px] leading-relaxed outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 text-text-theme"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-text-theme leading-relaxed">
                      {locale === "bn" ? "ইনভয়েস পরিশোধের শেষ তারিখ" : "Invoice Due Date"}
                    </label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full rounded-xl border border-border-theme bg-slate-50 py-3 px-4 text-[15px] leading-relaxed outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 text-text-theme"
                    />
                  </div>
                </>
              )}

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-border-theme shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-border-theme px-5 py-3 text-sm md:text-[15px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 cursor-pointer text-text-theme"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm md:text-[15px] font-bold text-white transition hover:bg-indigo-700 shadow-sm disabled:opacity-50 cursor-pointer animate-in duration-200"
                  disabled={modalType === "PAYMENT" && invoices.filter((inv) => inv.outstanding > 0).length === 0}
                >
                  {locale === "bn" ? "এন্ট্রি সংরক্ষণ করুন" : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default LedgerTable;
