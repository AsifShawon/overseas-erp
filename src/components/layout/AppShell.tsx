"use client";

import React, { useState } from "react";
import { MockAuthProvider, useMockAuth } from "@/context/MockAuthContext";
import { useToast } from "@/context/ToastContext";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Eye, EyeOff, Lock, ShieldAlert, CheckCircle, Loader2, Globe2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

function ForcePasswordReset() {
  const { accessToken, logout } = useMockAuth();
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Frontend validations
    if (!currentPassword) {
      setErrorMsg("Current password is required.");
      return;
    }
    if (newPassword.length < 12) {
      setErrorMsg("New password must be at least 12 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMsg("New password must be different from current password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to change temporary password.");
      }

      setSuccessMsg("Password updated successfully! Logging you out in 3 seconds...");
      toast.success("Password changed successfully.");

      // Clear inputs
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Force logout after 3 seconds
      setTimeout(() => {
        logout();
      }, 3000);

    } catch (err: any) {
      const msg = err.message || "An unexpected error occurred.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md relative overflow-hidden rounded-2xl border border-border-theme bg-surface p-6 md:p-8 shadow-2xl transition-all">
        {/* Glow styling accent */}
        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500" />

        <div className="flex flex-col items-center text-center mb-6 space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Lock className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-text-theme">Hardened Password Required</h2>
            <p className="text-xs text-text-soft leading-relaxed px-4">
              Your account has been provisioned with temporary credentials. You must set a new secure password before accessing the system.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50/50 p-3 text-xs text-rose-800 dark:border-rose-950/40 dark:bg-rose-950/20 dark:text-rose-400">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-800 dark:border-emerald-950/40 dark:bg-emerald-950/20 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current Temporary Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-theme" htmlFor="currentPassword">
              Temporary / Current Password
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter temporary password"
                disabled={loading}
                className="w-full rounded-lg border border-border-theme bg-bg py-2 pl-3 pr-10 text-xs outline-none transition-all focus:border-primary-theme focus:bg-surface focus:ring-1 focus:ring-primary-theme text-text-theme"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-soft hover:text-text-theme"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-theme" htmlFor="newPassword">
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Choose a strong new password"
                disabled={loading}
                className="w-full rounded-lg border border-border-theme bg-bg py-2 pl-3 pr-10 text-xs outline-none transition-all focus:border-primary-theme focus:bg-surface focus:ring-1 focus:ring-primary-theme text-text-theme"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-soft hover:text-text-theme"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[10px] text-text-soft">Password must be at least 12 characters long.</p>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-theme" htmlFor="confirmPassword">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                disabled={loading}
                className="w-full rounded-lg border border-border-theme bg-bg py-2 pl-3 pr-10 text-xs outline-none transition-all focus:border-primary-theme focus:bg-surface focus:ring-1 focus:ring-primary-theme text-text-theme"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-soft hover:text-text-theme"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-theme px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-600 transition-colors shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Hardening Credentials...
                </>
              ) : (
                "Set Secure Password"
              )}
            </button>
            <button
              type="button"
              onClick={logout}
              className="w-full text-center py-2 text-[10px] text-text-muted hover:text-danger-theme transition-colors font-semibold"
            >
              Cancel & Log Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InnerAppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useMockAuth();
  const pathname = usePathname();
  const router = useRouter();

  // If user is flagged to force change their password, bypass entire ERP navigation frame
  if (user && user.mustChangePassword) {
    return <ForcePasswordReset />;
  }

  // 1. Platform pages guard: platform pages require isPlatformAdmin
  if (pathname.startsWith("/platform") && !user.isPlatformAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-950 shadow-xl border border-slate-100 dark:border-slate-800 rounded-2xl p-6 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Access Denied
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            You do not have permission to access the platform administration area.
          </p>
          <button
            onClick={() => router.push(user.roleName === "Applicant" ? "/applicant/portal" : "/dashboard")}
            className="w-full rounded-lg bg-slate-950 dark:bg-slate-50 dark:text-slate-950 text-white font-semibold py-2 text-xs transition-colors hover:bg-slate-800 dark:hover:bg-slate-200"
          >
            Go Back to Safety
          </button>
        </div>
      </div>
    );
  }

  // 2. ERP pages guard: require activeCompanyId + companyStatus ACTIVE
  const isApplicant = user.roleName === "Applicant";
  const isPlatformAdminOnly = user.isPlatformAdmin && !user.activeCompanyId;
  // Redirect platform-only admins to the platform area.
  // Call the hook unconditionally to preserve hook order between renders.
  React.useEffect(() => {
    if (isPlatformAdminOnly && !pathname.startsWith("/platform")) {
      router.push("/platform");
    }
  }, [isPlatformAdminOnly, pathname, router]);

  if (!isApplicant && !pathname.startsWith("/platform")) {
    if (isPlatformAdminOnly) {
      return (
        <div className="min-h-screen bg-bg text-text-theme flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary-theme animate-spin" />
        </div>
      );
    }

    if (!user.activeCompanyId || user.companyStatus !== "ACTIVE") {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-950 shadow-xl border border-slate-100 dark:border-slate-800 rounded-2xl p-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Workspace Inactive
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {user.activeCompanyId 
                ? `Your workspace (${user.activeCompanyName}) is currently inactive or suspended. Please contact platform administration to restore access.`
                : "No active company workspace is available for this account."}
            </p>
            <button
              onClick={logout}
              className="w-full rounded-lg bg-slate-950 dark:bg-slate-50 dark:text-slate-950 text-white font-semibold py-2 text-xs transition-colors hover:bg-slate-800 dark:hover:bg-slate-200"
            >
              Log Out
            </button>
          </div>
        </div>
      );
    }
  }

  // If user is Applicant, render a centered, mobile-responsive layout without sidebars
  if (isApplicant) {
    return (
      <div className="min-h-screen bg-bg text-text-theme flex flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
          <div className="mx-auto max-w-5xl w-full">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text-theme flex">
      {/* Sidebar Navigation */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Layout Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
        } pl-0`}
      >
        <Topbar onMenuClick={() => setMobileOpen(!mobileOpen)} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl w-full space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <MockAuthProvider>
      <InnerAppShell>{children}</InnerAppShell>
    </MockAuthProvider>
  );
}
export default AppShell;
