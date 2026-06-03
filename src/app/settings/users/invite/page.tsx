// src/app/settings/users/invite/page.tsx
// Frontend screen to invite a new company user

"use client";

import React, { useEffect, useState } from "react";
import { useMockAuth } from "@/context/MockAuthContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserPlus,
  ArrowLeft,
  Loader2,
  Mail,
  User,
  Phone,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string;
}

export default function InviteUserPage() {
  const { user: authUser, accessToken, loading: authLoading, hasAccess } = useMockAuth();
  const router = useRouter();
  const toast = useToast();

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roleId, setRoleId] = useState("");
  const [note, setNote] = useState("");

  // Post-Submit Manual Link Result
  const [inviteResult, setInviteResult] = useState<{
    link: string;
    warning?: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  // Security guard
  useEffect(() => {
    if (!authLoading && (!authUser || !hasAccess("INVITE_COMPANY_USER"))) {
      router.push("/denied");
    }
  }, [authUser, authLoading, router, hasAccess]);

  useEffect(() => {
    if (!accessToken || !authUser || !hasAccess("INVITE_COMPANY_USER")) return;

    const fetchRoles = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/company/roles", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error("Failed to load available roles.");
        const data = await res.json();
        setRoles(data);
        if (data.length > 0) {
          // Pre-select first non-Owner role if possible, e.g. HR or documenting
          const defaultRole = data.find((r: any) => r.name !== "Super Admin") || data[0];
          setRoleId(defaultRole.id);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load roles.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [accessToken, authUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (!fullName || !email || !roleId) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setInviteResult(null);

    try {
      const res = await fetch("/api/company/users/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          fullName,
          email,
          phone: phone || undefined,
          roleId,
          note: note || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to invite user.");
      }

      if (data.emailSent) {
        toast.success(`Invitation email successfully sent to ${email}!`);
        router.push("/settings/users");
      } else {
        // SMTP failed or was skipped, show the link for manual sharing
        setInviteResult({
          link: data.activationLink || "",
          warning: data.emailWarning || "SMTP delivery offline. Copy link below.",
        });
        toast.warning("User invited, but email could not be sent.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to invite user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!inviteResult) return;
    navigator.clipboard.writeText(inviteResult.link);
    setCopied(true);
    toast.success("Activation link copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-theme" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back to List */}
      <Link
        href="/settings/users"
        className="inline-flex items-center gap-1.5 text-xs text-text-soft hover:text-text-theme transition-colors font-semibold"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to User Directory
      </Link>

      {/* Page Header */}
      <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary-theme/10 text-primary-theme border border-primary-theme/20 flex items-center justify-center shrink-0">
          <UserPlus className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h2 className="text-lg font-bold text-text-theme">Invite Team Member</h2>
          <p className="text-[10px] text-text-soft">
            Add a new employee to your company tenant and assign their access permissions.
          </p>
        </div>
      </div>

      {/* Form Container */}
      {!inviteResult ? (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-theme" htmlFor="fullName">
                Full Name <span className="text-danger-theme">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-text-soft" />
                <input
                  id="fullName"
                  type="text"
                  required
                  placeholder="e.g. Asif Shawon"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-border-theme bg-bg py-2.5 pl-10 pr-4 text-xs outline-none focus:border-primary-theme text-text-theme"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-theme" htmlFor="email">
                Email Address <span className="text-danger-theme">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-text-soft" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="e.g. asif@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border-theme bg-bg py-2.5 pl-10 pr-4 text-xs outline-none focus:border-primary-theme text-text-theme"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-theme" htmlFor="phone">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-text-soft" />
                <input
                  id="phone"
                  type="tel"
                  placeholder="e.g. +8801700000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-border-theme bg-bg py-2.5 pl-10 pr-4 text-xs outline-none focus:border-primary-theme text-text-theme"
                />
              </div>
            </div>

            {/* Role Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-theme" htmlFor="roleId">
                System Role <span className="text-danger-theme">*</span>
              </label>
              <select
                id="roleId"
                required
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-3 text-xs outline-none focus:border-primary-theme text-text-theme"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Invitation Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-theme" htmlFor="note">
              Invitation Note / Details (Optional)
            </label>
            <textarea
              id="note"
              placeholder="Provide a custom message or context for this team member..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-24 rounded-xl border border-border-theme bg-bg p-3 text-xs outline-none focus:border-primary-theme text-text-theme resize-none"
            />
          </div>

          {/* Explanation Callout */}
          <div className="rounded-xl bg-primary-theme/5 border border-primary-theme/10 p-4 flex gap-3">
            <ShieldCheck className="h-5 w-5 text-primary-theme shrink-0 mt-0.5" />
            <p className="text-[10px] text-text-soft leading-relaxed">
              <strong>How onboarding works:</strong> Inviting a user reserves their profile in your company. If they are a new user, they will receive an activation email to establish secure login credentials and set their initial account password.
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-border-theme flex justify-end gap-3">
            <Link
              href="/settings/users"
              className="rounded-xl border border-border-theme bg-surface hover:bg-surface-soft px-5 py-2.5 text-xs font-semibold text-text-theme transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary-theme hover:bg-primary-hover px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Invite...
                </>
              ) : (
                "Send Invitation"
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Manual Link Share Callout if SMTP fails/offline */
        <div className="rounded-2xl border border-amber-200 bg-amber-50/20 dark:border-amber-900/30 dark:bg-amber-950/10 p-6 shadow-sm space-y-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400">
                User Provisioned, Email Delivery Skipped
              </h3>
              <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
                Your email delivery gateway is not configured or failed to transmit. Please copy this secure single-use activation link manually and share it with <strong>{email}</strong>:
              </p>
            </div>
          </div>

          <div className="relative">
            <textarea
              readOnly
              value={inviteResult.link}
              onClick={(e) => (e.target as any).select()}
              className="w-full rounded-xl border border-border-theme bg-surface p-3 font-mono text-[11px] outline-none text-text-theme h-24 resize-none pr-12"
            />
            <button
              onClick={handleCopyLink}
              className="absolute right-3 top-3 rounded-lg p-2 bg-bg border border-border-theme text-text-soft hover:text-text-theme transition-all shadow-sm flex items-center justify-center"
              title="Copy link"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border-theme">
            <Link
              href="/settings/users"
              className="rounded-xl bg-primary-theme hover:bg-primary-hover px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all"
            >
              Back to User Directory
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
