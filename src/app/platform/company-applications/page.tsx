// src/app/platform/company-applications/page.tsx
// Platform Admin - Company Applications Registry

"use client";

import React, { useEffect, useState } from "react";
import { useMockAuth } from "@/context/MockAuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Loader2, ArrowLeft, Filter, Calendar, ExternalLink } from "lucide-react";

interface CompanyApplication {
  id: string;
  companyName: string;
  ownerFullName: string;
  ownerEmail: string;
  ownerPhone: string;
  businessType: string | null;
  country: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export default function CompanyApplicationsList() {
  const { user, accessToken, loading: authLoading } = useMockAuth();
  const router = useRouter();

  const [applications, setApplications] = useState<CompanyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");

  // Security guard for Platform Admin
  useEffect(() => {
    if (!authLoading && (!user || !user.isPlatformAdmin)) {
      router.push("/denied");
    }
  }, [user, authLoading, router]);

  const fetchApplications = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/platform/company-applications?status=${statusFilter}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.isPlatformAdmin) {
      fetchApplications();
    }
  }, [accessToken, statusFilter, user]);

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
      <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link
            href="/platform"
            className="inline-flex items-center gap-1.5 text-xs text-text-soft hover:text-text-theme mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h2 className="text-xl font-bold text-text-theme flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-theme" />
            Company Applications Registry
          </h2>
          <p className="text-xs text-text-soft">
            Review inbound SaaS tenant registration requests and approve/reject them.
          </p>
        </div>
      </div>

      {/* Filter and Content Card */}
      <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm space-y-6">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-bold text-text-soft uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            Filter Status:
          </span>
          <div className="flex items-center gap-2 rounded-xl bg-bg p-1 border border-border-theme">
            {["PENDING", "APPROVED", "REJECTED", "ALL"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase transition-all cursor-pointer ${
                  statusFilter === st
                    ? "bg-surface text-text-theme shadow-sm border border-border-theme"
                    : "text-text-soft hover:text-text-theme"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Applications Table */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-theme" />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border-theme rounded-xl">
            <p className="text-xs text-text-soft font-medium">No company applications found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border-theme pb-3">
                  <th className="py-3 font-bold text-text-soft uppercase tracking-wider">Company Info</th>
                  <th className="py-3 font-bold text-text-soft uppercase tracking-wider">Owner / Contact</th>
                  <th className="py-3 font-bold text-text-soft uppercase tracking-wider">Type & Country</th>
                  <th className="py-3 font-bold text-text-soft uppercase tracking-wider">Date Submitted</th>
                  <th className="py-3 font-bold text-text-soft uppercase tracking-wider">Status</th>
                  <th className="py-3 font-bold text-text-soft uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme font-medium text-text-theme">
                {applications.map((app) => {
                  let badgeClass = "bg-slate-100 text-slate-700 border-slate-200/60 dark:bg-slate-900 dark:text-slate-400";
                  if (app.status === "PENDING") {
                    badgeClass = "bg-amber-50 text-amber-700 border-amber-100/60 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
                  } else if (app.status === "APPROVED") {
                    badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100/60 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
                  } else if (app.status === "REJECTED") {
                    badgeClass = "bg-rose-50 text-rose-700 border-rose-100/60 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30";
                  }

                  return (
                    <tr key={app.id} className="hover:bg-bg/50 transition-colors">
                      <td className="py-4">
                        <div className="font-bold text-text-theme">{app.companyName}</div>
                      </td>
                      <td className="py-4">
                        <div>{app.ownerFullName}</div>
                        <div className="text-[10px] text-text-soft font-mono mt-0.5">{app.ownerEmail}</div>
                        <div className="text-[10px] text-text-soft mt-0.5">{app.ownerPhone}</div>
                      </td>
                      <td className="py-4">
                        <div>{app.businessType || "N/A"}</div>
                        <div className="text-[10px] text-text-soft mt-0.5">{app.country}</div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1.5 text-text-soft">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase ${badgeClass}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <Link
                          href={`/platform/company-applications/${app.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-border-theme hover:bg-bg px-3 py-1.5 text-[10px] font-bold text-text-theme transition-colors cursor-pointer"
                        >
                          Review
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
