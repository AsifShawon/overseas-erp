// src/app/login/page.tsx
// Upgraded Login Page (Phase 2)
// Contains functional email/password form + interactive auto-fill developer helper cards

"use client";

import React, { useState } from "react";
import { useMockAuth } from "@/context/MockAuthContext";
import { useRouter } from "next/navigation";
import { Globe2, ShieldAlert, ArrowRight, UserCheck, Lock, Mail, Loader2, AlertCircle } from "lucide-react";

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

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Invalid credentials.");
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
      setError(err.message || "Quick login failed.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:py-16">
      {/* Brand Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-indigo-400 shadow-xl border border-slate-800">
          <Globe2 className="h-7 w-7 text-indigo-400 animate-spin-slow" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
          Overseas Manpower ERP
        </h2>
        <p className="mx-auto max-w-md text-xs text-slate-400 dark:text-slate-500 font-medium">
          Secure Regulatory Logistics, Biometric Clearance, and Commission Ledger Authority.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Left Side: Real Credentials Login Form */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-md p-6 lg:p-8 shadow-xl dark:border-slate-800 dark:bg-slate-950/80">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Secure Staff & Partner Sign In
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-6 leading-relaxed">
            Enter your cryptographically registered enterprise email and secure password.
          </p>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50/50 p-3.5 text-xs text-rose-700 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-400 animate-shake">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <strong className="font-bold block text-[11px] mb-0.5">Authentication Error</strong>
                <p className="text-[10px] text-rose-600/90 dark:text-rose-400/90 font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Enterprise Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@agency.com"
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 hover:bg-slate-900 py-3 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-70 dark:bg-indigo-600 dark:hover:bg-indigo-500"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Verifying Authority...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="h-4 w-4 text-indigo-400 dark:text-white" />
                </>
              )}
            </button>
          </form>

          {/* Security Compliance Note */}
          <div className="mt-6 flex gap-2 rounded-xl border border-amber-100/50 bg-amber-50/20 p-3.5 dark:border-amber-950/20 dark:bg-amber-950/5">
            <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0 mt-0.5 dark:text-amber-500" />
            <p className="text-[9px] text-amber-800/80 leading-relaxed font-medium dark:text-amber-400/80">
              <strong>Compliance Notice:</strong> Unauthorized session requests trigger dynamic IP logging and commit audit traces directly to the PostgreSQL ledger.
            </p>
          </div>
        </div>

        {/* Right Side: Interactive Quick sign-in list */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800/50 dark:bg-slate-950/30">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              Development Quick Sign-In (Dynamic RBAC Simulator)
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
              Click any card to autofill preset credentials and trigger an authentic backend JWT authentication flow against your local PostgreSQL database.
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
                  className={`group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 ${
                    isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full border px-2 py-0.5 text-[8px] font-bold tracking-wide uppercase ${badgeColor}`}>
                      {mockUser.roleName}
                    </span>
                    {isUserSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                    ) : (
                      <UserCheck className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    )}
                  </div>
                  <h3 className="mt-3.5 text-xs font-bold text-slate-800 dark:text-white truncate">
                    {mockUser.fullName}
                  </h3>
                  <p className="mt-0.5 text-[9px] text-slate-400 truncate font-mono">
                    {mockUser.email}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-[8px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-all dark:text-indigo-400">
                    Sign In Directly <ArrowRight className="h-2.5 w-2.5" />
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
