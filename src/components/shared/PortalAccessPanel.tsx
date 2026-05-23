"use client";

import React, { useState } from "react";
import { MockApplicant } from "@/lib/mockData";
import { useToast } from "@/context/ToastContext";
import { useMockAuth } from "@/context/MockAuthContext";
import { useT } from "@/i18n/useT";
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
  Send,
  Sparkles,
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
  const { t, locale } = useT();

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
      setError(locale === "bn" ? "পোর্টাল অ্যাক্সেস দেওয়ার জন্য ইমেল ঠিকানা আবশ্যক।" : "Email address is required to provision portal access.");
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
          ? (locale === "bn" ? "পোর্টাল অ্যাক্সেস আমন্ত্রণ লিঙ্ক সফলভাবে তৈরি করা হয়েছে!" : "Portal access invitation link generated successfully!")
          : (locale === "bn" ? "সাময়িক পাসওয়ার্ড সফলভাবে তৈরি করা হয়েছে!" : "Temporary credentials created successfully!")
      );
    } catch (err: any) {
      setError(err.message || (locale === "bn" ? "পোর্টাল অ্যাক্সেস তৈরি করতে ব্যর্থ হয়েছে।" : "Failed to provision portal access."));
      toast.error(err.message || (locale === "bn" ? "পোর্টাল অ্যাক্সেস তৈরি করতে ব্যর্থ হয়েছে।" : "Failed to provision portal access."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyPassword = () => {
    if (successData?.tempPassword) {
      navigator.clipboard.writeText(successData.tempPassword);
      setCopiedPass(true);
      toast.success(locale === "bn" ? "পাসওয়ার্ড ক্লিপবোর্ডে কপি করা হয়েছে!" : "Password copied to clipboard!");
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
      toast.success(locale === "bn" ? "অ্যাক্টিভেশন লিঙ্ক ক্লিপবোর্ডে কপি করা হয়েছে!" : "Activation link copied to clipboard!");
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
            <h2 className="text-base font-bold text-text-theme">{locale === "bn" ? "আবেদনকারী পোর্টাল লগইন" : "Portal Login Provisioning"}</h2>
            <p className="text-xs text-text-soft font-medium">
              {locale === "bn"
                ? "আবেদনকারীর অ্যাকাউন্ট অ্যাক্সেস, সাময়িক পাসওয়ার্ড এবং আমন্ত্রণ লিঙ্ক ম্যানেজ করুন।"
                : "Manage applicant account access, temporary passwords, and secure invitation links."}
            </p>
          </div>
        </div>

        {/* Portal Status Indicators */}
        <div>
          {applicant.userId ? (
            <span className="inline-flex items-center gap-1 text-[11px] rounded-full bg-success-soft border border-success-theme/20 text-success-theme px-3 py-1 font-bold">
              <ShieldCheck className="h-3.5 w-3.5" /> {locale === "bn" ? "পোর্টাল অ্যাক্সেস সক্রিয়" : "Portal Access Active"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] rounded-full bg-bg-muted border border-border-theme text-text-soft px-3 py-1 font-bold">
              <ShieldAlert className="h-3.5 w-3.5" /> {locale === "bn" ? "পোর্টাল অ্যাক্সেস নিষ্ক্রিয় / আমন্ত্রণ জানানো হয়নি" : "Access Inactive / Not Invited"}
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {applicant.userId ? (
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 dark:bg-slate-900/40 dark:border-slate-800">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-text-soft uppercase tracking-wider block">
                  {locale === "bn" ? "সংযুক্ত ইউজার অ্যাকাউন্ট" : "Linked User Identity Account"}
                </span>
                <span className="text-sm font-semibold text-text-theme">{applicant.email || (locale === "bn" ? "নিবন্ধিত ইমেল ঠিকানা" : "Registered Email Address")}</span>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  {locale === "bn"
                    ? "এই আবেদনকারীর পোর্টাল অ্যাক্সেস সক্রিয় রয়েছে। ব্যবহারকারী এই ইমেল এড্রেস দিয়ে লগইন করতে পারবেন। নিরাপত্তার জন্য পাসওয়ার্ড পুনরুদ্ধার করা সম্ভব নয়।"
                    : "This applicant's portal access is active. The user logs in using this email address. For credentials safety, plain passwords cannot be retrieved by staff."}
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
              <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider block">
                {locale === "bn" ? "পোর্টাল অ্যাকাউন্ট তৈরি করা হয়নি" : "Access Unprovisioned"}
              </span>
              <p className="text-[11px] text-indigo-700/80 leading-relaxed dark:text-indigo-400/80">
                {locale === "bn"
                  ? "এই প্রার্থীর জন্য কোনো ইউজার অ্যাকাউন্ট তৈরি করা হয়নি। পোর্টাল অ্যাক্সেস প্রদান করুন যাতে প্রার্থী তার ভিসা স্ট্যাটাস, ইনভয়েস ব্যালেন্স এবং মেডিকেল অ্যাপয়েন্টমেন্ট দেখতে পারেন এবং ফাইল আপলোড করতে পারেন।"
                  : "No linked user account exists for this candidate. Provision login access so the candidate can track their visa status, invoice balances, medical appointments, and upload compliance files in real time."}
              </p>
            </div>
            <div className="flex shrink-0 items-center">
              {isAuthorized ? (
                <button
                  onClick={handleOpenModal}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 transition-all shadow-md shadow-indigo-600/15 duration-200 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 animate-pulse" /> {locale === "bn" ? "পোর্টাল অ্যাক্সেস প্রদান করুন" : "Provision Portal Access"}
                </button>
              ) : (
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 border border-rose-100/50 dark:bg-rose-950/10 dark:border-rose-900/10 px-3 py-1.5 rounded-lg">
                  {locale === "bn" ? "অপর্যাপ্ত পারমিশন" : "Insufficient Permissions"}
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
                    {locale === "bn" ? "পোর্টাল অ্যাকাউন্ট তৈরি করুন" : "Provision Portal Account"}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {locale === "bn"
                      ? `${applicant.fullName} এর জন্য নিরাপদ পোর্টাল অ্যাকাউন্ট অ্যাক্সেস তৈরি করুন।`
                      : `Generate secure portal access credentials for ${applicant.fullName}.`}
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
                      ? (locale === "bn" ? "পোর্টাল অ্যাক্সেস আমন্ত্রণ সফল" : "Activation Invitation Provisioned")
                      : (locale === "bn" ? "সাময়িক ক্রেডেনশিয়াল তৈরি সফল" : "Temporary Credentials Provisioned")}
                  </h4>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 max-w-xs mt-1 leading-relaxed">
                    {locale === "bn"
                      ? "ইউজার অ্যাকাউন্ট সফলভাবে লিংক করা হয়েছে। প্রার্থীর প্রোফাইলটি পোর্টালে সংযুক্ত করা হয়েছে।"
                      : "User account linked successfully. The candidate profile is now mapped to their portal login role."}
                  </p>
                </div>

                {/* Invite link success rendering */}
                {successData.mode === "INVITE_LINK" && (
                  <div className="space-y-2">
                    {successData.devActivationLink ? (
                      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/20 dark:bg-indigo-950/10">
                        <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider block">
                          {locale === "bn" ? "ডেভেলপমেন্ট অ্যাক্টিভেশন লিঙ্ক" : "Development Activation Link"}
                        </span>
                        <div className="flex items-center gap-2 mt-1 bg-white border border-indigo-100/50 dark:bg-slate-900 dark:border-slate-800 p-2 rounded-lg font-mono text-[10px] overflow-x-auto text-indigo-600 dark:text-indigo-400 select-all">
                          {window.location.origin + successData.devActivationLink}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal max-w-[280px]">
                            {locale === "bn"
                              ? "* এই লিঙ্কটি কেবল ডেভেলপমেন্ট এবং টেস্ট এনভায়রনমেন্টে প্রদর্শিত হচ্ছে।"
                              : "* This link is shown exclusively in development/mock environments to allow manual activation testing."}
                          </p>
                          <button
                            type="button"
                            onClick={handleCopyLink}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1.5 transition duration-200 cursor-pointer"
                          >
                            {copiedLink ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            {copiedLink ? (locale === "bn" ? "কপি হয়েছে!" : "Copied!") : (locale === "bn" ? "লিঙ্ক কপি করুন" : "Copy Link")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:bg-slate-900/50 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                          {locale === "bn" ? "পাঠানোর অবস্থা" : "Delivery Status"}
                        </span>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                          {locale === "bn"
                            ? "নিরাপদ অ্যাক্টিভেশন ইমেলটি এই ঠিকানায় পাঠানোর জন্য লাইনে যুক্ত করা হয়েছে:"
                            : "Secure activation mail successfully enqueued for delivery to:"}
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
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                        {locale === "bn" ? "তৈরিকৃত পোর্টাল ক্রেডেনশিয়াল" : "Generated Portal Credentials"}
                      </span>
                      <div className="grid grid-cols-3 gap-y-2 text-xs">
                        <span className="text-slate-400 dark:text-slate-500 font-semibold">{locale === "bn" ? "পোর্টাল ইউজারনেম:" : "Portal Username:"}</span>
                        <span className="col-span-2 font-mono text-slate-800 dark:text-slate-200 font-bold">{successData.username}</span>
                        
                        <span className="text-slate-400 dark:text-slate-500 font-semibold">{locale === "bn" ? "সাময়িক পাসওয়ার্ড:" : "Temporary Password:"}</span>
                        <span className="col-span-2 font-mono text-slate-800 dark:text-slate-200 font-bold tracking-wider">{successData.tempPassword}</span>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 mt-3 pt-3">
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal max-w-[280px]">
                          {locale === "bn"
                            ? "অনুগ্রহ করে এই পাসওয়ার্ডটি এখনই সংরক্ষণ করুন। নিরাপত্তার স্বার্থে এই পাসওয়ার্ডটি আর দেখানো হবে না।"
                            : "Please record these credentials now. This temporary password will NEVER be shown again for safety reasons."}
                        </p>
                        <button
                          type="button"
                          onClick={handleCopyPassword}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1.5 transition duration-200 cursor-pointer"
                        >
                          {copiedPass ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {copiedPass ? (locale === "bn" ? "কপি হয়েছে!" : "Copied!") : (locale === "bn" ? "পাসওয়ার্ড কপি করুন" : "Copy Password")}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3.5 dark:bg-amber-950/15 dark:border-amber-900/20 text-[10px] text-amber-800 dark:text-amber-400 flex gap-2">
                      <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 animate-bounce" />
                      <div>
                        <span className="font-bold block uppercase tracking-wider mb-0.5">
                          {locale === "bn" ? "ক্রেডেনশিয়াল নীতি সতর্কবার্তা" : "Secure Credentials Policy Warning"}
                        </span>
                        <span className="leading-normal">
                          {locale === "bn"
                            ? "তৈরিকৃত পাসওয়ার্ডটি নিরাপদে আবেদনকারীর কাছে পৌঁছে দিন এবং প্রথমবার পোর্টালে লগইন করেই পাসওয়ার্ড পরিবর্তন করার পরামর্শ দিন।"
                            : "The generated temporary credentials must be delivered securely to the applicant. Ensure you warn the applicant to update their password immediately upon their first successful dashboard portal authorization."}
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
                    className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-bold text-xs px-5 py-2.5 transition duration-200 shadow-md cursor-pointer"
                  >
                    {locale === "bn" ? "নিশ্চিত করে বন্ধ করুন" : "Acknowledge & Close"}
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
                    {locale === "bn" ? "অ্যাকাউন্ট তৈরির মোড" : "Provisioning Configuration Mode"}
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
                          {locale === "bn" ? "নিরাপদ ইমেল আমন্ত্রণ" : "Secure Email Invite"}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal mt-0.5">
                        {locale === "bn"
                          ? "একটি এককালীন অ্যাক্টিভেশন লিঙ্ক তৈরি করে যা দিয়ে আবেদনকারী নিজেই তার পাসওয়ার্ড সেট আপ করতে পারেন।"
                          : "Creates an account with an unusable random password and returns a one-time activation link for secure candidate self-onboarding."}
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
                          {locale === "bn" ? "সাময়িক পাসওয়ার্ড" : "Temporary Pass"}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal mt-0.5">
                        {locale === "bn"
                          ? "সরাসরি একটি অত্যন্ত নিরাপদ সাময়িক পাসওয়ার্ড তৈরি করে যা আপনি নিজেই কপি করে প্রার্থীকে দিতে পারেন।"
                          : "Instantly registers the user with a highly-secure temporary credentials string that can be copied and delivered manually."}
                      </p>
                    </div>

                  </div>
                </div>

                {/* Email Address Form Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    {locale === "bn" ? "আবেদনকারী পোর্টাল ইমেল" : "Candidate Portal Email"}
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
                    {locale === "bn"
                      ? "* পোর্টাল ইউজারনেম হিসেবে এই ইমেল এড্রেসটি ব্যবহার হবে। এটি সঠিক ও অনন্য হওয়া আবশ্যক।"
                      : "* The portal username matches this email address. Make sure it is valid, secure, and unique."}
                  </p>
                </div>

                {/* Form Actions */}
                <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={submitting}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 transition-all duration-200 cursor-pointer"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !email.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 transition-all shadow-md shadow-indigo-600/20 disabled:bg-indigo-400 disabled:opacity-50 duration-200 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {locale === "bn" ? "তৈরি হচ্ছে..." : "Generating..."}
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        {locale === "bn" ? "পোর্টাল অ্যাকাউন্ট তৈরি করুন" : "Generate Login Account"}
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
