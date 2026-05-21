"use client";

import React, { useState } from "react";
import { MockDocument } from "@/lib/mockData";
import { useMockAuth } from "@/context/MockAuthContext";
import { FileUp } from "lucide-react";
import { DocumentCard } from "./DocumentCard";

interface DocumentChecklistProps {
  documents: MockDocument[];
  onUpload?: (docType: string, file: string) => void;
  onVerify?: (docId: string, status: "VERIFIED" | "REJECTED") => void;
}

export function DocumentChecklist({ documents, onUpload, onVerify }: DocumentChecklistProps) {
  const { user } = useMockAuth();
  const [selectedDocType, setSelectedDocType] = useState("PASSPORT");
  const [simulatedFileName, setSimulatedFileName] = useState("");

  const handleSimulateUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (simulatedFileName && onUpload) {
      onUpload(selectedDocType, simulatedFileName);
      setSimulatedFileName("");
    }
  };

  // Roles permitted to verify documents
  const canVerify = ["Super Admin", "Operations Admin", "Documentation Officer"].includes(user.roleName);

  return (
    <div className="space-y-6">
      {/* Upload Box (Visible to Applicants, Agents, or Staff) */}
      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Upload Document Simulator
        </h3>
        <form onSubmit={handleSimulateUpload} className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400">Document Type</label>
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
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

          <div className="flex-[2] space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400">Simulate File Selection</label>
            <input
              type="text"
              value={simulatedFileName}
              onChange={(e) => setSimulatedFileName(e.target.value)}
              placeholder="e.g. MyPassportScan_Verified.pdf"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={!simulatedFileName}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-40 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <FileUp className="h-4 w-4" /> Upload File
          </button>
        </form>
      </div>

      {/* Document Registry Checklist Card Grid */}
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
