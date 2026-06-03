// src/components/shared/DocumentCard.tsx
// Renders an individual document file card, allowing secure streams and status changes with audit feedback

"use client";

import React from "react";
import { MockDocument } from "@/lib/mockData";
import { StatusBadge } from "../ui/StatusBadge";
import { FileText, ShieldCheck, CheckCircle, XCircle, Download } from "lucide-react";
import { useDialog } from "@/context/DialogContext";
import { useT } from "@/i18n/useT";
import { DOCUMENT_TYPE_LABELS } from "./DocumentChecklist";

interface DocumentCardProps {
  document: MockDocument;
  canVerify?: boolean;
  onVerify?: (docId: string, status: "VERIFIED" | "REJECTED", remarks?: string) => void;
  onDownload?: (docId: string, fileName: string) => void;
  className?: string;
}

export function DocumentCard({
  document,
  canVerify = false,
  onVerify,
  onDownload,
  className = "",
}: DocumentCardProps) {
  
  const { prompt } = useDialog();
  const { t, locale } = useT();

  // Triggers secure audit verification with comments prompted from user
  const handleVerifyClick = async (status: "VERIFIED" | "REJECTED") => {
    if (!onVerify) return;
    
    const textPrompt = locale === "bn" 
      ? `এই ফাইলটি ${status === "VERIFIED" ? "অনুমোদিত" : "প্রত্যাখ্যাত"} হিসেবে চিহ্নিত করার জন্য ঐচ্ছিক অডিট মন্তব্য লিখুন:` 
      : `Enter optional audit remarks for marking this file as ${status === "VERIFIED" ? "Approved" : "Rejected"}:`;
      
    const remarks = await prompt({
      title: locale === "bn" 
        ? `${status === "VERIFIED" ? "ডকুমেন্ট অনুমোদন" : "ডকুমেন্ট প্রত্যাখ্যান"} করুন` 
        : `${status === "VERIFIED" ? "Approve" : "Reject"} Document`,
      description: textPrompt,
      placeholder: locale === "bn" ? "মন্তব্য লিখুন..." : "Remarks...",
      confirmLabel: locale === "bn" 
        ? (status === "VERIFIED" ? "অনুমোদন করুন" : "প্রত্যাখ্যান করুন") 
        : (status === "VERIFIED" ? "Approve" : "Reject"),
      isDanger: status === "REJECTED",
    });
    
    if (remarks !== null) {
      onVerify(document.id, status, remarks || undefined);
    }
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onDownload) {
      onDownload(document.id, document.fileName);
    }
  };

  const getDocTypeLabel = () => {
    const labels = DOCUMENT_TYPE_LABELS[locale];
    if (labels && document.documentType in labels) {
      return labels[document.documentType];
    }
    return document.documentType.replace("_", " ");
  };

  return (
    <div
      className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-border-theme bg-surface p-5 md:p-6 shadow-sm transition-all duration-300 hover:shadow-md ${className}`}
    >
      <div className="flex items-start md:items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-theme">
          <FileText className="h-6 w-6" />
        </div>
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] md:text-[15px] font-bold text-text-theme tracking-wide leading-relaxed">
              {getDocTypeLabel()}
            </span>
            <StatusBadge status={document.status} className="text-xs md:text-sm px-2.5 py-0.5" />
          </div>
          <p className="text-[13px] md:text-[14px] text-text-muted font-medium break-all flex flex-wrap items-center gap-2 whitespace-normal leading-relaxed">
            <span className="break-all">{document.fileName}</span>
            {onDownload && (
              <button
                onClick={handleDownloadClick}
                title={locale === "bn" ? "ডকুমেন্ট ডাউনলোড করুন" : "Download Sourced Document"}
                className="text-primary-theme hover:text-primary-hover font-bold cursor-pointer underline inline-flex items-center text-xs md:text-sm"
              >
                {locale === "bn" ? "(ডাউনলোড)" : "(download)"}
              </button>
            )}
          </p>

          {document.verifiedBy ? (
            <div className="flex items-center gap-1.5 text-xs md:text-sm text-success-theme font-bold leading-relaxed mt-1">
              <ShieldCheck className="h-4.5 w-4.5" /> {locale === "bn" ? `${document.verifiedBy} দ্বারা যাচাইকৃত` : `Checked by ${document.verifiedBy}`}
            </div>
          ) : (
            <div className="text-xs md:text-sm text-text-soft leading-relaxed mt-1">{locale === "bn" ? "এখনো যাচাই করা হয়নি" : "Not verified yet"}</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t border-border-theme pt-4 md:border-t-0 md:pt-0 shrink-0">
        {canVerify && document.status !== "VERIFIED" && onVerify && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleVerifyClick("VERIFIED")}
              className="flex items-center gap-1.5 rounded-lg bg-success-soft px-3 py-1.5 text-xs md:text-sm font-bold text-success-theme hover:opacity-90 cursor-pointer"
            >
              <CheckCircle className="h-4 w-4" /> {locale === "bn" ? "অনুমোদন" : "Approve"}
            </button>
            <button
              onClick={() => handleVerifyClick("REJECTED")}
              className="flex items-center gap-1.5 rounded-lg bg-danger-soft px-3 py-1.5 text-xs md:text-sm font-bold text-danger-theme hover:opacity-90 cursor-pointer"
            >
              <XCircle className="h-4 w-4" /> {locale === "bn" ? "প্রত্যাখ্যান" : "Reject"}
            </button>
          </div>
        )}

        {document.status === "VERIFIED" && (
          <span className="text-xs md:text-sm text-success-theme font-bold uppercase tracking-wider bg-success-soft px-3 py-1 rounded-lg border border-success-theme">
            {locale === "bn" ? "লকড" : "Locked"}
          </span>
        )}

        {onDownload && (
          <button
            onClick={handleDownloadClick}
            title={locale === "bn" ? "সুরক্ষিত ডাউনলোড" : "Download secure stream"}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-theme bg-bg text-text-soft hover:bg-bg-muted hover:text-text-theme cursor-pointer"
          >
            <Download className="h-4.5 w-4.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default DocumentCard;
