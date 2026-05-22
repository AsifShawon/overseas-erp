// src/components/shared/DocumentCard.tsx
// Renders an individual document file card, allowing secure streams and status changes with audit feedback

"use client";

import React from "react";
import { MockDocument } from "@/lib/mockData";
import { StatusBadge } from "../ui/StatusBadge";
import { FileText, ShieldCheck, CheckCircle, XCircle, Download } from "lucide-react";
import { useDialog } from "@/context/DialogContext";

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

  // Triggers secure audit verification with comments prompted from user
  const handleVerifyClick = async (status: "VERIFIED" | "REJECTED") => {
    if (!onVerify) return;
    const textPrompt = `Enter optional audit remarks for marking this file as ${status === "VERIFIED" ? "Approved" : "Rejected"}:`;
    const remarks = await prompt({
      title: `${status === "VERIFIED" ? "Approve" : "Reject"} Document`,
      description: textPrompt,
      placeholder: "Remarks...",
      confirmLabel: status === "VERIFIED" ? "Approve" : "Reject",
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

  return (
    <div
      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-border-theme bg-surface p-4 shadow-sm transition-all duration-300 hover:shadow-md ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-theme">
          <FileText className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-theme uppercase tracking-wider">
              {document.documentType.replace("_", " ")}
            </span>
            <StatusBadge status={document.status} className="text-[9px] px-2 py-0" />
          </div>
          <p className="text-xs text-text-muted font-medium break-all flex items-center gap-1.5">
            <span>{document.fileName}</span>
            {onDownload && (
              <button
                onClick={handleDownloadClick}
                title="Download Sourced Document"
                className="text-primary-theme hover:text-primary-hover font-semibold cursor-pointer underline flex items-center"
              >
                (download)
              </button>
            )}
          </p>

          {document.verifiedBy ? (
            <div className="flex items-center gap-1 text-[10px] text-success-theme font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" /> Checked by {document.verifiedBy}
            </div>
          ) : (
            <div className="text-[10px] text-text-soft">Not verified yet</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t border-border-theme pt-3 sm:border-t-0 sm:pt-0">
        {canVerify && document.status !== "VERIFIED" && onVerify && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleVerifyClick("VERIFIED")}
              className="flex items-center gap-1 rounded bg-success-soft px-2.5 py-1 text-[10px] font-bold text-success-theme hover:opacity-90 cursor-pointer"
            >
              <CheckCircle className="h-3.5 w-3.5" /> Approve
            </button>
            <button
              onClick={() => handleVerifyClick("REJECTED")}
              className="flex items-center gap-1 rounded bg-danger-soft px-2.5 py-1 text-[10px] font-bold text-danger-theme hover:opacity-90 cursor-pointer"
            >
              <XCircle className="h-3.5 w-3.5" /> Reject
            </button>
          </div>
        )}

        {document.status === "VERIFIED" && (
          <span className="text-[10px] text-success-theme font-bold uppercase tracking-wider bg-success-soft px-2 py-0.5 rounded border border-success-theme">
            Locked
          </span>
        )}

        {onDownload && (
          <button
            onClick={handleDownloadClick}
            title="Download secure stream"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-theme bg-bg text-text-soft hover:bg-bg-muted hover:text-text-theme cursor-pointer"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default DocumentCard;
