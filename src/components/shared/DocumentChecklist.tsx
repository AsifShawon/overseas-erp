// src/components/shared/DocumentChecklist.tsx
// Interactive compliance file checklist panel supporting real file uploads and audits

"use client";

import React, { useState } from "react";
import { MockDocument } from "@/lib/mockData";
import { useMockAuth } from "@/context/MockAuthContext";
import { FileUp, XCircle, CheckCircle, Loader2 } from "lucide-react";
import { DocumentCard } from "./DocumentCard";

interface DocumentChecklistProps {
  documents: MockDocument[];
  onUpload?: (docType: string, file: File, expiryDate?: string, remarks?: string) => Promise<void>;
  onVerify?: (docId: string, status: "VERIFIED" | "REJECTED", remarks?: string) => Promise<void>;
  onDownload?: (docId: string, fileName: string) => void;
}

export function DocumentChecklist({ documents, onUpload, onVerify, onDownload }: DocumentChecklistProps) {
  const { user } = useMockAuth();
  
  // Local form states
  const [selectedDocType, setSelectedDocType] = useState("PASSPORT");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState("");
  const [remarks, setRemarks] = useState("");

  // Loading & feedback states
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);

  // client-side validation thresholds
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLocalSuccess(null);

    if (!selectedFile) {
      setLocalError("Please select a file to upload.");
      return;
    }

    // Client-side file size guard
    if (selectedFile.size > MAX_FILE_SIZE) {
      setLocalError("File is too large. Max allowed file size is 5MB.");
      return;
    }

    // Client-side MIME-type guard
    if (!ALLOWED_MIME_TYPES.includes(selectedFile.type)) {
      setLocalError("Unsupported file type. Only PDF, JPEG, and PNG files are allowed.");
      return;
    }

    if (onUpload) {
      try {
        setUploading(true);
        await onUpload(selectedDocType, selectedFile, expiryDate || undefined, remarks || undefined);
        setLocalSuccess("File successfully uploaded and saved to secure storage.");
        // Reset form inputs on successful upload
        setSelectedFile(null);
        setExpiryDate("");
        setRemarks("");
        // Clear file input element
        const fileInput = document.getElementById("document-file-input") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } catch (err: any) {
        setLocalError(err.message || "An unexpected error occurred during document upload.");
      } finally {
        setUploading(false);
      }
    }
  };

  // Roles permitted to verify documents
  const canVerify = ["Super Admin", "Operations Admin", "Documentation Officer"].includes(user.roleName);

  return (
    <div className="space-y-6">
      {/* Real Document Upload Panel */}
      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Upload Compliance Document
        </h3>
        
        <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. Document Type */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400">Document Type</label>
              <select
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
                disabled={uploading}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
              >
                <option value="PASSPORT">Passport Scan</option>
                <option value="PHOTO">Applicant Passport Photo</option>
                <option value="CV">Curriculum Vitae (CV)</option>
                <option value="MEDICAL_REPORT">Medical Fitness Report</option>
                <option value="POLICE_CLEARANCE">Police Clearance Card</option>
                <option value="VISA_STICKER">Embassy Visa Sticker</option>
                <option value="AIR_TICKET">Airline Flight Ticket</option>
                <option value="OTHER">Other Attestation Document</option>
              </select>
            </div>

            {/* 2. File Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400">Select File (PDF, JPG, PNG - Max 5MB)</label>
              <input
                id="document-file-input"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                disabled={uploading}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1 px-3 text-xs outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 file:mr-3 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950 dark:file:text-indigo-400 cursor-pointer"
              />
            </div>

            {/* 3. Optional Expiry Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400">Expiry Date (Optional)</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                disabled={uploading}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
              />
            </div>

            {/* 4. Optional Remarks */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400">Remarks / Notes (Optional)</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Certified copy of passport page"
                disabled={uploading}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-50 pt-3 dark:border-slate-800">
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-5 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-40 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200 shadow-sm"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading Sourced File...
                </>
              ) : (
                <>
                  <FileUp className="h-4 w-4" /> Upload Document
                </>
              )}
            </button>
          </div>
        </form>

        {/* Dynamic Alerts */}
        {localError && (
          <div className="mt-4 p-3 rounded-lg border border-rose-100 bg-rose-50 text-xs text-rose-700 font-medium dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 flex items-center gap-2 animate-in fade-in duration-200">
            <XCircle className="h-4 w-4 shrink-0" />
            <span>{localError}</span>
          </div>
        )}

        {localSuccess && (
          <div className="mt-4 p-3 rounded-lg border border-emerald-100 bg-emerald-50 text-xs text-emerald-700 font-medium dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{localSuccess}</span>
          </div>
        )}
      </div>

      {/* Document Registry Checklist Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Compliance Attestation Dossiers
        </h3>
        
        {documents.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/30 text-slate-400 dark:border-slate-800">
            No attestation documents listed.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                canVerify={canVerify}
                onVerify={onVerify}
                onDownload={onDownload}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
