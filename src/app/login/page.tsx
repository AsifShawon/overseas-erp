"use client";

import React from "react";
import { useMockAuth } from "@/context/MockAuthContext";
import { useRouter } from "next/navigation";
import { Globe2, ShieldAlert, ArrowRight, UserCheck } from "lucide-react";

export default function LoginPage() {
  const { allUsers, switchRole } = useMockAuth();
  const router = useRouter();

  const handleQuickLogin = (userId: string, roleName: string) => {
    switchRole(userId);
    if (roleName === "Applicant") {
      router.push("/applicant/portal");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      {/* Brand Logo Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-indigo-400 shadow-md">
          <Globe2 className="h-6 w-6 animate-spin-slow" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Overseas Recruitment ERP
        </h2>
        <p className="mx-auto max-w-md text-xs text-slate-500">
          Proprietary company portal for regulatory logistics, compliance vetting, and accounts ledger management.
        </p>
      </div>

      {/* Warning/Security Info Card */}
      <div className="mt-8 rounded-xl border border-amber-100 bg-amber-50/40 p-4 dark:border-amber-950/20 dark:bg-amber-950/10">
        <div className="flex gap-2">
          <ShieldAlert className="h-4.5 w-4.5 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-800 dark:text-amber-400">
            <strong>Internal Enterprise Warning:</strong> Unauthorized access attempts are flagged and committed to the immutable system audit log. Use the quick-select cards below to simulate logins for any of the 8 default system roles.
          </p>
        </div>
      </div>

      {/* Grid of Mock Role Selectors */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {allUsers.map((mockUser) => {
          let badgeColor = "bg-slate-100 text-slate-700";
          if (mockUser.roleName === "Super Admin") badgeColor = "bg-rose-50 text-rose-700 border-rose-100";
          else if (mockUser.roleName === "Operations Admin") badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-100";
          else if (mockUser.roleName === "Accounts Officer") badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
          else if (mockUser.roleName === "Agent") badgeColor = "bg-amber-50 text-amber-700 border-amber-100";
          else if (mockUser.roleName === "Applicant") badgeColor = "bg-sky-50 text-sky-700 border-sky-100";

          return (
            <div
              key={mockUser.id}
              onClick={() => handleQuickLogin(mockUser.id, mockUser.roleName)}
              className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-center justify-between">
                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase ${badgeColor}`}>
                  {mockUser.roleName}
                </span>
                <UserCheck className="h-4 w-4 text-slate-300 group-hover:text-indigo-500" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-white truncate">
                {mockUser.fullName}
              </h3>
              <p className="mt-1 text-[10px] text-slate-400 truncate">
                {mockUser.email}
              </p>
              <div className="mt-4 flex items-center gap-1 text-[9px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-all dark:text-indigo-400">
                Enter Portal <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
