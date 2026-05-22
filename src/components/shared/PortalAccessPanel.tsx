"use client";

import React, { useState } from "react";
import { MockApplicant } from "@/lib/mockData";
import { useToast } from "@/context/ToastContext";
import { useMockAuth } from "@/context/MockAuthContext";
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  Mail,
  Copy,
  Check,
  Loader2,
  Lock,
  User,
  Globe2,
  Send,
  Sparkles,
  ChevronRight
} from "lucide-react";

interface PortalAccessPanelProps {
  applicant: MockApplicant;
  accessToken: string | null;
  userRole: string | null;
  onRefresh: () => void;
}

export function PortalAccessPanel({
  applicant,
  accessToken,
  userRole,
  onRefresh
}: PortalAccessPanelProps) {
  const toast = useToast();
  const { hasAccess } = useMockAuth();

  // State controls
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"INVITE_LINK" | "TEMP_PASSWORD">("INVITE_LINK");
  const [email, setEmail] = useState(applicant.email || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success responses
  const [successData, setSuccessData] = useState<{
    mode: "INVITE_LINK" | "TEMP_PASSWORD";
    username: string;
    tempPassword?: string;
    devActivationLink?: string;
  } | null>(null);

  // Copy indicator states
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Authorization checks
  const isSuperOrOps = userRole === "Super Admin" || userRole === "Operations Admin";
  const isHR = userRole === "HR Officer";
  const isAgent = userRole === "Agent";
  const hasGranularAccess = hasAccess("CREATE_APPLICANT") || hasAccess("UPDATE_APPLICANT");
  const isAuthorized = isSuperOrOps || isHR || isAgent || hasGranularAccess;

  const handleOpenModal = () => {
    setError(null);
    setSuccessData(null);
    setCopiedPass(false);
    setCopiedLink(false);
    setEmail(applicant.email || "");
    setMode("INVITE_LINK");
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    // If we were successful, reload data to update the applicant.userId status
    if (successData) {
      onRefresh();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (!email.trim()) {
      setError("Email address is required to provision portal access.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch(`/api/applicants/${applicant.id}/portal-access`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          mode,
          email: email.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Provisioning failed with status ${res.status}`);
      }

      setSuccessData(data);
      toast.success(
        mode === "INVITE_LINK"
          ? "Portal access invitation link generated successfully!"
          : "Temporary credentials created successfully!"
      );
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      toast.error(err.message || "Failed to provision portal access.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyPassword = () => {
    if (successData?.tempPassword) {
      navigator.clipboard.writeText(successData.tempPassword);
      setCopiedPass(true);
      toast.success("Password copied to clipboard!");
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (successData?.devActivationLink) {
      // Create full url if link starts with /
      const fullUrl = successData.devActivationLink.startsWith("/")
        ? window.location.origin + successData.devActivationLink
        : successData.devActivationLink;
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      toast.success("Activation link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="rounded-xl border border-border-theme bg-surface p-6 shadow-sm animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border-theme pb-5">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
            applicant.userId 
              ? "bg-success-soft text-success-theme" 
              : "bg-bg-muted text-text-muted"
          }`}>
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-theme">Portal Login Provisioning</h2>
            <p className="text-xs text-text-soft font-medium">
              Manage applicant account access, temporary passwords, and secure invitation links.
            </p>
          </div>
        </div>

        {/* Portal Status Indicators */}
        <div>
          {applicant.userId ? (
            <span className="inline-flex items-center gap-1 text-[11px] rounded-full bg-success-soft border border-success-theme/20 text-success-theme px-3 py-1 font-bold">
              <ShieldCheck className="h-3.5 w-3.5" /> Portal Access Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] rounded-full bg-bg-muted border border-border-theme text-text-soft px-3 py-1 font-bold">
              <ShieldAlert className="h-3.5 w-3.5" /> Access Inactive / Not Invited
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {applicant.userId ? (
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 dark:bg-slate-900/40 dark:border-slate-800">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-text-soft uppercase tracking-wider block">Linked User Identity Account</span>
                <span className="text-sm font-semibold text-text-theme">{applicant.email || "Registered Email Address"}</span>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  This applicant's portal access is active. The user logs in using this email address. For credentials safety, plain passwords cannot be retrieved by staff.
                </p>
              </div>
              <div className="flex shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400">
                  <User className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-indigo-50/40 border border-indigo-100/50 p-4 dark:bg-indigo-950/10 dark:border-indigo-900/10">
            <div className="space-y-1.5 max-w-xl">
              <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider block">Access Unprovisioned</span>
              <p className="text-[11px] text-indigo-700/80 leading-relaxed dark:text-indigo-400/80">
                No linked user account exists for this candidate. Provision login access so the candidate can track their visa status, invoice balances, medical appointments, and upload compliance files in real time.
              </p>
            </div>
            <div className="flex shrink-0 items-center">
              {isAuthorized ? (
                <button
                  onClick={handleOpenModal}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 transition-all shadow-md shadow-indigo-600/15 duration-200"
                >
                  <Sparkles className="h-4 w-4 animate-pulse" /> Provision Portal Access
                </button>
              ) : (
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 border border-rose-100/50 dark:bg-rose-950/10 dark:border-rose-900/10 px-3 py-1.5 rounded-lg">
                  Insufficient Permissions
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Provisioning Modal Popup */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Provision Portal Account
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Generate secure portal access credentials for <span className="font-bold text-slate-600 dark:text-slate-300">{applicant.fullName}</span>.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Content - Success Screen */}
            {successData ? (
              <div className="mt-5 space-y-5 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/15 dark:border-emerald-900/20">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mt-2">
                    {successData.mode === "INVITE_LINK" 
                      ? "Activation Invitation Provisioned" 
                      : "Temporary Credentials Provisioned"}
                  </h4>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 max-w-xs mt-1 leading-relaxed">
                    User account linked successfully. The candidate profile is now mapped to their portal login role.
                  </p>
                </div>

                {/* Invite link success rendering */}
                {successData.mode === "INVITE_LINK" && (
                  <div className="space-y-2">
                    {successData.devActivationLink ? (
                      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/20 dark:bg-indigo-950/10">
                        <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider block">Development Activation Link</span>
                        <div className="flex items-center gap-2 mt-1 bg-white border border-indigo-100/50 dark:bg-slate-900 dark:border-slate-800 p-2 rounded-lg font-mono text-[10px] overflow-x-auto text-indigo-600 dark:text-indigo-400 select-all">
                          {window.location.origin + successData.devActivationLink}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal max-w-[280px]">
                            * This link is shown exclusively in development/mock environments to allow manual activation testing.
                          </p>
                          <button
                            type="button"
                            onClick={handleCopyLink}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1.5 transition duration-200"
                          >
                            {copiedLink ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            {copiedLink ? "Copied!" : "Copy Link"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:bg-slate-900/50 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Delivery Status</span>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                          Secure activation mail successfully enqueued for delivery to:
                        </p>
                        <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold block mt-1">{successData.username}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Temporary credentials success rendering */}
                {successData.mode === "TEMP_PASSWORD" && successData.tempPassword && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:bg-slate-900/50 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Generated Portal Credentials</span>
                      <div className="grid grid-cols-3 gap-y-2 text-xs">
                        <span className="text-slate-400 dark:text-slate-500 font-semibold">Portal Username:</span>
                        <span className="col-span-2 font-mono text-slate-800 dark:text-slate-200 font-bold">{successData.username}</span>
                        
                        <span className="text-slate-400 dark:text-slate-500 font-semibold">Temporary Password:</span>
                        <span className="col-span-2 font-mono text-slate-800 dark:text-slate-200 font-bold tracking-wider">{successData.tempPassword}</span>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 mt-3 pt-3">
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal max-w-[280px]">
                          Please record these credentials now. This temporary password will NEVER be shown again for safety reasons.
                        </p>
                        <button
                          type="button"
                          onClick={handleCopyPassword}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1.5 transition duration-200"
                        >
                          {copiedPass ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {copiedPass ? "Copied!" : "Copy Password"}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3.5 dark:bg-amber-950/15 dark:border-amber-900/20 text-[10px] text-amber-800 dark:text-amber-400 flex gap-2">
                      <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 animate-bounce" />
                      <div>
                        <span className="font-bold block uppercase tracking-wider mb-0.5">Secure Credentials Policy Warning</span>
                        <span className="leading-normal">
                          The generated temporary credentials must be delivered securely to the applicant. Ensure you warn the applicant to update their password immediately upon their first successful dashboard portal authorization.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Close Success Modal Action */}
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-bold text-xs px-5 py-2.5 transition duration-200 shadow-md"
                  >
                    Acknowledge & Close
                  </button>
                </div>
              </div>
            ) : (
              /* Modal Content - Interactive Provision Form */
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                
                {error && (
                  <div className="flex gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/10 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/20">
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="font-semibold">{error}</span>
                  </div>
                )}

                {/* Mode Selector Option Cards */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Provisioning Configuration Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    
                    {/* Option A: Invite link */}
                    <div
                      onClick={() => !submitting && setMode("INVITE_LINK")}
                      className={`cursor-pointer rounded-xl border p-3.5 transition-all duration-200 flex flex-col gap-1.5 ${
                        mode === "INVITE_LINK"
                          ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/10"
                          : "border-slate-200 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-900/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg border ${
                          mode === "INVITE_LINK"
                            ? "bg-indigo-100 border-indigo-200 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400"
                            : "bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-800"
                        }`}>
                          <Mail className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Secure Email Invite
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal mt-0.5">
                        Creates an account with an unusable random password and returns a one-time activation link for secure candidate self-onboarding.
                      </p>
                    </div>

                    {/* Option B: Temporary credentials */}
                    <div
                      onClick={() => !submitting && setMode("TEMP_PASSWORD")}
                      className={`cursor-pointer rounded-xl border p-3.5 transition-all duration-200 flex flex-col gap-1.5 ${
                        mode === "TEMP_PASSWORD"
                          ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/10"
                          : "border-slate-200 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-900/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg border ${
                          mode === "TEMP_PASSWORD"
                            ? "bg-indigo-100 border-indigo-200 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400"
                            : "bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-800"
                        }`}>
                          <Key className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Temporary Pass
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal mt-0.5">
                        Instantly registers the user with a highly-secure temporary credentials string that can be copied and delivered manually.
                      </p>
                    </div>

                  </div>
                </div>

                {/* Email Address Form Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Candidate Portal Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. candidate@example.com"
                      disabled={submitting}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200 transition-all duration-200 placeholder:text-slate-400"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal">
                    * The portal username matches this email address. Make sure it is valid, secure, and unique.
                  </p>
                </div>

                {/* Form Actions */}
                <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={submitting}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !email.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 transition-all shadow-md shadow-indigo-600/20 disabled:bg-indigo-400 disabled:opacity-50 duration-200"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        Generate Login Account
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
