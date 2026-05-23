// src/app/login/page.tsx
// Upgraded Login Page (Phase 2)
// Contains functional email/password form + interactive auto-fill developer helper cards

"use client";

import React, { useState } from "react";
import { useMockAuth } from "@/context/MockAuthContext";
import { useRouter } from "next/navigation";
import { Globe2, ShieldAlert, ArrowRight, UserCheck, Lock, Mail, Loader2, AlertCircle } from "lucide-react";
import { useT } from "@/i18n/useT";

// Password map for seeded users to power developer quick sign-in cards
const SEEDED_PASSWORDS: Record<string, string> = {
  "admin@agency.com": "SuperAdmin@2026!",
  "ops@agency.com": "OpsAdmin@2026!",
  "hr@agency.com": "HrOfficer@2026!",
  "docs@agency.com": "DocsOfficer@2026!",
  "visa@agency.com": "VisaOfficer@2026!",
  "accounts@agency.com": "Accounts@2026!",
  "agent@agent.com": "AgentKabir@2026!",
  "applicant@applicant.com": "Applicant@2026!",
};

export default function LoginPage() {
  const { allUsers, login } = useMockAuth();
  const router = useRouter();
  const { t } = useT();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t("auth.fillAllFields"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || t("auth.invalidCredentials"));
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
      setError(err.message || t("auth.quickLoginFailed"));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:py-16">
      {/* Brand Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center justify-center">
          <img
            src="/visatek_logo_transparent.png"
            alt="VisaTek Logo"
            className="h-16 w-auto object-contain"
          />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-text-theme">
          VisaTek ERP
        </h2>
        <p className="mx-auto max-w-md text-xs text-text-soft font-medium">
          {t("auth.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Left Side: Real Credentials Login Form */}
        <div className="lg:col-span-5 rounded-2xl border border-border-theme bg-surface/80 backdrop-blur-md p-6 lg:p-8 shadow-xl">
          <h3 className="text-lg font-bold text-text-theme mb-2">
            {t("auth.title")}
          </h3>
          <p className="text-[11px] text-text-soft mb-6 leading-relaxed">
            {t("auth.subtitle")}
          </p>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50/50 p-3.5 text-xs text-rose-700 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-400 animate-shake">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <strong className="font-bold block text-[11px] mb-0.5">{t("auth.authErrorTitle")}</strong>
                <p className="text-[10px] text-rose-600/90 dark:text-rose-400/90 font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-text-soft uppercase tracking-wider mb-1.5">
                {t("auth.emailLabel")}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-soft">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@agency.com"
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-border-theme bg-bg py-2.5 pl-10 pr-4 text-xs outline-none transition-all focus:border-primary-theme focus:bg-surface focus:ring-1 focus:ring-primary-theme text-text-theme disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-text-soft uppercase tracking-wider mb-1.5">
                {t("auth.passwordLabel")}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-soft">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-border-theme bg-bg py-2.5 pl-10 pr-4 text-xs outline-none transition-all focus:border-primary-theme focus:bg-surface focus:ring-1 focus:ring-primary-theme text-text-theme disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-theme hover:bg-primary-hover py-3 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>{t("auth.verifying")}</span>
                </>
              ) : (
                <>
                  <span>{t("auth.signInBtn")}</span>
                  <ArrowRight className="h-4 w-4 text-white" />
                </>
              )}
            </button>
          </form>

          {/* Security Compliance Note */}
          <div className="mt-6 flex gap-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 dark:border-amber-950/40 dark:bg-amber-950/20">
            <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0 mt-0.5 dark:text-amber-500" />
            <p className="text-[9px] text-amber-800/80 leading-relaxed font-medium dark:text-amber-400/80">
              <strong>{t("auth.complianceNotice")}:</strong> {t("auth.complianceNoteDesc")}
            </p>
          </div>
        </div>

        {/* Right Side: Interactive Quick sign-in list */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-border-theme bg-surface-soft p-5">
            <h3 className="text-sm font-bold text-text-theme mb-1">
              {t("auth.devQuickSignIn")}
            </h3>
            <p className="text-[10px] text-text-soft leading-relaxed">
              {t("auth.devQuickSignInDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {allUsers.map((mockUser) => {
              let badgeColor = "bg-slate-100 text-slate-700 border-slate-200/60";
              if (mockUser.roleName === "Super Admin") badgeColor = "bg-rose-50 text-rose-700 border-rose-100/60 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30";
              else if (mockUser.roleName === "Operations Admin") badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-100/60 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30";
              else if (mockUser.roleName === "Accounts Officer") badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100/60 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
              else if (mockUser.roleName === "Agent") badgeColor = "bg-amber-50 text-amber-700 border-amber-100/60 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
              else if (mockUser.roleName === "Applicant") badgeColor = "bg-sky-50 text-sky-700 border-sky-100/60 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30";

              const isUserSubmitting = isSubmitting && email === mockUser.email;

              return (
                <div
                  key={mockUser.id}
                  onClick={() => !isSubmitting && handleQuickLogin(mockUser.email)}
                  className={`group cursor-pointer rounded-xl border border-border-theme bg-surface p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-theme hover:shadow-md ${
                    isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full border px-2 py-0.5 text-[8px] font-bold tracking-wide uppercase ${badgeColor}`}>
                      {t(`roles.${mockUser.roleName}`) || mockUser.roleName}
                    </span>
                    {isUserSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary-theme" />
                    ) : (
                      <UserCheck className="h-4 w-4 text-text-soft group-hover:text-primary-theme transition-colors" />
                    )}
                  </div>
                  <h3 className="mt-3.5 text-xs font-bold text-text-theme truncate">
                    {mockUser.fullName}
                  </h3>
                  <p className="mt-0.5 text-[9px] text-text-soft truncate font-mono">
                    {mockUser.email}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-[8px] font-bold text-primary-theme opacity-0 group-hover:opacity-100 transition-all">
                    {t("auth.signInDirectly")} <ArrowRight className="h-2.5 w-2.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
