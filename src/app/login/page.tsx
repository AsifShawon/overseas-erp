// src/app/login/page.tsx
// Upgraded Login Page — no-scroll layout, compact quick-login chips with hover popovers

"use client";

import React, { useState, useRef } from "react";
import { useMockAuth } from "@/context/MockAuthContext";
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
  User,
  Copy,
  Check,
} from "lucide-react";
import { useT } from "@/i18n/useT";

// Password map for seeded users
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

const ROLE_DETAILS: Record<
  string,
  {
    descEn: string;
    descBn: string;
    icon: React.ReactNode;
    color: string;
    badgeColor: string;
  }
> = {
  "Platform Admin": {
    descEn: "System configuration & platform logs",
    descBn: "সিস্টেম কনফিগারেশন এবং প্ল্যাটফর্ম লগ",
    icon: <Shield className="h-3.5 w-3.5" />,
    color: "text-purple-600 dark:text-purple-400",
    badgeColor:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/40",
  },
  "Super Admin": {
    descEn: "Full company database access & settings",
    descBn: "কোম্পানি ডেটাবেস এবং সম্পূর্ণ সেটিংস",
    icon: <Crown className="h-3.5 w-3.5" />,
    color: "text-rose-600 dark:text-rose-400",
    badgeColor:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/40",
  },
  "Operations Admin": {
    descEn: "Recruitment pipelines & allocations",
    descBn: "নিয়োগ কার্যক্রম এবং কোটা বরাদ্দ",
    icon: <Briefcase className="h-3.5 w-3.5" />,
    color: "text-indigo-600 dark:text-indigo-400",
    badgeColor:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/40",
  },
  "HR Officer": {
    descEn: "Candidate interviews & profiling",
    descBn: "প্রার্থীর সাক্ষাৎকার ও প্রোফাইল",
    icon: <Users className="h-3.5 w-3.5" />,
    color: "text-blue-600 dark:text-blue-400",
    badgeColor:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40",
  },
  "Documentation Officer": {
    descEn: "Verify passports, NIDs & certificates",
    descBn: "পাসপোর্ট, এনআইডি এবং সার্টিফিকেট যাচাই",
    icon: <FileText className="h-3.5 w-3.5" />,
    color: "text-teal-600 dark:text-teal-400",
    badgeColor:
      "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900/40",
  },
  "Visa Officer": {
    descEn: "Visa submissions & sticker stamping",
    descBn: "ভিসা আবেদন এবং স্টিকার স্ট্যাম্পিং",
    icon: <Globe className="h-3.5 w-3.5" />,
    color: "text-amber-600 dark:text-amber-400",
    badgeColor:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40",
  },
  "Accounts Officer": {
    descEn: "Invoice postings, cash receipts & ledger",
    descBn: "ইনভয়েস পোস্টিং ও হিসাব খাতা",
    icon: <Receipt className="h-3.5 w-3.5" />,
    color: "text-emerald-600 dark:text-emerald-400",
    badgeColor:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40",
  },
  Agent: {
    descEn: "Track referred applicants & quota stats",
    descBn: "রেফার করা আবেদনকারী ও কোটা ট্র্যাকিং",
    icon: <Handshake className="h-3.5 w-3.5" />,
    color: "text-amber-700 dark:text-amber-500",
    badgeColor:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-500 dark:border-amber-900/40",
  },
  Applicant: {
    descEn: "View visa status, invoices & appointments",
    descBn: "ভিসা স্ট্যাটাস এবং মেডিকেল অ্যাপয়েন্টমেন্ট",
    icon: <User className="h-3.5 w-3.5" />,
    color: "text-sky-600 dark:text-sky-400",
    badgeColor:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/40",
  },
};

// Hover popover card for a quick-login chip
function QuickLoginChip({
  mockUser,
  isSubmitting,
  isThisSubmitting,
  onLogin,
  locale,
}: {
  mockUser: { id: string; email: string; fullName: string; roleName: string };
  isSubmitting: boolean;
  isThisSubmitting: boolean;
  onLogin: (email: string) => void;
  locale: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState<"email" | "pass" | null>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const details = ROLE_DETAILS[mockUser.roleName] || {
    descEn: "Click to sign in",
    descBn: "সাইন ইন করতে ক্লিক করুন",
    icon: <User className="h-3.5 w-3.5" />,
    color: "text-slate-500",
    badgeColor:
      "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700",
  };

  const password = SEEDED_PASSWORDS[mockUser.email] || "—";

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHovered(true);
  };
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setHovered(false), 180);
  };

  const copyToClipboard = (text: string, field: "email" | "pass") => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(field);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div
      ref={chipRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Compact chip row */}
      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => !isSubmitting && onLogin(mockUser.email)}
        className={`group w-full flex items-center gap-2.5 rounded-xl border border-border-theme bg-white dark:bg-slate-900/50 px-3 py-2 text-left transition-all duration-200 hover:border-primary-theme hover:shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
          isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } ${hovered ? "border-primary-theme shadow-sm" : ""}`}
      >
        {/* Icon */}
        <span className={`shrink-0 ${details.color}`}>{details.icon}</span>

        {/* Name + email */}
        <span className="flex-1 min-w-0">
          <span className="block text-xs font-semibold text-text-theme truncate leading-tight">
            {mockUser.fullName}
          </span>
          <span className="block text-[10px] text-text-soft font-mono truncate leading-tight">
            {mockUser.email}
          </span>
        </span>

        {/* Badge */}
        <span
          className={`shrink-0 hidden sm:inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${details.badgeColor}`}
        >
          {mockUser.roleName.split(" ")[0]}
        </span>

        {/* Loader or arrow */}
        {isThisSubmitting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-theme shrink-0" />
        ) : (
          <UserCheck className="h-3.5 w-3.5 text-text-soft group-hover:text-primary-theme transition-colors shrink-0" />
        )}
      </button>

      {/* Hover popover — absolutely positioned, floats above sibling chips */}
      {hovered && (
        <div
          className="absolute left-0 right-0 z-50 mt-1.5 rounded-2xl border border-border-theme bg-white dark:bg-slate-900 shadow-2xl p-3.5 space-y-2.5 login-popover-enter"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className={`${details.color}`}>{details.icon}</span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${details.badgeColor}`}
            >
              {mockUser.roleName}
            </span>
          </div>

          {/* Name */}
          <p className="text-sm font-bold text-text-theme">{mockUser.fullName}</p>

          {/* Description */}
          <p className="text-[11px] text-text-soft leading-relaxed">
            {locale === "bn" ? details.descBn : details.descEn}
          </p>

          {/* Credentials */}
          <div className="space-y-1.5 pt-1 border-t border-border-theme/60">
            {/* Email row */}
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 px-2 py-1.5">
              <Mail className="h-3 w-3 text-text-soft shrink-0" />
              <span className="flex-1 text-[10px] font-mono text-text-theme truncate">
                {mockUser.email}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(mockUser.email, "email");
                }}
                className="shrink-0 text-text-soft hover:text-primary-theme transition-colors"
                title="Copy email"
              >
                {copied === "email" ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
            {/* Password row */}
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 px-2 py-1.5">
              <Lock className="h-3 w-3 text-text-soft shrink-0" />
              <span className="flex-1 text-[10px] font-mono text-text-theme truncate">
                {password}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(password, "pass");
                }}
                className="shrink-0 text-text-soft hover:text-primary-theme transition-colors"
                title="Copy password"
              >
                {copied === "pass" ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => !isSubmitting && onLogin(mockUser.email)}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary-theme hover:bg-primary-hover py-2 text-xs font-bold text-white transition-all duration-150 disabled:opacity-50"
          >
            <span>Sign in as {mockUser.roleName}</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  const { allUsers, login } = useMockAuth();
  const { t, locale } = useT();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingEmail, setSubmittingEmail] = useState<string | null>(null);

  // Read activated param once on mount
  React.useEffect(() => {
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
    setSubmittingEmail(email);
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || t("auth.invalidCredentials") || "Invalid credentials.");
      setIsSubmitting(false);
      setSubmittingEmail(null);
    }
  };

  const handleQuickLogin = async (mockEmail: string) => {
    const mockPassword = SEEDED_PASSWORDS[mockEmail];
    if (!mockPassword) return;
    setEmail(mockEmail);
    setPassword(mockPassword);
    setIsSubmitting(true);
    setSubmittingEmail(mockEmail);
    setError(null);
    try {
      await login(mockEmail, mockPassword);
    } catch (err: any) {
      setError(err.message || t("auth.quickLoginFailed") || "Quick login failed.");
      setIsSubmitting(false);
      setSubmittingEmail(null);
    }
  };

  return (
    /*
      On large screens: full viewport height, no scroll.
      On small screens: allow natural scroll since content may not fit.
    */
    <div className="min-h-screen lg:h-screen bg-bg flex items-center justify-center p-4 lg:p-6 overflow-y-auto lg:overflow-hidden">
      <div className="w-full max-w-6xl">
        <div
          className="
            overflow-hidden rounded-3xl bg-surface shadow-2xl border border-border-theme
            flex flex-col lg:flex-row
            /* On large screens, fill available height without overflowing */
            lg:h-[calc(100vh-3rem)] lg:max-h-[820px]
          "
        >
          {/* ── Brand / Feature Pane ── */}
          <div className="lg:w-5/12 bg-[#090d16] text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden shrink-0">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-theme/20 rounded-full blur-3xl -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-red/10 rounded-full blur-3xl -ml-20 -mb-20" />

            <div className="relative z-10 space-y-7">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <img
                  src="/visatek_logo_transparent.png"
                  alt="VisaTek Logo"
                  className="h-11 w-auto max-w-[200px] object-contain"
                />
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/10 text-white/90 font-mono">
                  ERP
                </span>
              </div>

              {/* Tagline */}
              <div className="space-y-3 pt-2">
                <h1 className="text-3xl font-extrabold tracking-tight leading-tight text-white lg:text-4xl">
                  Enterprise-Grade <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-rose-400">
                    Visa &amp; Manpower ERP
                  </span>
                </h1>
                <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
                  Streamlining global migration pipeline, document verification,
                  multi-tenant agent management, and automated invoicing.
                </p>
              </div>

              {/* Highlights */}
              <div className="space-y-3 pt-2">
                {[
                  {
                    icon: <Building2 className="h-4 w-4" />,
                    color: "text-blue-400",
                    label: "Multi-Tenant Agency Isolation",
                  },
                  {
                    icon: <Sparkles className="h-4 w-4" />,
                    color: "text-emerald-400",
                    label: "Real-time Candidate Pipeline Tracking",
                  },
                  {
                    icon: <FileText className="h-4 w-4" />,
                    color: "text-purple-400",
                    label: "Secure Document Management & Audit Trails",
                  },
                ].map(({ icon, color, label }) => (
                  <div key={label} className="flex items-center gap-3 text-xs text-slate-300">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 ${color} shrink-0`}
                    >
                      {icon}
                    </div>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span>© 2026 VisaTek ERP. All rights reserved.</span>
              <span className="flex items-center gap-1">
                <Globe2 className="h-3 w-3" /> Secure SSL
              </span>
            </div>
          </div>

          {/* ── Form + Quick-Login Pane ── */}
          <div className="lg:w-7/12 flex flex-col min-h-0 bg-surface">
            {/* Scrollable inner — on large screens this panel scrolls independently */}
            <div className="flex-1 overflow-y-auto p-7 lg:p-10 space-y-6 scrollbar-thin">
              <div className="max-w-xl mx-auto space-y-6">

                {/* Header */}
                <div className="space-y-1">
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-theme">
                    {t("auth.title") || "Staff & Partner Secure Sign-In"}
                  </h2>
                  <p className="text-xs md:text-sm text-text-soft font-semibold leading-relaxed">
                    {t("auth.subtitle") ||
                      "Enter your organizational credentials to access the platform."}
                  </p>
                </div>

                {/* Alerts */}
                {successMessage && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 text-xs text-emerald-700 dark:border-emerald-950/30 dark:bg-emerald-950/10 dark:text-emerald-400">
                    <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600 mt-0.5 dark:text-emerald-400" />
                    <div>
                      <strong className="font-bold block text-xs mb-0.5">Success</strong>
                      <p className="text-xs text-emerald-600/90 dark:text-emerald-400/90 font-semibold">
                        {successMessage}
                      </p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50/50 p-3.5 text-xs text-rose-700 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-400 animate-shake">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <strong className="font-bold block text-xs mb-0.5">
                        {t("auth.authErrorTitle") || "Authentication Error"}
                      </strong>
                      <p className="text-xs text-rose-600/90 dark:text-rose-400/90 font-semibold">
                        {error}
                      </p>
                    </div>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-text-theme">
                      {t("auth.emailLabel") || "Email Address"}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-soft">
                        <Mail className="h-4 w-4" />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@agency.com"
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-border-theme bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary-theme focus:ring-1 focus:ring-primary-theme text-text-theme disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-text-theme">
                      {t("auth.passwordLabel") || "Password"}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-soft">
                        <Lock className="h-4 w-4" />
                      </span>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-border-theme bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary-theme focus:ring-1 focus:ring-primary-theme text-text-theme disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-theme hover:bg-primary-hover py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-70 mt-2"
                  >
                    {isSubmitting && submittingEmail === email ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>{t("auth.verifying") || "Verifying credentials..."}</span>
                      </>
                    ) : (
                      <>
                        <span>{t("auth.signInBtn") || "Sign In to ERP"}</span>
                        <ArrowRight className="h-4 w-4 text-white" />
                      </>
                    )}
                  </button>
                </form>

                {/* Quick-login section */}
                <div className="border-t border-border-theme pt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-text-theme">
                        {t("auth.devQuickSignIn") || "Developer Quick Sign-In"}
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide">
                          RBAC Demo
                        </span>
                      </h3>
                      <p className="text-[11px] text-text-soft mt-0.5">
                        Hover any role to preview credentials · Click to sign in instantly
                      </p>
                    </div>
                  </div>

                  {/* Compact chip list — 2 columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {allUsers.map((mockUser) => (
                      <QuickLoginChip
                        key={mockUser.id}
                        mockUser={mockUser}
                        isSubmitting={isSubmitting}
                        isThisSubmitting={
                          isSubmitting && submittingEmail === mockUser.email
                        }
                        onLogin={handleQuickLogin}
                        locale={locale}
                      />
                    ))}
                  </div>
                </div>

                {/* Compliance note */}
                <div className="flex gap-2.5 rounded-xl border border-amber-100 bg-amber-50/30 p-3.5 dark:border-amber-950/30 dark:bg-amber-950/10">
                  <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0 mt-0.5 dark:text-amber-500" />
                  <p className="text-xs text-amber-800/80 leading-relaxed font-semibold dark:text-amber-400/80">
                    <strong>{t("auth.complianceNotice") || "Security Compliance"}:</strong>{" "}
                    {t("auth.complianceNoteDesc") ||
                      "System enforces tenant isolated logging, strict RBAC permissions, and auto-lockout policies."}
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
