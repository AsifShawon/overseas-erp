"use client";

import React, { useEffect, useEffectEvent, useState } from "react";
import { CheckCircle, ShieldCheck, XCircle } from "lucide-react";

import { DataTable } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { DOCUMENT_TYPE_LABELS } from "@/components/shared/DocumentChecklist";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useMockAuth } from "@/context/MockAuthContext";
import { useToast } from "@/context/ToastContext";
import { useT } from "@/i18n/useT";

type DocumentListItem = {
  id: string;
  applicantId: string;
  applicantName: string;
  documentType: string;
  fileName: string;
  status: string;
  expiryDate: string | null;
  storageProvider: string;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
  updatedAt: string;
  verifiedById: string | null;
  verifiedByName: string | null;
  downloadUrl: string;
};

export default function DocumentsPage() {
  const { accessToken, loading: authLoading } = useMockAuth();
  const toast = useToast();
  const { t, locale } = useT();

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [docsList, setDocsList] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useEffectEvent(async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/documents", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to load documents. HTTP ${res.status}`);
      }

      const data = await res.json();
      setDocsList(data.documents ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    if (authLoading || !accessToken) return;
    void loadDocuments();
  }, [accessToken, authLoading]);

  const handleVerify = async (docId: string, status: "VERIFIED" | "REJECTED") => {
    if (!accessToken) return;

    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to update document. HTTP ${res.status}`);
      }

      await loadDocuments();
      toast.success(
        status === "VERIFIED" ? t("applicantDetail.verifySuccess") : t("applicantDetail.rejectSuccess")
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update document status.");
    }
  };

  const handleDownload = async (docId: string, fileName: string) => {
    if (!accessToken) return;

    try {
      const res = await fetch(`/api/documents/${docId}/download`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to download file. HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to download document.");
    }
  };

  const filteredDocs = docsList.filter((doc) => {
    if (statusFilter !== "ALL" && doc.status !== statusFilter) return false;
    return true;
  });

  const totalFiles = docsList.length;
  const pendingVetting = docsList.filter((doc) => doc.status === "PENDING_VERIFICATION").length;
  const verifiedFiles = docsList.filter((doc) => doc.status === "VERIFIED").length;
  const rejectedFiles = docsList.filter((doc) => doc.status === "REJECTED").length;

  const tableColumns = [
    {
      header: locale === "bn" ? "আবেদনকারী প্রার্থী" : "Billed Candidate",
      accessor: (doc: DocumentListItem) => (
        <div className="flex flex-col gap-0.5 text-text-theme">
          <span className="font-semibold text-slate-900 dark:text-white">{doc.applicantName}</span>
          <span className="text-[10px] text-slate-400">{doc.applicantId}</span>
        </div>
      ),
    },
    {
      header: t("documents.tableHeaderType"),
      accessor: (doc: DocumentListItem) => {
        const labels = DOCUMENT_TYPE_LABELS[locale];
        return (
          <span className="font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200">
            {labels && doc.documentType in labels
              ? labels[doc.documentType]
              : doc.documentType.replace(/_/g, " ")}
          </span>
        );
      },
    },
    { header: t("documents.tableHeaderFile"), accessor: (doc: DocumentListItem) => doc.fileName },
    {
      header: t("documents.tableHeaderStatus"),
      accessor: (doc: DocumentListItem) => <StatusBadge status={doc.status} />,
    },
    {
      header: t("documents.tableHeaderVerifiedBy"),
      accessor: (doc: DocumentListItem) =>
        doc.verifiedByName ? (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            {doc.verifiedByName}
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">
            {locale === "bn" ? "যাচাইকরণের অপেক্ষায়" : "Awaiting Vetting Audits"}
          </span>
        ),
    },
    {
      header: locale === "bn" ? "অডিট অ্যাকশন" : "Vetting Audits",
      accessor: (doc: DocumentListItem) => (
        <div className="flex items-center justify-end gap-2">
          {doc.status !== "VERIFIED" && (
            <>
              <button
                onClick={() => handleVerify(doc.id, "VERIFIED")}
                className="flex items-center gap-0.5 rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20"
              >
                <CheckCircle className="h-3 w-3 shrink-0" /> {locale === "bn" ? "অনুমোদন" : "Approve"}
              </button>
              <button
                onClick={() => handleVerify(doc.id, "REJECTED")}
                className="flex items-center gap-0.5 rounded bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/20"
              >
                <XCircle className="h-3 w-3 shrink-0" /> {locale === "bn" ? "প্রত্যাখ্যান" : "Reject"}
              </button>
            </>
          )}
          <button
            onClick={() => handleDownload(doc.id, doc.fileName)}
            className="rounded border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            {locale === "bn" ? "ডাউনলোড" : "Download"}
          </button>
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
            { label: locale === "bn" ? "ডকুমেন্ট রেজিস্টার" : "Documents" },
          ]}
        />

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

        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center dark:border-slate-200/5 dark:bg-slate-950">
          <div className="mr-2 flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>{locale === "bn" ? "অডিট স্ট্যাটাস ফিল্টার:" : "Vetting Status Filter:"}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {["ALL", "PENDING_VERIFICATION", "VERIFIED", "REJECTED", "PENDING_UPLOAD"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === status
                    ? "border-slate-900 bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                }`}
              >
                {getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <LoadingState rows={6} />
          </div>
        ) : error ? (
          <ErrorState
            title={locale === "bn" ? "ডকুমেন্ট লোড করা যায়নি" : "Unable to load documents"}
            description={error}
            actionButton={
              <button
                onClick={() => void loadDocuments()}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white dark:bg-white dark:text-slate-950"
              >
                {locale === "bn" ? "আবার চেষ্টা করুন" : "Retry"}
              </button>
            }
          />
        ) : (
          <DataTable
            data={filteredDocs}
            columns={tableColumns}
            searchPlaceholder={t("documents.searchPlaceholder")}
            searchField="applicantName"
            emptyStateTitle={locale === "bn" ? "এই ফিল্টারে কোনো কমপ্লায়েন্স নথি পাওয়া যায়নি" : "No compliance dossiers match this selection"}
          />
        )}
      </PermissionGate>
    </div>
  );
}
