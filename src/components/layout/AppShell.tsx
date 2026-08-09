"use client";

import React, { useState } from "react";
import { MockAuthProvider, useMockAuth } from "@/context/MockAuthContext";
import { useToast } from "@/context/ToastContext";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Eye, EyeOff, Lock, ShieldAlert, CheckCircle, Loader2, Globe2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

function ForcePasswordReset() {
  const { accessToken, logout, updateUser } = useMockAuth();
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
    if (newPassword.length < 8) {
      setErrorMsg("New password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword) || !/[!@#$%^&*(),.?":{}|<>_+\-\[\]\/\\~`|';]/.test(newPassword)) {
      setErrorMsg("New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (e.g., #, @, !, etc.).");
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

      setSuccessMsg("Password updated successfully! Redirecting you to the dashboard...");
      toast.success("Password changed successfully.");

      // Clear inputs
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Update state to remove force reset view and show dashboard directly
      setTimeout(() => {
        updateUser({ mustChangePassword: false });
      }, 1500);

    } catch (err: any) {
      const msg = err.message || "An unexpected error occurred.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md relative overflow-hidden rounded-card border border-border-theme bg-surface p-6 md:p-8 shadow-md transition-all">
        <div className="flex flex-col items-center text-center mb-6 space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-soft text-warning-theme border border-warning-theme/25">
            <Lock className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-text-theme">Password Change Required</h2>
            <p className="text-xs text-text-soft leading-relaxed px-4">
              Your account has been provisioned with temporary credentials. You must set a new secure password before accessing the system.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div role="alert" className="flex items-start gap-2 rounded-md border border-danger-theme/25 bg-danger-soft p-3 text-xs text-danger-theme">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div role="status" className="flex items-start gap-2 rounded-md border border-success-theme/25 bg-success-soft p-3 text-xs text-success-theme">
              <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
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
                className="h-10 w-full rounded-md border border-input-border bg-input-bg pl-3 pr-10 text-xs text-text-theme"
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
                className="h-10 w-full rounded-md border border-input-border bg-input-bg pl-3 pr-10 text-xs text-text-theme"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-soft hover:text-text-theme"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[10px] text-text-soft">Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters (e.g. #, @, !, etc.).</p>
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
                className="h-10 w-full rounded-md border border-input-border bg-input-bg pl-3 pr-10 text-xs text-text-theme"
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
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary-theme px-4 text-xs font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                "Set New Password"
              )}
            </button>
            <button
              type="button"
              onClick={logout}
              className="w-full text-center py-2 text-[11px] text-text-muted hover:text-danger-theme transition-colors font-medium cursor-pointer"
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
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-card border border-border-theme bg-surface p-6 text-center shadow-md space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger-theme">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-semibold text-text-theme">
            Access Denied
          </h2>
          <p className="mx-auto max-w-sm text-xs leading-relaxed text-text-muted">
            You do not have permission to access the platform administration area.
          </p>
          <button
            onClick={() => router.push(user.roleName === "Applicant" ? "/applicant/portal" : "/dashboard")}
            className="h-9.5 w-full rounded-md bg-primary-theme text-xs font-semibold text-white transition-colors hover:bg-primary-hover cursor-pointer"
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
        <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md rounded-card border border-border-theme bg-surface p-6 text-center shadow-md space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger-theme">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-semibold text-text-theme">
              Workspace Inactive
            </h2>
            <p className="mx-auto max-w-sm text-xs leading-relaxed text-text-muted">
              {user.activeCompanyId 
                ? `Your workspace (${user.activeCompanyName}) is currently inactive or suspended. Please contact platform administration to restore access.`
                : "No active company workspace is available for this account."}
            </p>
            <button
              onClick={logout}
              className="h-9.5 w-full rounded-md bg-primary-theme text-xs font-semibold text-white transition-colors hover:bg-primary-hover cursor-pointer"
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
        className={`flex-1 flex flex-col min-w-0 transition-[padding] duration-200 ${
          sidebarCollapsed ? "lg:pl-18" : "lg:pl-60"
        } pl-0`}
      >
        <Topbar onMenuClick={() => setMobileOpen(!mobileOpen)} />
        {/*
          Operational ERP screens are full-bleed on purpose — no narrow centered
          column. Padding: 16px mobile / 20-24px tablet / 28px desktop.
        */}
        <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7">
          <div className="w-full space-y-5">{children}</div>
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
