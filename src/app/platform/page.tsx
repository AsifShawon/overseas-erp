// src/app/platform/page.tsx
// Platform Admin Dashboard

"use client";

import React, { useEffect, useState } from "react";
import { useMockAuth } from "@/context/MockAuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, FileText, LayoutDashboard, Loader2, ArrowRight, ShieldCheck } from "lucide-react";

export default function PlatformDashboard() {
  const { user, accessToken, loading: authLoading } = useMockAuth();
  const router = useRouter();
  
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Security guard for Platform Admin
  useEffect(() => {
    if (!authLoading && (!user || !user.isPlatformAdmin)) {
      router.push("/denied");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!accessToken || !user?.isPlatformAdmin) return;

    const fetchStats = async () => {
      try {
        const res = await fetch("/api/platform/company-applications?status=PENDING", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setPendingCount(data.length);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-theme flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary-theme" />
            SaaS Platform Administration
          </h2>
          <p className="text-xs text-text-soft">
            Manage company applications, standard plans, and tenant activations.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Pending Applications Card */}
        <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-text-soft uppercase tracking-wider">
              Pending Applications
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
              <FileText className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-text-theme">
              {loadingStats ? (
                <Loader2 className="h-5 w-5 animate-spin text-text-soft" />
              ) : (
                pendingCount ?? 0
              )}
            </h3>
            <p className="text-[10px] text-text-soft">Applications awaiting review</p>
          </div>
          <div className="pt-2 border-t border-border-theme">
            <Link
              href="/platform/company-applications"
              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-primary-theme hover:underline"
            >
              <span>View All Applications</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Global Plans Info Card */}
        <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-text-soft uppercase tracking-wider">
              SaaS Packages & Plans
            </span>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center">
              <Building2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-text-theme">Standard Plan Active</h3>
            <p className="text-[10px] text-text-soft">STANDARD code registered</p>
          </div>
          <div className="pt-2 border-t border-border-theme">
            <span className="text-[10px] text-text-soft">
              Self-service setup enabled for approved tenants
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
