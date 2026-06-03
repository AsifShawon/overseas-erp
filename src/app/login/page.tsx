// src/app/login/page.tsx
// Upgraded Login Page (Phase 2 & Phase 3 refinements)
// Contains functional email/password form + interactive auto-fill developer helper cards

"use client";

import React, { useState, useEffect } from "react";
import { useMockAuth } from "@/context/MockAuthContext";
import { useRouter } from "next/navigation";
import {
  Globe2,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Building2,
  FileText,
  Shield,
  Crown,
  Briefcase,
  Users,
  Globe,
  Receipt,
  Handshake,
  User
} from "lucide-react";
import { useT } from "@/i18n/useT";

// Password map for seeded users to power developer quick sign-in cards
const SEEDED_PASSWORDS: Record<string, string> = {
  "platform@agency.com": "PlatformAdmin@2026!",
  "admin@agency.com": "SuperAdmin@2026!",
  "ops@agency.com": "OpsAdmin@2026!",
  "hr@agency.com": "HrOfficer@2026!",
  "docs@agency.com": "DocsOfficer@2026!",
  "visa@agency.com": "VisaOfficer@2026!",
  "accounts@agency.com": "Accounts@2026!",
  "agent@agent.com": "AgentKabir@2026!",
  "applicant@applicant.com": "Applicant@2026!",
};

// Details mapping for each role profile to enhance cards with icons and descriptions
const ROLE_DETAILS: Record<string, { descEn: string; descBn: string; icon: React.ReactNode }> = {
  "Platform Admin": {
    descEn: "System configuration & platform logs",
    descBn: "সিস্টেম কনফিগারেশন এবং প্ল্যাটফর্ম লগ",
    icon: <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
  },
  "Super Admin": {
    descEn: "Full company database access & settings",
    descBn: "কোম্পানি ডেটাবেস এবং সম্পূর্ণ সেটিংস অ্যাক্সেস",
    icon: <Crown className="h-5 w-5 text-rose-600 dark:text-rose-400" />
  },
  "Operations Admin": {
    descEn: "Recruitment pipelines & allocations",
    descBn: "নিয়োগ কার্যক্রম এবং কোটা বরাদ্দ",
    icon: <Briefcase className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
  },
  "HR Officer": {
    descEn: "Candidate interviews & profiling",
    descBn: "প্রার্থীর সাক্ষাৎকার এবং প্রোফাইল তৈরি",
    icon: <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
  },
  "Documentation Officer": {
    descEn: "Verify passports, NIDs & certificates",
    descBn: "পাসপোর্ট, এনআইডি এবং সার্টিফিকেট যাচাইকরণ",
    icon: <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
  },
  "Visa Officer": {
    descEn: "Visa submissions & sticker stamping",
    descBn: "ভিসা আবেদন এবং স্টিকার স্ট্যাম্পিং",
    icon: <Globe className="h-5 w-5 text-amber-600 dark:text-amber-400" />
  },
  "Accounts Officer": {
    descEn: "Invoice postings, cash receipts & ledger",
    descBn: "ইনভয়েস পোস্টিং, ক্যাশ রসিদ এবং হিসাব খাতা",
    icon: <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
  },
  "Agent": {
    descEn: "Track referred applicants & quota stats",
    descBn: "রেফার করা আবেদনকারী এবং কোটা ট্র্যাকিং",
    icon: <Handshake className="h-5 w-5 text-amber-700 dark:text-amber-500" />
  },
  "Applicant": {
    descEn: "View visa status, invoices & appointments",
    descBn: "ভিসা স্ট্যাটাস, ইনভয়েস এবং মেডিকেল অ্যাপয়েন্টমেন্ট",
    icon: <User className="h-5 w-5 text-sky-600 dark:text-sky-400" />
  }
};

export default function LoginPage() {
  const { allUsers, login } = useMockAuth();
  const router = useRouter();
  const { t, locale } = useT();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("activated") === "true") {
        setSuccessMessage("Your account is activated. Please log in.");
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t("auth.fillAllFields") || "Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || t("auth.invalidCredentials") || "Invalid credentials.");
      setIsSubmitting(false);
    }
  };

  // Helper card trigger to autofill & sign in directly
  const handleQuickLogin = async (mockEmail: string) => {
    const mockPassword = SEEDED_PASSWORDS[mockEmail];
    if (!mockPassword) return;

    setEmail(mockEmail);
    setPassword(mockPassword);
    setIsSubmitting(true);
    setError(null);

    try {
      await login(mockEmail, mockPassword);
    } catch (err: any) {
      setError(err.message || t("auth.quickLoginFailed") || "Quick login failed.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="overflow-hidden rounded-3xl bg-surface shadow-2xl border border-border-theme flex flex-col lg:flex-row min-h-[750px]">
          
          {/* Brand/Product Feature Pane */}
          <div className="lg:w-5/12 bg-[#090d16] text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-theme/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-red/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
            
            <div className="relative z-10 space-y-8">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <img
                  src="/visatek_logo_transparent.png"
                  alt="VisaTek Logo"
                  className="h-12 w-auto max-w-[220px] object-contain"
                />
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/10 text-white/90 font-mono">ERP</span>
              </div>

              {/* Tagline */}
              <div className="space-y-4 pt-4">
                <h1 className="text-3xl font-extrabold tracking-tight leading-tight text-white lg:text-4xl">
                  Enterprise-Grade <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-rose-400">
                    Visa & Manpower ERP
                  </span>
                </h1>
                <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
                  Streamlining global migration pipeline, document verification, multi-tenant agent management, and automated invoicing.
                </p>
              </div>

              {/* Highlights */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-blue-400 shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <span>Multi-Tenant Agency Isolation</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-emerald-400 shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span>Real-time Candidate Pipeline Tracking</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-purple-400 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span>Secure Document Management & Audit Trails</span>
                </div>
              </div>
            </div>

            {/* Footer note */}
            <div className="relative z-10 pt-8 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span>© 2026 VisaTek ERP. All rights reserved.</span>
              <span className="flex items-center gap-1"><Globe2 className="h-3 w-3" /> Secure SSL</span>
            </div>
          </div>

          {/* Form and Quick Access Pane */}
          <div className="lg:w-7/12 p-8 lg:p-12 flex flex-col justify-center space-y-8 bg-surface">
            
            <div className="max-w-xl w-full mx-auto space-y-8">
              
              {/* Form Header */}
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-theme">
                  {t("auth.title") || "Sign in to your account"}
                </h2>
                <p className="text-xs md:text-sm text-text-soft font-semibold leading-relaxed">
                  {t("auth.subtitle") || "Enter your organizational credentials to continue."}
                </p>
              </div>

              {/* Messages */}
              {successMessage && (
                <div className="flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs text-emerald-700 dark:border-emerald-950/30 dark:bg-emerald-950/10 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5 dark:text-emerald-400" />
                  <div>
                    <strong className="font-bold block text-xs mb-0.5">Success</strong>
                    <p className="text-xs text-emerald-600/90 dark:text-emerald-400/90 font-semibold">{successMessage}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-xs text-rose-700 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-400 animate-shake">
                  <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <strong className="font-bold block text-xs mb-0.5">{t("auth.authErrorTitle") || "Authentication Error"}</strong>
                    <p className="text-xs text-rose-600/90 dark:text-rose-400/90 font-semibold">{error}</p>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs md:text-sm font-semibold text-text-theme leading-relaxed">
                    {t("auth.emailLabel") || "Email Address"}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-soft">
                      <Mail className="h-4.5 w-4.5" />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@agency.com"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-border-theme bg-white dark:bg-slate-900 py-3 pl-11 pr-4 text-sm md:text-[15px] outline-none transition-all focus:border-primary-theme focus:ring-1 focus:ring-primary-theme text-text-theme disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs md:text-sm font-semibold text-text-theme leading-relaxed">
                    {t("auth.passwordLabel") || "Password"}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-soft">
                      <Lock className="h-4.5 w-4.5" />
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-border-theme bg-white dark:bg-slate-900 py-3 pl-11 pr-4 text-sm md:text-[15px] outline-none transition-all focus:border-primary-theme focus:ring-1 focus:ring-primary-theme text-text-theme disabled:opacity-50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-theme hover:bg-primary-hover py-3 text-sm md:text-[15px] font-bold text-white shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-70 mt-6"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin text-white" />
                      <span>{t("auth.verifying") || "Verifying credentials..."}</span>
                    </>
                  ) : (
                    <>
                      <span>{t("auth.signInBtn") || "Sign In to ERP"}</span>
                      <ArrowRight className="h-4.5 w-4.5 text-white" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick access header */}
              <div className="pt-6 border-t border-border-theme space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs md:text-sm font-bold text-text-theme leading-relaxed">
                    {t("auth.devQuickSignIn") || "Developer Sign-In Helper"}
                  </h3>
                  <p className="text-xs md:text-sm text-text-soft leading-relaxed font-semibold">
                    {t("auth.devQuickSignInDesc") || "Select a role profile below to automatically seed coordinates and sign in."}
                  </p>
                </div>

                {/* Quick sign-in grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1.5 scrollbar-thin">
                  {allUsers.map((mockUser) => {
                    const roleName = mockUser.roleName;
                    const details = ROLE_DETAILS[roleName] || {
                      descEn: "Click to sign in",
                      descBn: "সাইন ইন করতে ক্লিক করুন",
                      icon: <User className="h-5 w-5" />
                    };

                    let badgeColor = "bg-slate-100 text-slate-700 border-slate-200/60 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800";
                    if (roleName === "Platform Admin") badgeColor = "bg-purple-50 text-purple-700 border-purple-100/60 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30";
                    else if (roleName === "Super Admin") badgeColor = "bg-rose-50 text-rose-700 border-rose-100/60 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30";
                    else if (roleName === "Operations Admin") badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-100/60 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30";
                    else if (roleName === "Accounts Officer") badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100/60 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
                    else if (roleName === "Agent") badgeColor = "bg-amber-50 text-amber-700 border-amber-100/60 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
                    else if (roleName === "Applicant") badgeColor = "bg-sky-50 text-sky-700 border-sky-100/60 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30";

                    const isUserSubmitting = isSubmitting && email === mockUser.email;

                    return (
                      <div
                        key={mockUser.id}
                        onClick={() => !isSubmitting && handleQuickLogin(mockUser.email)}
                        className={`group cursor-pointer rounded-2xl border border-border-theme bg-white dark:bg-slate-900/40 p-4 shadow-sm flex flex-col justify-between min-h-[110px] relative overflow-hidden transition-all duration-300 ease-out transform hover:-translate-y-1 hover:scale-[1.03] hover:shadow-md hover:border-primary-theme focus-within:-translate-y-1 focus-within:scale-[1.03] focus-within:shadow-md focus-within:border-primary-theme motion-reduce:transition-none motion-reduce:hover:transform-none ${
                          isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {/* Top row: Icon and Badge */}
                        <div className="flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2">
                            <div className="shrink-0 p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              {details.icon}
                            </div>
                            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-extrabold tracking-wide uppercase truncate ${badgeColor}`}>
                              {t(`roles.${roleName}`) || roleName}
                            </span>
                          </div>
                          {isUserSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary-theme shrink-0" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-text-soft group-hover:text-primary-theme transition-colors shrink-0" />
                          )}
                        </div>

                        {/* Middle row: Full name & Email */}
                        <div className="mt-3 space-y-0.5">
                          <h4 className="text-sm md:text-[15px] font-bold text-text-theme truncate leading-normal" style={{ lineHeight: '1.6' }}>
                            {mockUser.fullName}
                          </h4>
                          <p className="text-xs text-text-soft truncate font-mono font-medium">
                            {mockUser.email}
                          </p>
                        </div>

                        {/* Bottom row: Sliding detail view */}
                        <div className="mt-2.5 pt-2.5 border-t border-dashed border-border-theme/40 text-xs font-semibold text-primary-theme opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-12 group-focus-within:opacity-100 group-focus-within:max-h-12 transition-all duration-300 ease-out overflow-hidden leading-relaxed" style={{ lineHeight: '1.6' }}>
                          <span className="block text-text-soft font-normal text-[11px] leading-snug">
                            {locale === "bn" ? details.descBn : details.descEn}
                          </span>
                          <span className="inline-flex items-center gap-1 mt-1 text-primary-theme font-bold">
                            {locale === "bn" ? "সাইন ইন করতে ক্লিক করুন" : "Click to sign in"} <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Compliance & security note */}
              <div className="flex gap-2.5 rounded-xl border border-amber-100 bg-amber-50/30 p-4 dark:border-amber-950/30 dark:bg-amber-950/10">
                <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5 dark:text-amber-500" />
                <p className="text-xs md:text-sm text-amber-800/80 leading-relaxed font-semibold dark:text-amber-400/80" style={{ lineHeight: '1.6' }}>
                  <strong>{t("auth.complianceNotice") || "Security Compliance"}:</strong> {t("auth.complianceNoteDesc") || "System enforces tenant isolated logging, strict RBAC permissions, and auto-lockout policies."}
                </p>
              </div>

            </div>

          </div>
          
        </div>
      </div>
    </div>
  );
}
