// src/components/shared/DocumentChecklist.tsx
// Interactive compliance file checklist panel supporting real file uploads and audits

"use client";

import React, { useState } from "react";
import { MockDocument } from "@/lib/mockData";
import { useMockAuth } from "@/context/MockAuthContext";
import { FileUp, XCircle, CheckCircle, Loader2 } from "lucide-react";
import { DocumentCard } from "./DocumentCard";
import { useT } from "@/i18n/useT";

interface DocumentChecklistProps {
  documents: MockDocument[];
  onUpload?: (docType: string, file: File, expiryDate?: string, remarks?: string) => Promise<void>;
  onVerify?: (docId: string, status: "VERIFIED" | "REJECTED", remarks?: string) => Promise<void>;
  onDownload?: (docId: string, fileName: string) => void;
}

export const DOCUMENT_TYPE_LABELS: Record<string, Record<string, string>> = {
  bn: {
    PASSPORT: "পাসপোর্ট স্ক্যান (Passport Scan)",
    PHOTO: "আবেদনকারীর পাসপোর্ট ছবি (Passport Photo)",
    CV: "জীবনবৃত্তান্ত (CV)",
    MEDICAL_REPORT: "মেডিকেল ফিটনেস রিপোর্ট (Medical Report)",
    POLICE_CLEARANCE: "পুলিশ ক্লিয়ারেন্স কার্ড (Police Clearance)",
    VISA_STICKER: "দূতাবাস ভিসা স্টিকার (Visa Sticker)",
    AIR_TICKET: "বিমান টিকিট (Air Ticket)",
    OTHER: "অন্যান্য প্রশংসাপত্র/দলিল (Other Document)",
  },
  en: {
    PASSPORT: "Passport Scan",
    PHOTO: "Applicant Passport Photo",
    CV: "Curriculum Vitae (CV)",
    MEDICAL_REPORT: "Medical Fitness Report",
    POLICE_CLEARANCE: "Police Clearance Card",
    VISA_STICKER: "Embassy Visa Sticker",
    AIR_TICKET: "Airline Flight Ticket",
    OTHER: "Other Attestation Document",
  }
};

export function DocumentChecklist({ documents, onUpload, onVerify, onDownload }: DocumentChecklistProps) {
  const { user } = useMockAuth();
  const { t, locale } = useT();
  
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
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLocalSuccess(null);

    if (!selectedFile) {
      setLocalError(locale === "bn" ? "অনুগ্রহ করে আপলোড করার জন্য একটি ফাইল নির্বাচন করুন।" : "Please select a file to upload.");
      return;
    }

    // Client-side file size guard
    if (selectedFile.size > MAX_FILE_SIZE) {
      setLocalError(locale === "bn" ? "ফাইলটি অনেক বড়। সর্বোচ্চ ফাইল সাইজ ১০ মেগাবাইট (10MB)।" : "File is too large. Max allowed file size is 10MB.");
      return;
    }

    // Client-side MIME-type guard
    if (!ALLOWED_MIME_TYPES.includes(selectedFile.type)) {
      setLocalError(locale === "bn" ? "অসমর্থিত ফাইল টাইপ। শুধুমাত্র PDF, JPEG, PNG, এবং WEBP ফাইল আপলোড করা যাবে।" : "Unsupported file type. Only PDF, JPEG, PNG, and WEBP files are allowed.");
      return;
    }

    if (onUpload) {
      try {
        setUploading(true);
        await onUpload(selectedDocType, selectedFile, expiryDate || undefined, remarks || undefined);
        setLocalSuccess(locale === "bn" ? "ফাইলটি সফলভাবে আপলোড এবং সুরক্ষিত স্টোরেজে সংরক্ষণ করা হয়েছে।" : "File successfully uploaded and saved to secure storage.");
        // Reset form inputs on successful upload
        setSelectedFile(null);
        setExpiryDate("");
        setRemarks("");
        // Clear file input element
        const fileInput = document.getElementById("document-file-input") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } catch (err: unknown) {
        const fallbackMessage =
          locale === "bn"
            ? "ডকুমেন্ট আপলোড করার সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।"
            : "An unexpected error occurred during document upload.";
        setLocalError(err instanceof Error ? err.message : fallbackMessage);
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
      <div className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h3 className="text-[17px] font-bold text-slate-800 dark:text-slate-200 leading-normal">
          {locale === "bn" ? "কমপ্লায়েন্স ডকুমেন্ট আপলোড করুন" : "Upload Compliance Document"}
        </h3>
        
        <form onSubmit={handleUploadSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. Document Type */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-theme leading-relaxed">
                {t("applicantDetail.documentType")}
              </label>
              <select
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
                disabled={uploading}
                className="w-full rounded-xl border border-border-theme bg-slate-50 py-3 px-4 text-[15px] leading-relaxed outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 text-text-theme"
              >
                <option value="PASSPORT">{DOCUMENT_TYPE_LABELS[locale].PASSPORT}</option>
                <option value="PHOTO">{DOCUMENT_TYPE_LABELS[locale].PHOTO}</option>
                <option value="CV">{DOCUMENT_TYPE_LABELS[locale].CV}</option>
                <option value="MEDICAL_REPORT">{DOCUMENT_TYPE_LABELS[locale].MEDICAL_REPORT}</option>
                <option value="POLICE_CLEARANCE">{DOCUMENT_TYPE_LABELS[locale].POLICE_CLEARANCE}</option>
                <option value="VISA_STICKER">{DOCUMENT_TYPE_LABELS[locale].VISA_STICKER}</option>
                <option value="AIR_TICKET">{DOCUMENT_TYPE_LABELS[locale].AIR_TICKET}</option>
                <option value="OTHER">{DOCUMENT_TYPE_LABELS[locale].OTHER}</option>
              </select>
            </div>

            {/* 2. File Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-theme leading-relaxed">
                {locale === "bn" ? "ফাইল নির্বাচন করুন" : "Select File"}
              </label>
              <input
                id="document-file-input"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                disabled={uploading}
                className="w-full rounded-xl border border-border-theme bg-slate-50 py-2.5 px-4 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs md:file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950 dark:file:text-indigo-400 cursor-pointer text-text-theme"
              />
              <p className="text-[11px] text-slate-400/80 dark:text-slate-500/80 font-medium">
                {locale === "bn" ? "অনুমোদিত ফাইল: PDF, JPG, PNG, WEBP" : "Permitted: PDF, JPG, PNG, WEBP"}
              </p>
            </div>

            {/* 3. Optional Expiry Date */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-theme leading-relaxed">
                {t("applicantDetail.expiryDate")}
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                disabled={uploading}
                className="w-full rounded-xl border border-border-theme bg-slate-50 py-3 px-4 text-[15px] leading-relaxed outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 text-text-theme"
              />
            </div>

            {/* 4. Optional Remarks */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-theme leading-relaxed">
                {locale === "bn" ? "মন্তব্য / নোট (ঐচ্ছিক)" : "Remarks / Notes (Optional)"}
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={locale === "bn" ? "যেমন: পাসপোর্টের সত্যায়িত কপি" : "e.g. Certified copy of passport page"}
                disabled={uploading}
                className="w-full rounded-xl border border-border-theme bg-slate-50 py-3 px-4 text-[15px] leading-relaxed outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 text-text-theme"
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-50 pt-4 dark:border-slate-800">
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-[15px] font-bold text-white transition hover:bg-slate-800 disabled:opacity-40 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200 shadow-sm cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" /> {locale === "bn" ? "ফাইল আপলোড হচ্ছে..." : "Uploading Sourced File..."}
                </>
              ) : (
                <>
                  <FileUp className="h-4.5 w-4.5" /> {locale === "bn" ? "ডকুমেন্ট আপলোড করুন" : "Upload Document"}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Dynamic Alerts */}
        {localError && (
          <div className="mt-4 p-4 rounded-xl border border-rose-100 bg-rose-50 text-sm text-rose-700 font-semibold dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 flex items-center gap-2 animate-in fade-in duration-200">
            <XCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{localError}</span>
          </div>
        )}

        {localSuccess && (
          <div className="mt-4 p-4 rounded-xl border border-emerald-100 bg-emerald-50 text-sm text-emerald-700 font-semibold dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{localSuccess}</span>
          </div>
        )}
      </div>

      {/* Document Registry Checklist Grid */}
      <div className="space-y-4">
        <h3 className="text-sm md:text-base font-bold text-slate-400 uppercase tracking-wider">
          {locale === "bn" ? "কমপ্লায়েন্স সত্যায়ন ডসিয়ার" : "Compliance Attestation Dossiers"}
        </h3>
        
        {documents.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/30 text-slate-400 dark:border-slate-800 text-sm">
            {t("applicantDetail.noDocuments")}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
