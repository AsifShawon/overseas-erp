// src/app/platform/page.tsx
// Platform Admin Dashboard — Full stats (pending/approved/rejected + active companies)

"use client";

import React, { useEffect, useState } from "react";
import { useMockAuth } from "@/context/MockAuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  LayoutDashboard,
  Loader2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  AlertTriangle,
} from "lucide-react";

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  activeCompanies: number;
}

export default function PlatformDashboard() {
  const { user, accessToken, loading: authLoading } = useMockAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(false);

  // Security guard for Platform Admin
  useEffect(() => {
    if (!authLoading && (!user || !user.isPlatformAdmin)) {
      router.push("/denied");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!accessToken || !user?.isPlatformAdmin) return;

    const fetchStats = async () => {
      setLoadingStats(true);
      setStatsError(false);
      try {
        // Fetch all applications and derive counts
        const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
          fetch("/api/platform/company-applications?status=PENDING", {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch("/api/platform/company-applications?status=APPROVED", {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch("/api/platform/company-applications?status=REJECTED", {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        if (!pendingRes.ok || !approvedRes.ok || !rejectedRes.ok) {
          setStatsError(true);
          return;
        }

        const [pending, approved, rejected] = await Promise.all([
          pendingRes.json(),
          approvedRes.json(),
          rejectedRes.json(),
        ]);

        setStats({
          pending: Array.isArray(pending) ? pending.length : 0,
          approved: Array.isArray(approved) ? approved.length : 0,
          rejected: Array.isArray(rejected) ? rejected.length : 0,
          // Active companies = approved applications that have an approvedCompanyId
          activeCompanies: Array.isArray(approved)
            ? approved.filter((a: any) => a.approvedCompanyId).length
            : 0,
        });
      } catch (err) {
        console.error("Error fetching platform stats:", err);
        setStatsError(true);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [accessToken, user]);

  if (authLoading || !user || !user.isPlatformAdmin) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-theme" />
      </div>
    );
  }

  const statCards = [
    {
      id: "stat-pending",
      label: "Pending Applications",
      subLabel: "Awaiting platform review",
      value: stats?.pending ?? 0,
      icon: Clock,
      colorBg: "bg-amber-500/10",
      colorBorder: "border-amber-500/20",
      colorIcon: "text-amber-500",
      colorValue: "text-amber-600 dark:text-amber-400",
      linkHref: "/platform/company-applications?status=PENDING",
      linkLabel: "Review Pending",
      urgency: stats !== null && stats.pending > 0,
    },
    {
      id: "stat-approved",
      label: "Approved Applications",
      subLabel: "Successfully processed",
      value: stats?.approved ?? 0,
      icon: CheckCircle2,
      colorBg: "bg-emerald-500/10",
      colorBorder: "border-emerald-500/20",
      colorIcon: "text-emerald-500",
      colorValue: "text-emerald-700 dark:text-emerald-400",
      linkHref: "/platform/company-applications?status=APPROVED",
      linkLabel: "View Approved",
      urgency: false,
    },
    {
      id: "stat-rejected",
      label: "Rejected Applications",
      subLabel: "Applications not approved",
      value: stats?.rejected ?? 0,
      icon: XCircle,
      colorBg: "bg-rose-500/10",
      colorBorder: "border-rose-500/20",
      colorIcon: "text-rose-500",
      colorValue: "text-rose-700 dark:text-rose-400",
      linkHref: "/platform/company-applications?status=REJECTED",
      linkLabel: "View Rejected",
      urgency: false,
    },
    {
      id: "stat-companies",
      label: "Active Companies",
      subLabel: "Workspaces currently active",
      value: stats?.activeCompanies ?? 0,
      icon: Building2,
      colorBg: "bg-indigo-500/10",
      colorBorder: "border-indigo-500/20",
      colorIcon: "text-indigo-500",
      colorValue: "text-indigo-700 dark:text-indigo-400",
      linkHref: "/platform/company-applications?status=APPROVED",
      linkLabel: "View Companies",
      urgency: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-text-theme flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary-theme" />
            SaaS Platform Administration
          </h2>
          <p className="text-xs text-text-soft">
            Manage company applications, review pending requests, and monitor tenant activations.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="rounded-lg bg-primary-theme/10 border border-primary-theme/20 px-3 py-1.5 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary-theme" />
            <span className="font-bold text-primary-theme">Platform Admin</span>
          </div>
        </div>
      </div>

      {/* Pending applications alert banner */}
      {stats !== null && stats.pending > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-800 dark:text-amber-400">
              {stats.pending} application{stats.pending !== 1 ? "s" : ""} awaiting review
            </p>
            <p className="text-[10px] text-amber-700/80 dark:text-amber-400/70 mt-0.5">
              Review and approve or reject company applications to activate their workspaces.
            </p>
          </div>
          <Link
            href="/platform/company-applications"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-[10px] font-bold text-white transition-colors"
          >
            Review Now
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              id={card.id}
              key={card.id}
              className={`rounded-2xl border ${card.urgency ? "border-amber-200 dark:border-amber-900/30" : "border-border-theme"} bg-surface p-6 shadow-sm space-y-4 hover:shadow-md transition-all duration-200`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-text-soft uppercase tracking-wider">
                    {card.label}
                  </span>
                  <p className="text-[10px] text-text-soft">{card.subLabel}</p>
                </div>
                <div className={`h-9 w-9 rounded-xl ${card.colorBg} border ${card.colorBorder} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-4.5 w-4.5 ${card.colorIcon}`} />
                </div>
              </div>

              <div>
                {loadingStats ? (
                  <Loader2 className="h-6 w-6 animate-spin text-text-soft" />
                ) : statsError ? (
                  <span className="text-sm text-text-soft font-medium">—</span>
                ) : (
                  <h3 className={`text-3xl font-extrabold ${card.colorValue}`}>
                    {card.value.toLocaleString()}
                  </h3>
                )}
              </div>

              <div className="pt-1 border-t border-border-theme">
                <Link
                  href={card.linkHref}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold text-primary-theme hover:underline"
                >
                  <span>{card.linkLabel}</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Applications card */}
        <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary-theme/10 border border-primary-theme/20 flex items-center justify-center">
              <FileText className="h-4.5 w-4.5 text-primary-theme" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-theme">Company Applications</h3>
              <p className="text-[10px] text-text-soft">Review, approve, or reject tenant registrations</p>
            </div>
          </div>
          <Link
            href="/platform/company-applications"
            id="platform-goto-applications"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-theme hover:bg-primary-hover py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-200"
          >
            Open Application Registry
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Platform info card */}
        <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <LayoutDashboard className="h-4.5 w-4.5 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-theme">SaaS Plan Status</h3>
              <p className="text-[10px] text-text-soft">Standard plan available for all tenants</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-bg border border-border-theme px-3 py-2">
              <span className="text-xs font-semibold text-text-theme">Standard Plan</span>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                Active
              </span>
            </div>
            <p className="text-[10px] text-text-soft px-1">
              All approved companies receive the Standard plan. Billing gateway planned for next phase.
            </p>
          </div>
        </div>
      </div>

      {/* Error state for stats */}
      {statsError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 dark:border-rose-950/30 dark:bg-rose-950/20 p-4 text-center">
          <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">
            Failed to load platform statistics. Please refresh the page.
          </p>
        </div>
      )}
    </div>
  );
}
