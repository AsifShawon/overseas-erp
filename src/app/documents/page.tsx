"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/ui/StatCard";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { MOCK_APPLICANTS, MockDocument } from "@/lib/mockData";
import { CheckCircle, XCircle, ShieldCheck } from "lucide-react";

interface FlattenedDoc extends MockDocument {
  applicantId: string;
  applicantName: string;
  passportNumber: string;
  trade: string;
}

export default function DocumentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Flatten all documents across all applicants
  const allDocs: FlattenedDoc[] = MOCK_APPLICANTS.flatMap((app) =>
    app.documents.map((doc) => ({
      ...doc,
      applicantId: app.id,
      applicantName: app.fullName,
      passportNumber: app.passportNumber,
      trade: app.trade,
    }))
  );

  const [docsList, setDocsList] = useState<FlattenedDoc[]>(allDocs);

  const filteredDocs = docsList.filter((doc) => {
    if (statusFilter !== "ALL" && doc.status !== statusFilter) return false;
    return true;
  });

  const handleVerify = (docId: string, status: "VERIFIED" | "REJECTED") => {
    const updated = docsList.map((doc) => {
      if (doc.id === docId) {
        return {
          ...doc,
          status,
          verifiedBy: status === "VERIFIED" ? "Lawrence Wilde (Staff)" : undefined,
        };
      }
      return doc;
    });
    setDocsList(updated);
  };

  // Vetting metrics
  const totalFiles = docsList.length;
  const pendingVetting = docsList.filter((d) => d.status === "PENDING_VERIFICATION").length;
  const verifiedFiles = docsList.filter((d) => d.status === "VERIFIED").length;
  const rejectedFiles = docsList.filter((d) => d.status === "REJECTED").length;

  const tableColumns = [
    {
      header: "Billed Candidate",
      accessor: (doc: FlattenedDoc) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-slate-900 dark:text-white">{doc.applicantName}</span>
          <span className="text-[10px] text-slate-400">Passport: {doc.passportNumber} • Trade: {doc.trade}</span>
        </div>
      ),
    },
    {
      header: "Document Registry Type",
      accessor: (doc: FlattenedDoc) => (
        <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
          {doc.documentType}
        </span>
      ),
    },
    { header: "Attestation File Name", accessor: (doc: FlattenedDoc) => doc.fileName },
    {
      header: "Verification Status",
      accessor: (doc: FlattenedDoc) => <StatusBadge status={doc.status} />,
    },
    {
      header: "Auditing Inspector",
      accessor: (doc: FlattenedDoc) =>
        doc.verifiedBy ? (
          <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" /> {doc.verifiedBy}
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">Awaiting Vetting Audits</span>
        ),
    },
    {
      header: "Vetting Audits",
      accessor: (doc: FlattenedDoc) => (
        <div className="flex items-center justify-end gap-2">
          {doc.status !== "VERIFIED" && (
            <>
              <button
                onClick={() => handleVerify(doc.id, "VERIFIED")}
                className="flex items-center gap-0.5 rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20"
              >
                <CheckCircle className="h-3 w-3 shrink-0" /> Approve
              </button>
              <button
                onClick={() => handleVerify(doc.id, "REJECTED")}
                className="flex items-center gap-0.5 rounded bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/20"
              >
                <XCircle className="h-3 w-3 shrink-0" /> Reject
              </button>
            </>
          )}
          {doc.status === "VERIFIED" && (
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">Vetted & Locked</span>
          )}
        </div>
      ),
      cellClassName: "text-right",
    },
  ];

  return (
    <div className="space-y-6">
      <PermissionGate permission="UPLOAD_DOCUMENT" showFallback={true}>
        <PageHeader
          title="Compliance Documents Auditing"
          description="Vetting files catalog. Review and audit police clearances, medical reports, and consulate visa stamps."
          breadcrumbs={[{ label: "ERP Hub", href: "/dashboard" }, { label: "Documents" }]}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Uploaded Dossiers"
            value={totalFiles}
            description="Across all sourced candidates"
            iconName="FileText"
          />
          <StatCard
            title="Awaiting Vetting review"
            value={pendingVetting}
            description="Required seal & passport audits"
            iconName="FileSearch"
            trend={{ value: "22%", isPositive: false }}
          />
          <StatCard
            title="Passed & Approved"
            value={verifiedFiles}
            description="Compliance criteria satisfied"
            iconName="ShieldCheck"
          />
          <StatCard
            title="Rejected (Re-uploads)"
            value={rejectedFiles}
            description="Fails biometric or scanner checks"
            iconName="XCircle"
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mr-2">
            <span>Vetting Status Filter:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {["ALL", "PENDING_VERIFICATION", "VERIFIED", "REJECTED", "PENDING_UPLOAD"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${
                  statusFilter === status
                    ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
                }`}
              >
                {status === "ALL" ? "All Dossiers" : status.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Unified Dossier Audits */}
        <DataTable
          data={filteredDocs}
          columns={tableColumns}
          searchPlaceholder="Search by Candidate Name..."
          searchField="applicantName"
          emptyStateTitle="No compliance dossiers match this selection"
        />
      </PermissionGate>
    </div>
  );
}
