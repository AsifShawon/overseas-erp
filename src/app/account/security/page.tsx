"use client";

import React, { useState } from "react";
import { useMockAuth } from "@/context/MockAuthContext";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { Eye, EyeOff, Lock, ShieldAlert, CheckCircle, Loader2 } from "lucide-react";
import { useT } from "@/i18n/useT";

export default function AccountSecurityPage() {
  const { accessToken, logout } = useMockAuth();
  const toast = useToast();
  const { t, locale } = useT();

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

    // 1. Client-side validations
    if (!currentPassword) {
      setErrorMsg(t("security.currentPasswordRequired"));
      return;
    }
    if (newPassword.length < 12) {
      setErrorMsg(locale === "bn" ? "নতুন পাসওয়ার্ড কমপক্ষে ১২ অক্ষরের হতে হবে।" : "New password must be at least 12 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg(t("security.passwordsDoNotMatch"));
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMsg(t("security.passwordMustBeDifferent"));
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
        throw new Error(data.error || t("security.failedUpdatePassword"));
      }

      setSuccessMsg(t("security.passwordSuccess"));
      toast.success(t("security.passwordSuccessToast"));
      
      // Clear inputs
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Force user to log in again after 3 seconds to establish new secure session
      setTimeout(() => {
        logout();
      }, 3000);

    } catch (err: any) {
      const msg = err.message || t("security.passwordErrorDefault");
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("security.title")}
        description={t("security.description")}
        breadcrumbs={[
          { label: locale === "bn" ? "ড্যাশবোর্ড" : "ERP Hub", href: "/dashboard" },
          { label: t("security.title") }
        ]}
      />

      <div className="max-w-2xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl border border-border-theme bg-surface p-6 md:p-8 shadow-xl transition-all">
          {/* Neon side accents for premium wow design */}
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500" />
          
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-theme">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-theme">{t("security.changePassword")}</h2>
              <p className="text-xs text-text-soft">{t("security.changePasswordDesc")}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50/50 p-3.5 text-xs text-rose-800 dark:border-rose-950/40 dark:bg-rose-950/20 dark:text-rose-400">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3.5 text-xs text-emerald-800 dark:border-emerald-950/40 dark:bg-emerald-950/20 dark:text-emerald-400">
                <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Current Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-theme" htmlFor="currentPassword">
                {t("security.currentPassword")}
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t("security.enterCurrentPassword")}
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

            {/* New Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-theme" htmlFor="newPassword">
                {t("security.newPassword")}
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("security.chooseNewPassword")}
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
              <p className="text-[10px] text-text-soft">{locale === "bn" ? "পাসওয়ার্ড কমপক্ষে ১২ অক্ষরের হতে হবে।" : "Password must be at least 12 characters long."}</p>
            </div>

            {/* Confirm New Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-theme" htmlFor="confirmPassword">
                {t("security.confirmNewPassword")}
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("security.confirmNewPasswordPlaceholder")}
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

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-theme px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-600 transition-colors shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("security.updatingCredentials")}
                  </>
                ) : (
                  t("security.changePassword")
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
