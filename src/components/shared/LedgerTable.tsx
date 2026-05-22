"use client";

import React, { useState } from "react";
import { MockLedgerEntry, MockInvoice } from "@/lib/mockData";
import { StatusBadge } from "../ui/StatusBadge";
import { useMockAuth } from "@/context/MockAuthContext";
import { Landmark, Printer, CreditCard, Receipt as ReceiptIcon, FilePlus } from "lucide-react";
import { useToast } from "@/context/ToastContext";

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
      toast.warning("Please enter a valid amount greater than zero.");
      return;
    }

    if (modalType === "PAYMENT" && onRecordPayment) {
      if (!selectedInvoiceId) {
        toast.warning("Please select an outstanding invoice to apply payment.");
        return;
      }
      onRecordPayment(val, payMethod, descOrRef || "TXN_MOCK_REF", selectedInvoiceId);
    } else if (modalType === "INVOICE" && onRecordInvoice) {
      if (!dueDate) {
        toast.warning("Due date is required for custom invoices.");
        return;
      }
      const parsedDate = Date.parse(dueDate);
      if (isNaN(parsedDate)) {
        toast.warning("Please enter a valid due date.");
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
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Outstanding Receivables</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              ${outstandingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className={`rounded-lg p-2.5 ${outstandingBalance > 0 ? "bg-rose-50 text-rose-600 dark:bg-rose-950/20" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20"}`}>
            <Landmark className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Statement Status</p>
            <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
              {outstandingBalance === 0 ? "Account Fully Paid" : "Installment Arrears Due"}
            </h3>
          </div>
          <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/20">
            <ReceiptIcon className="h-5 w-5" />
          </div>
        </div>

        {/* Staff Actions Panel */}
        {isAccounts && (
          <div className="flex gap-2 items-center justify-end sm:col-span-2 lg:col-span-1">
            <button
              onClick={() => {
                setModalType("PAYMENT");
                setModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-sm"
            >
              <CreditCard className="h-4 w-4" /> Record Receipt
            </button>
            <button
              onClick={() => {
                setModalType("INVOICE");
                setModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200 shadow-sm"
            >
              <FilePlus className="h-4 w-4" /> Issue Invoice
            </button>
          </div>
        )}
      </div>

      {/* Main Ledger Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">Double-Entry Ledger Log</h3>
          <button
            onClick={() => toast.info("Simulating print folder download...")}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400"
          >
            <Printer className="h-3.5 w-3.5" /> Print Statement
          </button>
        </div>

        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900/30">
              <th className="px-6 py-3.5">Posting Date</th>
              <th className="px-6 py-3.5">Transaction Type</th>
              <th className="px-6 py-3.5">Reference Document</th>
              <th className="px-6 py-3.5 text-right">Debit (Amount Owed)</th>
              <th className="px-6 py-3.5 text-right">Credit (Amount Paid)</th>
              <th className="px-6 py-3.5 text-right font-bold">Running Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                <td className="px-6 py-4 text-slate-500">{new Date(entry.timestamp).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={entry.transactionType} />
                </td>
                <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{entry.referenceNo}</td>
                <td className="px-6 py-4 text-right text-rose-600 font-semibold">
                  {entry.debit > 0 ? `$${entry.debit.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "-"}
                </td>
                <td className="px-6 py-4 text-right text-emerald-600 font-semibold">
                  {entry.credit > 0 ? `$${entry.credit.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "-"}
                </td>
                <td className="px-6 py-4 text-right font-bold text-slate-950 dark:text-white">
                  ${entry.runningBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Record Ledger Transaction Modal Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-slate-950 dark:text-white">
              {modalType === "PAYMENT" ? "Record Cash/Bank Receipt" : "Issue Custom Service Invoice"}
            </h3>
            <p className="mt-1 text-[10px] text-slate-400">
              Double-entry transactions are saved with forensic ledger timestamps.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {modalType === "PAYMENT" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400">Select Outstanding Invoice</label>
                  {(() => {
                    const outstandingInvoices = invoices.filter((inv) => inv.outstanding > 0);
                    if (outstandingInvoices.length === 0) {
                      return (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/55 p-3 text-[11px] text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-400 leading-relaxed">
                          No outstanding invoices available to record payments against. Please issue an invoice first.
                        </div>
                      );
                    }
                    return (
                      <select
                        value={selectedInvoiceId}
                        onChange={(e) => setSelectedInvoiceId(e.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                      >
                        <option value="">-- Choose Invoice --</option>
                        {outstandingInvoices.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.invoiceNo} - {inv.description} (Owed: ${Number(inv.outstanding).toLocaleString()})
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400">Transaction Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 1500.00"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                  disabled={modalType === "PAYMENT" && invoices.filter((inv) => inv.outstanding > 0).length === 0}
                />
              </div>

              {modalType === "PAYMENT" ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400">Payment Gateway/Method</label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                      disabled={invoices.filter((inv) => inv.outstanding > 0).length === 0}
                    >
                      <option value="BANK_TRANSFER">Electronic Bank Transfer</option>
                      <option value="CASH">Counter Cash Desk</option>
                      <option value="MOBILE_BANKING">Mobile Gateway (bKash/Nagad)</option>
                      <option value="CHEQUE">Clearing Cheque</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400">Bank Hash / Transaction Ref</label>
                    <input
                      type="text"
                      value={descOrRef}
                      onChange={(e) => setDescOrRef(e.target.value)}
                      placeholder="e.g. FT889211029"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                      disabled={invoices.filter((inv) => inv.outstanding > 0).length === 0}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400">Billing Description / Ledger Note</label>
                    <input
                      type="text"
                      required
                      value={descOrRef}
                      onChange={(e) => setDescOrRef(e.target.value)}
                      placeholder="e.g. Visa Processing Stamping fee"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400">Invoice Due Date</label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>
                </>
              )}

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                  disabled={modalType === "PAYMENT" && invoices.filter((inv) => inv.outstanding > 0).length === 0}
                >
                  Save Entry
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
