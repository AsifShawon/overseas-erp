import React from "react";
import { MockApplicant, MockReceipt, MockInvoice } from "@/lib/mockData";
import { Globe2, Printer, X, ShieldCheck } from "lucide-react";
import { useT } from "@/i18n/useT";
import { formatDate, formatCurrency } from "@/i18n/format";

interface ReceiptPreviewProps {
  receipt: MockReceipt;
  applicant: MockApplicant;
  invoice?: MockInvoice;
  onClose: () => void;
}

export function ReceiptPreview({ receipt, applicant, invoice, onClose }: ReceiptPreviewProps) {
  const { t, locale } = useT();

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-950 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
        {/* Actions Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {locale === "bn" ? "অফিসিয়াল পেমেন্ট ভাউচার" : "Official Payment Voucher"}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1 rounded bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-400 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" /> {locale === "bn" ? "রসিদ প্রিন্ট করুন" : "Print Receipt"}
            </button>
            <button
              onClick={onClose}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
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
                <img src="/visatek_logo_transparent.png" alt="VisaTek Logo" className="h-6 w-auto object-contain" />
                <span>VISATEK RECRUITMENT AGENCY</span>
              </div>
              <p className="text-[9px] text-slate-400 font-medium max-w-xs leading-relaxed">
                {locale === "bn" 
                  ? "প্লট ১৪, সেক্টর ৭, বাণিজ্যিক এলাকা, উত্তরা, ঢাকা, বাংলাদেশ"
                  : "Plot 14, Sector 7, Commercial Area, Uttara, Dhaka, Bangladesh"
                }<br />
                {locale === "bn"
                  ? "লাইসেন্স নং: RL-9082 | সরকারি অনুমোদিত এমিগ্রেশন সাপ্লাই ERP"
                  : "License No: RL-9082 | Gov Approved Emigration Supply ERP"
                }
              </p>
            </div>
            <div className="text-left sm:text-right space-y-1">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase">
                {locale === "bn" ? "অফিসিয়াল রসিদ" : "OFFICIAL RECEIPT"}
              </h3>
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">{receipt.receiptNo}</p>
              <p className="text-[9px] text-slate-400">
                {locale === "bn" ? "তারিখ:" : "Date:"} {formatDate(receipt.createdAt, locale)}
              </p>
            </div>
          </div>

          {/* Client Details */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs border-b border-dashed border-slate-200 pb-6 dark:border-slate-800">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                {locale === "bn" ? "বিলকৃত সোর্সকৃত প্রার্থী" : "Billed Sourced Candidate"}
              </p>
              <p className="mt-1 font-bold text-slate-800 dark:text-white">{applicant.fullName}</p>
              <p className="text-slate-500 font-medium">{locale === "bn" ? "পাসপোর্ট:" : "Passport:"} <span className="font-mono">{applicant.passportNumber}</span></p>
              <p className="text-slate-500 font-medium">{locale === "bn" ? "মোবাইল নং:" : "Phone:"} <span className="font-mono">{applicant.phone}</span></p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                {locale === "bn" ? "লেনদেন রেজিস্ট্রি" : "Transaction Registry"}
              </p>
              {invoice ? (
                <p className="mt-1 text-slate-600 dark:text-slate-400 font-medium">
                  {locale === "bn" ? "প্রযোজ্য ইনভয়েস:" : "Applied To:"} <span className="font-semibold font-mono">{invoice.invoiceNo}</span>
                </p>
              ) : (
                <p className="mt-1 text-slate-500 font-medium">
                  {locale === "bn" ? "সরাসরি অ্যাকাউন্ট জমা" : "Direct Account Deposit"}
                </p>
              )}
              <p className="text-slate-500 font-medium">{locale === "bn" ? "পদ্ধতি:" : "Method:"} {getLocalizedMethod(receipt.paymentMethod)}</p>
              <p className="text-slate-500 font-medium">
                {locale === "bn" ? "ব্যাংক রেফারেন্স:" : "Bank Ref:"} <span className="font-mono">{receipt.referenceNo || (locale === "bn" ? "কাউন্টার ক্যাশ ডেস্ক" : "Cash Desk Counter")}</span>
              </p>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="mt-6 text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                  <th className="py-2">{locale === "bn" ? "সেবার বিবরণ" : "Description of Services"}</th>
                  <th className="py-2 text-right">{locale === "bn" ? "ডেবিট ব্যালেন্স" : "Debit Balance"}</th>
                  <th className="py-2 text-right">{locale === "bn" ? "ক্রেডিট পরিমাণ" : "Credit Amount"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr className="font-medium text-slate-700 dark:text-slate-300">
                  <td className="py-3">
                    {invoice ? invoice.description : (locale === "bn" ? "সৌদি আরব নিয়োগ প্যাকেজ কিস্তি পেমেন্ট" : "KSA Recruitment Package Installment payment")}
                  </td>
                  <td className="py-3 text-right text-slate-500 font-semibold">
                    {invoice ? formatCurrency(invoice.amount, "BDT", locale) : "-"}
                  </td>
                  <td className="py-3 text-right text-emerald-600 font-bold">
                    {formatCurrency(receipt.amountPaid, "BDT", locale)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="mt-8 flex flex-col items-end gap-2 border-t border-slate-200 pt-6 text-xs dark:border-slate-800">
            <div className="flex w-64 justify-between text-slate-500 font-medium">
              <span>{locale === "bn" ? "মোট প্রাপ্ত পরিমাণ:" : "Total Received Amount:"}</span>
              <span className="font-bold text-slate-800 dark:text-white">
                {formatCurrency(receipt.amountPaid, "BDT", locale)}
              </span>
            </div>
            {invoice && (
              <div className="flex w-64 justify-between text-slate-500 font-medium">
                <span>{locale === "bn" ? "বকেয়া পাওনা:" : "Remaining Account Dues:"}</span>
                <span className="font-bold text-rose-600">
                  {formatCurrency(invoice.outstanding, "BDT", locale)}
                </span>
              </div>
            )}
            <div className="mt-4 flex items-center gap-1 text-[9px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded">
              <ShieldCheck className="h-3.5 w-3.5" /> {locale === "bn" ? "রেকর্ড করেছেন:" : "Certified Recorded by:"} {receipt.receivedBy}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ReceiptPreview;
