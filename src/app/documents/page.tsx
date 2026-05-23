"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/ui/StatCard";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { MOCK_APPLICANTS, MockDocument } from "@/lib/mockData";
import { CheckCircle, XCircle, ShieldCheck } from "lucide-react";
import { useT } from "@/i18n/useT";
import { DOCUMENT_TYPE_LABELS } from "@/components/shared/DocumentChecklist";

interface FlattenedDoc extends MockDocument {
  applicantId: string;
  applicantName: string;
  passportNumber: string;
  trade: string;
}

export default function DocumentsPage() {
  const { t, locale } = useT();
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
      header: locale === "bn" ? "আবেদনকারী প্রার্থী" : "Billed Candidate",
      accessor: (doc: FlattenedDoc) => (
        <div className="flex flex-col gap-0.5 text-text-theme">
          <span className="font-semibold text-slate-900 dark:text-white">{doc.applicantName}</span>
          <span className="text-[10px] text-slate-400">
            {locale === "bn" ? "পাসপোর্ট" : "Passport"}: {doc.passportNumber} • {locale === "bn" ? "পেশা" : "Trade"}: {doc.trade}
          </span>
        </div>
      ),
    },
    {
      header: t("documents.tableHeaderType"),
      accessor: (doc: FlattenedDoc) => {
        const labels = DOCUMENT_TYPE_LABELS[locale];
        return (
          <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
            {labels && doc.documentType in labels ? labels[doc.documentType] : doc.documentType.replace("_", " ")}
          </span>
        );
      },
    },
    { header: t("documents.tableHeaderFile"), accessor: (doc: FlattenedDoc) => doc.fileName },
    {
      header: t("documents.tableHeaderStatus"),
      accessor: (doc: FlattenedDoc) => <StatusBadge status={doc.status} />,
    },
    {
      header: t("documents.tableHeaderVerifiedBy"),
      accessor: (doc: FlattenedDoc) =>
        doc.verifiedBy ? (
          <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold font-sans">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            {doc.verifiedBy === "Lawrence Wilde (Staff)" && locale === "bn" ? "লরেন্স ওয়াইল্ড (স্টাফ)" : doc.verifiedBy}
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">{locale === "bn" ? "যাচাইকরণের অপেক্ষায়" : "Awaiting Vetting Audits"}</span>
        ),
    },
    {
      header: locale === "bn" ? "অডিট অ্যাকশন" : "Vetting Audits",
      accessor: (doc: FlattenedDoc) => (
        <div className="flex items-center justify-end gap-2">
          {doc.status !== "VERIFIED" && (
            <>
              <button
                onClick={() => handleVerify(doc.id, "VERIFIED")}
                className="flex items-center gap-0.5 rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20 cursor-pointer"
              >
                <CheckCircle className="h-3 w-3 shrink-0" /> {locale === "bn" ? "অনুমোদন" : "Approve"}
              </button>
              <button
                onClick={() => handleVerify(doc.id, "REJECTED")}
                className="flex items-center gap-0.5 rounded bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/20 cursor-pointer"
              >
                <XCircle className="h-3 w-3 shrink-0" /> {locale === "bn" ? "প্রত্যাখ্যান" : "Reject"}
              </button>
            </>
          )}
          {doc.status === "VERIFIED" && (
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
              {locale === "bn" ? "অনুমোদিত ও লকড" : "Vetted & Locked"}
            </span>
          )}
        </div>
      ),
      cellClassName: "text-right",
    },
  ];

  const getStatusLabel = (status: string) => {
    if (status === "ALL") return locale === "bn" ? "সকল ডসিয়ার" : "All Dossiers";
    return t(`statuses.${status}`);
  };

  return (
    <div className="space-y-6">
      <PermissionGate permission="UPLOAD_DOCUMENT" showFallback={true}>
        <PageHeader
          title={t("documents.pageTitle")}
          description={t("documents.pageDesc")}
          breadcrumbs={[
            { label: locale === "bn" ? "ড্যাশবোর্ড" : "ERP Hub", href: "/dashboard" },
            { label: locale === "bn" ? "ডকুমেন্ট রেজিস্টার" : "Documents" }
          ]}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={locale === "bn" ? "মোট আপলোডকৃত ডসিয়ার" : "Total Uploaded Dossiers"}
            value={totalFiles}
            description={locale === "bn" ? "সকল সোর্সকৃত প্রার্থীর নথি" : "Across all sourced candidates"}
            iconName="FileText"
          />
          <StatCard
            title={locale === "bn" ? "যাচাইকরণের অপেক্ষায়" : "Awaiting Vetting review"}
            value={pendingVetting}
            description={locale === "bn" ? "ভিসা ও পুলিশ ক্লিয়ারেন্স অডিট" : "Required seal & passport audits"}
            iconName="FileSearch"
          />
          <StatCard
            title={locale === "bn" ? "অনুমোদিত ও সফল" : "Passed & Approved"}
            value={verifiedFiles}
            description={locale === "bn" ? "সকল কমপ্লায়েন্স যোগ্যতা পূরণ" : "Compliance criteria satisfied"}
            iconName="ShieldCheck"
          />
          <StatCard
            title={locale === "bn" ? "প্রত্যাখ্যাত নথি" : "Rejected (Re-uploads)"}
            value={rejectedFiles}
            description={locale === "bn" ? "সঠিক ও স্পষ্ট ফাইল আপলোড করুন" : "Fails biometric or scanner checks"}
            iconName="XCircle"
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center dark:border-slate-200/5 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mr-2">
            <span>{locale === "bn" ? "অডিট স্ট্যাটাস ফিল্টার:" : "Vetting Status Filter:"}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {["ALL", "PENDING_VERIFICATION", "VERIFIED", "REJECTED", "PENDING_UPLOAD"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                  statusFilter === status
                    ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
                }`}
              >
                {getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        {/* Unified Dossier Audits */}
        <DataTable
          data={filteredDocs}
          columns={tableColumns}
          searchPlaceholder={t("documents.searchPlaceholder")}
          searchField="applicantName"
          emptyStateTitle={locale === "bn" ? "এই ফিল্টারে কোনো কমপ্লায়েন্স নথি পাওয়া যায়নি" : "No compliance dossiers match this selection"}
        />
      </PermissionGate>
    </div>
  );
}

