// src/app/platform/settings/email/page.tsx
// Platform Admin Page to monitor and test SMTP email settings

"use client";

import React, { useEffect, useState } from "react";
import { useMockAuth } from "@/context/MockAuthContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";

export default function PlatformEmailSettingsPage() {
  const { user, accessToken, loading: authLoading } = useMockAuth();
  const router = useRouter();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  // SMTP Settings Status (loaded from public config details or check)
  const [smtpStatus, setSmtpStatus] = useState<{
    configured: boolean;
    host: string;
    port: number;
    secure: boolean;
    user: string;
    fromEmail: string;
    fromName: string;
  } | null>(null);

  // Security guard for Platform Admin
  useEffect(() => {
    if (!authLoading && (!user || !user.isPlatformAdmin)) {
      router.push("/denied");
    }
  }, [user, authLoading, router]);

  const checkSmtpConfig = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      // Create a small metadata endpoint or compute status directly from environment variables.
      // Wait, we can fetch from a config API or check it.
      // Let's create GET /api/platform/email/config to safely expose SMTP status info (excluding password).
      const res = await fetch("/api/platform/email/config", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSmtpStatus(data);
      } else {
        throw new Error("Failed to load SMTP status.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load SMTP configuration status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken && user?.isPlatformAdmin) {
      checkSmtpConfig();
    }
  }, [accessToken, user]);

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !accessToken) return;

    setTesting(true);
    try {
      const res = await fetch("/api/platform/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ toEmail: testEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to transmit test email.");
      }

      toast.success("SMTP Test email sent successfully! Check your inbox.");
      setTestEmail("");
    } catch (err: any) {
      toast.error(err.message || "SMTP transmission failure.");
    } finally {
      setTesting(false);
    }
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
      {/* Back link */}
      <Link
        href="/platform"
        className="inline-flex items-center gap-1.5 text-xs text-text-soft hover:text-text-theme transition-colors font-semibold"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Platform Control Center
      </Link>

      {/* Page Header */}
      <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-text-theme flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary-theme" />
            Global SMTP & Email Settings
          </h2>
          <p className="text-xs text-text-soft">
            Monitor system mailing status, verify environment variables, and trigger delivery tests.
          </p>
        </div>
        <div className="rounded-lg bg-primary-theme/10 border border-primary-theme/20 px-3 py-1.5 flex items-center gap-1.5 text-xs">
          <ShieldCheck className="h-4 w-4 text-primary-theme" />
          <span className="font-bold text-primary-theme">Platform Console</span>
        </div>
      </div>

      {/* Configuration Status Card */}
      <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-text-theme">SMTP Environment Status</h3>

        {smtpStatus?.configured ? (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">SMTP Gateway Online</p>
              <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed">
                Your SMTP environment variables are fully set. Notifications, team invitations, and password reset flows will send automatically.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-800 dark:text-amber-400">SMTP Offline (Failsafe Active)</p>
              <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                SMTP variables are not fully configured in your environment files. The application has enabled failsafe generation, allowing users to copy invite links manually.
              </p>
            </div>
          </div>
        )}

        {/* Configuration Details Table */}
        <div className="border border-border-theme rounded-xl overflow-hidden text-xs">
          <div className="grid grid-cols-3 border-b border-border-theme p-3 bg-surface-soft text-[10px] font-bold text-text-soft uppercase tracking-wider">
            <div>Setting</div>
            <div className="col-span-2">Configuration Value</div>
          </div>
          <div className="divide-y divide-border-theme">
            <div className="grid grid-cols-3 p-3 items-center">
              <div className="font-semibold text-text-theme">SMTP Host</div>
              <div className="col-span-2 text-text-soft font-mono">{smtpStatus?.host || "Not Configured (empty)"}</div>
            </div>
            <div className="grid grid-cols-3 p-3 items-center">
              <div className="font-semibold text-text-theme">SMTP Port</div>
              <div className="col-span-2 text-text-soft font-mono">{smtpStatus?.port || "Not Configured"}</div>
            </div>
            <div className="grid grid-cols-3 p-3 items-center">
              <div className="font-semibold text-text-theme">SSL / Secure</div>
              <div className="col-span-2 text-text-soft font-mono">{smtpStatus?.secure ? "TLS/SSL Enabled" : "Disabled (Plain/STARTTLS)"}</div>
            </div>
            <div className="grid grid-cols-3 p-3 items-center">
              <div className="font-semibold text-text-theme">SMTP Username</div>
              <div className="col-span-2 text-text-soft font-mono">{smtpStatus?.user || "Not Configured"}</div>
            </div>
            <div className="grid grid-cols-3 p-3 items-center">
              <div className="font-semibold text-text-theme">Sender Email</div>
              <div className="col-span-2 text-text-soft font-mono">{smtpStatus?.fromEmail || "Not Configured"}</div>
            </div>
            <div className="grid grid-cols-3 p-3 items-center">
              <div className="font-semibold text-text-theme">Sender Name</div>
              <div className="col-span-2 text-text-soft">{smtpStatus?.fromName || "VisaTek ERP"}</div>
            </div>
            <div className="grid grid-cols-3 p-3 items-center">
              <div className="font-semibold text-text-theme">SMTP Password</div>
              <div className="col-span-2 text-text-muted italic flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-text-muted" />
                •••••••••••• (masked for security)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SMTP Test Send Form */}
      <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-text-theme">Send Test Transmission</h3>
          <p className="text-[10px] text-text-soft">
            Deliver a test email to verify correct handshake, auth, and SSL configuration.
          </p>
        </div>

        <form onSubmit={handleSendTestEmail} className="flex gap-3 items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-semibold text-text-theme" htmlFor="testEmail">
              Recipient Email Address
            </label>
            <input
              id="testEmail"
              type="email"
              required
              placeholder="e.g. admin@agency.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-4 text-xs outline-none focus:border-primary-theme text-text-theme"
            />
          </div>
          <button
            type="submit"
            disabled={testing || !smtpStatus?.configured}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-theme hover:bg-primary-hover px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50 h-[38px] shrink-0"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Trigger Test
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
