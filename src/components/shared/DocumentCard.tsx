// src/components/shared/DocumentCard.tsx
// Renders an individual document file card, allowing secure streams and status changes with audit feedback

"use client";

import React from "react";
import { MockDocument } from "@/lib/mockData";
import { StatusBadge } from "../ui/StatusBadge";
import { FileText, ShieldCheck, CheckCircle, XCircle, Download } from "lucide-react";

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
  
  // Triggers secure audit verification with comments prompted from user
  const handleVerifyClick = (status: "VERIFIED" | "REJECTED") => {
    if (!onVerify) return;
    const textPrompt = `Enter optional audit remarks for marking this file as ${status === "VERIFIED" ? "Approved" : "Rejected"}:`;
    const remarks = window.prompt(textPrompt);
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

  return (
    <div
      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
          <FileText className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              {document.documentType.replace("_", " ")}
            </span>
            <StatusBadge status={document.status} className="text-[9px] px-2 py-0" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium break-all flex items-center gap-1.5">
            <span>{document.fileName}</span>
            {onDownload && (
              <button
                onClick={handleDownloadClick}
                title="Download Sourced Document"
                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-semibold cursor-pointer underline flex items-center"
              >
                (download)
              </button>
            )}
          </p>

          {document.verifiedBy ? (
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" /> Checked by {document.verifiedBy}
            </div>
          ) : (
            <div className="text-[10px] text-slate-400">Not verified yet</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t border-slate-50 pt-3 sm:border-t-0 sm:pt-0 dark:border-slate-800">
        {canVerify && document.status !== "VERIFIED" && onVerify && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleVerifyClick("VERIFIED")}
              className="flex items-center gap-1 rounded bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 cursor-pointer"
            >
              <CheckCircle className="h-3.5 w-3.5" /> Approve
            </button>
            <button
              onClick={() => handleVerifyClick("REJECTED")}
              className="flex items-center gap-1 rounded bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400 cursor-pointer"
            >
              <XCircle className="h-3.5 w-3.5" /> Reject
            </button>
          </div>
        )}

        {document.status === "VERIFIED" && (
          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50/50 px-2 py-0.5 rounded border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30">
            Locked
          </span>
        )}

        {onDownload && (
          <button
            onClick={handleDownloadClick}
            title="Download secure stream"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default DocumentCard;
