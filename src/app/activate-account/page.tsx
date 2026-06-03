// src/app/activate-account/page.tsx
// Client-side Page for Company Owner activation and first password configuration

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { useToast } from "@/context/ToastContext";

function ActivateAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");

  // Form states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Activation token is missing from the URL.");
      setLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        const res = await fetch(`/api/auth/activate-account?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          setTokenValid(true);
          setEmail(data.email);
          setCompanyName(data.companyName || "");
        } else {
          setError(data.error || "This activation link is invalid, expired, or has already been used.");
        }
      } catch (err) {
        console.error("Token validation error:", err);
        setError("Failed to validate activation token. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 12) {
      setError("Password must be at least 12 characters long.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/activate-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        toast.success("Your account is activated. Please log in.");
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login?activated=true");
        }, 2000);
      } else {
        setError(data.error || "Failed to activate account.");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Activation error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary-theme" />
        <p className="text-xs text-text-soft font-semibold">Validating activation credentials...</p>
      </div>
    );
  }

  if (error && !tokenValid && !success) {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-border-theme bg-surface/80 backdrop-blur-md p-6 lg:p-8 shadow-xl text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-text-theme">Activation Link Error</h3>
          <p className="text-xs text-text-soft leading-relaxed">
            {error}
          </p>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-theme hover:bg-bg py-3 text-xs font-bold text-text-theme transition-colors cursor-pointer"
        >
          Return to Sign In
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-border-theme bg-surface/80 backdrop-blur-md p-6 lg:p-8 shadow-xl text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-text-theme">Account Activated!</h3>
          <p className="text-xs text-text-soft leading-relaxed">
            Your credentials have been successfully configured. You will be redirected to the sign-in portal shortly.
          </p>
        </div>
        <button
          onClick={() => router.push("/login?activated=true")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-theme hover:bg-primary-hover py-3 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          Proceed to Login
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border-theme bg-surface/80 backdrop-blur-md p-6 lg:p-8 shadow-xl space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-text-theme">Activate Workspace Admin</h3>
        <p className="text-[11px] text-text-soft leading-relaxed">
          Configure a secure password to unlock your ERP dashboard.
        </p>
      </div>

      {/* Target details */}
      <div className="rounded-xl bg-bg border border-border-theme/60 p-4 space-y-2.5 text-xs text-text-theme font-medium">
        <div>
          <span className="text-[10px] text-text-soft uppercase tracking-wider block mb-0.5">Workspace Tenant</span>
          <p className="font-bold text-primary-theme">{companyName || "Your ERP Company"}</p>
        </div>
        <div>
          <span className="text-[10px] text-text-soft uppercase tracking-wider block mb-0.5">Admin Email</span>
          <p className="font-mono font-semibold">{email}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50/50 p-3.5 text-xs text-rose-700 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-400 animate-shake">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600 mt-0.5" />
          <p className="text-[10px] text-rose-600/90 dark:text-rose-400/90 font-medium leading-relaxed">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-text-soft uppercase tracking-wider mb-1.5">
            New Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-soft">
              <Lock className="h-4 w-4" />
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 12 characters"
              disabled={isSubmitting}
              className="w-full rounded-xl border border-border-theme bg-bg py-2.5 pl-10 pr-4 text-xs outline-none transition-all focus:border-primary-theme focus:bg-surface focus:ring-1 focus:ring-primary-theme text-text-theme disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-text-soft uppercase tracking-wider mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-soft">
              <Lock className="h-4 w-4" />
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
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
              <span>Saving credentials...</span>
            </>
          ) : (
            <>
              <span>Activate Account</span>
              <ArrowRight className="h-4 w-4 text-white" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function ActivateAccountPage() {
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
          Multi-Tenant Corporate Administration & Operations Platform
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex h-96 flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary-theme" />
            <p className="text-xs text-text-soft font-semibold">Loading page resources...</p>
          </div>
        }
      >
        <ActivateAccountContent />
      </Suspense>
    </div>
  );
}
