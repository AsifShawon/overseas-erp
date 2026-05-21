import React from "react";
import { MockApplicant, MockReceipt, MockInvoice } from "@/lib/mockData";
import { Globe2, Printer, X, ShieldCheck } from "lucide-react";

interface ReceiptPreviewProps {
  receipt: MockReceipt;
  applicant: MockApplicant;
  invoice?: MockInvoice;
  onClose: () => void;
}

export function ReceiptPreview({ receipt, applicant, invoice, onClose }: ReceiptPreviewProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-950 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
        {/* Actions Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Payment Voucher</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1 rounded bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-400"
            >
              <Printer className="h-3.5 w-3.5" /> Print Receipt
            </button>
            <button
              onClick={onClose}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Print Content Area */}
        <div className="mt-6 p-4 border border-slate-150 rounded-lg dark:border-slate-800 bg-slate-50/20 dark:bg-transparent">
          {/* Logo Agency Details */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start border-b border-dashed border-slate-200 pb-6 dark:border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-lg dark:text-white">
                <Globe2 className="h-5 w-5 text-indigo-600" />
                <span>OVERSEAS RECRUITMENT AGENCY</span>
              </div>
              <p className="text-[9px] text-slate-400 font-medium max-w-xs">
                Plot 14, Sector 7, Commercial Area, Uttara, Dhaka, Bangladesh<br />
                License No: RL-9082 | Gov Approved Emigration Supply ERP
              </p>
            </div>
            <div className="text-left sm:text-right space-y-1">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase">OFFICIAL RECEIPT</h3>
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{receipt.receiptNo}</p>
              <p className="text-[9px] text-slate-400">Date: {new Date(receipt.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Client Details */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs border-b border-dashed border-slate-200 pb-6 dark:border-slate-800">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Billed Sourced Candidate</p>
              <p className="mt-1 font-bold text-slate-800 dark:text-white">{applicant.fullName}</p>
              <p className="text-slate-500">Passport: {applicant.passportNumber}</p>
              <p className="text-slate-500">Phone: {applicant.phone}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Transaction Registry</p>
              {invoice ? (
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  Applied To: <span className="font-semibold">{invoice.invoiceNo}</span>
                </p>
              ) : (
                <p className="mt-1 text-slate-500">Direct Account Deposit</p>
              )}
              <p className="text-slate-500">Method: {receipt.paymentMethod.replace("_", " ")}</p>
              <p className="text-slate-500">Bank Ref: {receipt.referenceNo || "Cash Desk Counter"}</p>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="mt-6 text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                  <th className="py-2">Description of Services</th>
                  <th className="py-2 text-right">Debit Balance ($)</th>
                  <th className="py-2 text-right">Credit Amount ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr className="font-medium text-slate-700 dark:text-slate-300">
                  <td className="py-3">
                    {invoice ? invoice.description : "KSA Recruitment Package Installment payment"}
                  </td>
                  <td className="py-3 text-right text-slate-500">
                    {invoice ? `$${invoice.amount.toFixed(2)}` : "-"}
                  </td>
                  <td className="py-3 text-right text-emerald-600 font-bold">
                    ${receipt.amountPaid.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="mt-8 flex flex-col items-end gap-2 border-t border-slate-200 pt-6 text-xs dark:border-slate-800">
            <div className="flex w-64 justify-between text-slate-500">
              <span>Total Received Amount:</span>
              <span className="font-bold text-slate-800 dark:text-white">${receipt.amountPaid.toFixed(2)}</span>
            </div>
            {invoice && (
              <div className="flex w-64 justify-between text-slate-500">
                <span>Remaining Account Dues:</span>
                <span className="font-bold text-rose-600">${invoice.outstanding.toFixed(2)}</span>
              </div>
            )}
            <div className="mt-4 flex items-center gap-1 text-[9px] text-emerald-600 font-semibold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded">
              <ShieldCheck className="h-3.5 w-3.5" /> Certified Recorded by: {receipt.receivedBy}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ReceiptPreview;
