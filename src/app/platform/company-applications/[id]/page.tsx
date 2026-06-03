// src/app/platform/company-applications/[id]/page.tsx
// Platform Admin - Company Application Detail Review Page

"use client";

import React, { useEffect, useState } from "react";
import { useMockAuth } from "@/context/MockAuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Loader2, ArrowLeft, ShieldAlert, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface CompanyApplication {
  id: string;
  companyName: string;
  ownerFullName: string;
  ownerEmail: string;
  ownerPhone: string;
  businessType: string | null;
  country: string;
  city: string | null;
  address: string | null;
  website: string | null;
  notes: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  approvedCompanyId: string | null;
  createdAt: string;
}

export default function CompanyApplicationDetail({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user, accessToken, loading: authLoading } = useMockAuth();
  const router = useRouter();
  const toast = useToast();

  const [application, setApplication] = useState<CompanyApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  // Security guard for Platform Admin
  useEffect(() => {
    if (!authLoading && (!user || !user.isPlatformAdmin)) {
      router.push("/denied");
    }
  }, [user, authLoading, router]);

  const fetchApplication = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`/api/platform/company-applications/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setApplication(data);
      } else {
        toast.error("Application not found.");
        router.push("/platform/company-applications");
      }
    } catch (err) {
      console.error("Error fetching application:", err);
      toast.error("An error occurred loading the application.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.isPlatformAdmin) {
      fetchApplication();
    }
  }, [accessToken, id, user]);

  const handleApprove = async () => {
    if (!accessToken || !application) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/platform/company-applications/${id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Successfully approved ${application.companyName}!`);
        setShowApproveConfirm(false);
        fetchApplication();
      } else {
        toast.error(data.error || "Approval transaction failed.");
      }
    } catch (err) {
      console.error("Approval error:", err);
      toast.error("Failed to execute approval transaction.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    if (!accessToken || !application) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/platform/company-applications/${id}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rejectionReason }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Successfully rejected ${application.companyName}.`);
        setShowRejectForm(false);
        setRejectionReason("");
        fetchApplication();
      } else {
        toast.error(data.error || "Failed to reject application.");
      }
    } catch (err) {
      console.error("Rejection error:", err);
      toast.error("An error occurred during rejection.");
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || !user || !user.isPlatformAdmin) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-theme" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-theme" />
      </div>
    );
  }

  if (!application) return null;

  let statusBadgeClass = "bg-slate-100 text-slate-700 border-slate-200/60 dark:bg-slate-900 dark:text-slate-400";
  if (application.status === "PENDING") {
    statusBadgeClass = "bg-amber-50 text-amber-700 border-amber-100/60 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
  } else if (application.status === "APPROVED") {
    statusBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100/60 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
  } else if (application.status === "REJECTED") {
    statusBadgeClass = "bg-rose-50 text-rose-700 border-rose-100/60 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30";
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link
            href="/platform/company-applications"
            className="inline-flex items-center gap-1.5 text-xs text-text-soft hover:text-text-theme mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Registry
          </Link>
          <h2 className="text-xl font-bold text-text-theme flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-theme" />
            Review Registration Dossier
          </h2>
          <p className="text-xs text-text-soft">
            Audit owner details and business credibility before approval.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Details Card */}
        <div className="lg:col-span-2 rounded-2xl border border-border-theme bg-surface p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border-theme pb-4">
            <h3 className="text-sm font-bold text-text-theme">Company Identification Dossier</h3>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase ${statusBadgeClass}`}>
              {application.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs font-medium text-text-theme">
            <div>
              <span className="text-[10px] text-text-soft uppercase tracking-wider block mb-1">Company Name</span>
              <p className="text-sm font-bold">{application.companyName}</p>
            </div>
            <div>
              <span className="text-[10px] text-text-soft uppercase tracking-wider block mb-1">Business Type</span>
              <p className="text-sm font-semibold">{application.businessType || "N/A"}</p>
            </div>
            <div>
              <span className="text-[10px] text-text-soft uppercase tracking-wider block mb-1">Owner Full Name</span>
              <p className="text-sm font-semibold">{application.ownerFullName}</p>
            </div>
            <div>
              <span className="text-[10px] text-text-soft uppercase tracking-wider block mb-1">Owner Email</span>
              <p className="text-sm font-mono text-primary-theme font-semibold">{application.ownerEmail}</p>
            </div>
            <div>
              <span className="text-[10px] text-text-soft uppercase tracking-wider block mb-1">Owner Phone</span>
              <p className="text-sm font-semibold">{application.ownerPhone}</p>
            </div>
            <div>
              <span className="text-[10px] text-text-soft uppercase tracking-wider block mb-1">Country / Destination</span>
              <p className="text-sm font-semibold">{application.country}</p>
            </div>
            <div>
              <span className="text-[10px] text-text-soft uppercase tracking-wider block mb-1">City</span>
              <p className="text-sm font-semibold">{application.city || "N/A"}</p>
            </div>
            <div>
              <span className="text-[10px] text-text-soft uppercase tracking-wider block mb-1">Website URL</span>
              {application.website ? (
                <a
                  href={application.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-mono text-primary-theme hover:underline block truncate"
                >
                  {application.website}
                </a>
              ) : (
                <p className="text-sm font-semibold text-text-soft">N/A</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <span className="text-[10px] text-text-soft uppercase tracking-wider block mb-1">Business Physical Address</span>
              <p className="text-sm font-semibold">{application.address || "N/A"}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[10px] text-text-soft uppercase tracking-wider block mb-1">Applicant Notes / Pitch</span>
              <p className="text-sm font-semibold italic bg-bg p-3.5 rounded-xl border border-border-theme/40 leading-relaxed text-text-soft">
                "{application.notes || "No notes provided."}"
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Operational Action Cards */}
        <div className="space-y-6">
          {/* Action Control Panel */}
          <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-text-theme">Administrative Controls</h3>

            {application.status === "PENDING" && (
              <div className="space-y-3 pt-2">
                {!showRejectForm && !showApproveConfirm && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setShowApproveConfirm(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-theme hover:bg-primary-hover py-3 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
                    >
                      Approve & Activate Company
                    </button>
                    <button
                      onClick={() => setShowRejectForm(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 hover:bg-rose-50/50 py-3 text-xs font-bold text-rose-600 dark:border-rose-950/30 dark:hover:bg-rose-950/10 dark:text-rose-400 transition-all cursor-pointer"
                    >
                      Reject Application
                    </button>
                  </div>
                )}

                {/* Confirm Approval Box */}
                {showApproveConfirm && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-950/40 dark:bg-amber-950/20 space-y-4 animate-shake">
                    <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-400">
                      <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold">Confirm Tenant Setup?</strong>
                        <p className="text-[10px] text-amber-800/80 dark:text-amber-400/80 mt-1 leading-relaxed">
                          This will automatically generate an active `Company` tenant, link the Standard Subscription plan, and provision a Super Admin user mapped to the owner's email address.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2 text-[10px] font-bold text-white transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading ? "Processing..." : "Yes, Approve"}
                      </button>
                      <button
                        onClick={() => setShowApproveConfirm(false)}
                        disabled={actionLoading}
                        className="flex-1 rounded-lg border border-border-theme hover:bg-bg py-2 text-[10px] font-bold text-text-theme transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Reject Form */}
                {showRejectForm && (
                  <form onSubmit={handleReject} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                        Rejection Reason *
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="State official reason for rejecting..."
                        rows={3}
                        disabled={actionLoading}
                        className="w-full rounded-xl border border-rose-200 bg-rose-50/10 focus:border-rose-500 py-2 px-3.5 text-xs outline-none transition-all text-text-theme disabled:opacity-50 resize-none font-medium"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="flex-1 rounded-lg bg-rose-600 hover:bg-rose-700 py-2 text-[10px] font-bold text-white transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading ? "Processing..." : "Confirm Reject"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowRejectForm(false);
                          setRejectionReason("");
                        }}
                        disabled={actionLoading}
                        className="flex-1 rounded-lg border border-border-theme hover:bg-bg py-2 text-[10px] font-bold text-text-theme transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Inactive details state checks */}
            {application.status === "APPROVED" && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-950/40 dark:bg-emerald-950/20 text-xs text-emerald-800 dark:text-emerald-400 space-y-2 flex items-start gap-2.5">
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div>
                  <strong className="font-bold">Tenant Active</strong>
                  <p className="text-[10px] text-emerald-800/80 dark:text-emerald-400/80 mt-1 leading-relaxed">
                    This company has been successfully vetted and approved. The owner account is fully active under standard package subscriptions.
                  </p>
                  {application.approvedCompanyId && (
                    <span className="inline-block mt-3 text-[10px] font-bold font-mono">
                      Tenant ID: {application.approvedCompanyId}
                    </span>
                  )}
                </div>
              </div>
            )}

            {application.status === "REJECTED" && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-950/40 dark:bg-rose-950/20 text-xs text-rose-800 dark:text-rose-400 space-y-2 flex items-start gap-2.5">
                <XCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                <div>
                  <strong className="font-bold">Application Rejected</strong>
                  <p className="text-[10px] text-rose-800/80 dark:text-rose-400/80 mt-1 leading-relaxed">
                    This application was rejected by platform administration.
                  </p>
                  {application.rejectionReason && (
                    <div className="mt-3 p-3 bg-bg border border-rose-200/40 rounded-lg">
                      <strong className="font-bold text-[9px] uppercase tracking-wider block text-rose-700 dark:text-rose-400">Rejection Reason:</strong>
                      <p className="text-[10px] text-text-theme font-medium mt-1 font-mono italic">
                        "{application.rejectionReason}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
