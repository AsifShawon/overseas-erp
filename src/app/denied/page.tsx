"use client";

import React from "react";
import { useMockAuth } from "@/context/MockAuthContext";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

export default function PermissionDeniedPage() {
  const { user } = useMockAuth();

  return (
    <div className="mx-auto w-full max-w-md px-4 py-24 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h2 className="mt-6 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
        Access Restricted (HTTP 403)
      </h2>
      <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto">
        Your current active session profile is bound to the role of <strong>{user.roleName}</strong>, which does not possess the correct database authorization flags required to load this route or view its resource.
      </p>

      <div className="mt-4 rounded-lg bg-slate-50 p-3 text-[10px] text-slate-400 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        Active User Profile: <span className="font-semibold text-slate-700 dark:text-slate-300">{user.fullName}</span><br />
        Session Email ID: <span className="font-semibold text-slate-700 dark:text-slate-300">{user.email}</span>
      </div>

      <div className="mt-8 flex items-center justify-center gap-3">
        <Link
          href="/login"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Switch Roles
        </Link>
        <Link
          href={user.roleName === "Applicant" ? "/applicant/portal" : "/dashboard"}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200"
        >
          <Home className="h-3.5 w-3.5" /> Back to Safety
        </Link>
      </div>
    </div>
  );
}
