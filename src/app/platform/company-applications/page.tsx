// src/app/platform/company-applications/page.tsx
// Platform Admin - Company Applications Registry

"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useMockAuth } from "@/context/MockAuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Loader2,
  ArrowLeft,
  Filter,
  Calendar,
  ExternalLink,
  RefreshCw,
  Building2,
  Search,
} from "lucide-react";

interface CompanyApplication {
  id: string;
  companyName: string;
  ownerFullName: string;
  ownerEmail: string;
  ownerPhone: string;
  businessType: string | null;
  country: string;
  city: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

const STATUS_FILTERS = ["PENDING", "APPROVED", "REJECTED", "ALL"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const badgeClass: Record<string, string> = {
  PENDING:  "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30",
};

function CompanyApplicationsContent() {
  const { user, accessToken, loading: authLoading } = useMockAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialFilter = (searchParams.get("status") as StatusFilter) || "PENDING";
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    STATUS_FILTERS.includes(initialFilter) ? initialFilter : "PENDING"
  );

  const [applications, setApplications] = useState<CompanyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Security guard
  useEffect(() => {
    if (!authLoading && (!user || !user.isPlatformAdmin)) {
      router.push("/denied");
    }
  }, [user, authLoading, router]);

  const fetchApplications = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/platform/company-applications${statusFilter !== "ALL" ? `?status=${statusFilter}` : ""}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) {
        setError("Failed to load applications.");
        return;
      }
      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError("An error occurred while loading applications.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, statusFilter]);

  useEffect(() => {
    if (user?.isPlatformAdmin) {
      fetchApplications();
    }
  }, [fetchApplications, user]);

  if (authLoading || !user || !user.isPlatformAdmin) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-theme" />
      </div>
    );
  }

  // Client-side search filter
  const filteredApps = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.companyName.toLowerCase().includes(q) ||
      app.ownerFullName.toLowerCase().includes(q) ||
      app.ownerEmail.toLowerCase().includes(q) ||
      app.ownerPhone.includes(q) ||
      (app.businessType || "").toLowerCase().includes(q) ||
      app.country.toLowerCase().includes(q) ||
      (app.city || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link
            href="/platform"
            className="inline-flex items-center gap-1.5 text-xs text-text-soft hover:text-text-theme mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Platform Dashboard
          </Link>
          <h2 className="text-xl font-bold text-text-theme flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-theme" />
            Company Applications Registry
          </h2>
          <p className="text-xs text-text-soft mt-0.5">
            Review inbound SaaS tenant registration requests and approve or reject them.
          </p>
        </div>
        <button
          onClick={fetchApplications}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border-theme bg-bg hover:bg-surface px-4 py-2 text-xs font-bold text-text-theme transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filter + Search Card */}
      <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Status filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-text-soft uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              Status:
            </span>
            <div className="flex items-center gap-1.5 rounded-xl bg-bg p-1 border border-border-theme">
              {STATUS_FILTERS.map((st) => (
                <button
                  key={st}
                  id={`filter-${st.toLowerCase()}`}
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer ${
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

          {/* Search box */}
          <div className="relative flex-1 min-w-0 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-soft pointer-events-none" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border-theme bg-bg pl-9 pr-4 py-2 text-xs outline-none focus:border-primary-theme focus:ring-1 focus:ring-primary-theme text-text-theme"
            />
          </div>
        </div>

        {/* Table / Content Area */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-theme" />
          </div>
        ) : error ? (
          <div className="text-center py-12 border border-dashed border-danger-theme/30 rounded-xl bg-danger-soft/20">
            <p className="text-xs text-danger-theme font-medium">{error}</p>
            <button
              onClick={fetchApplications}
              className="mt-3 text-[10px] font-bold text-primary-theme hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border-theme rounded-xl">
            <Building2 className="mx-auto h-8 w-8 text-text-soft mb-3" />
            <p className="text-xs text-text-soft font-medium">
              {searchQuery
                ? `No applications match "${searchQuery}".`
                : `No ${statusFilter !== "ALL" ? statusFilter.toLowerCase() : ""} company applications found.`}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-2 text-[10px] font-bold text-primary-theme hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-[10px] text-text-soft font-medium">
              Showing {filteredApps.length} of {applications.length} application{applications.length !== 1 ? "s" : ""}
            </p>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border-theme">
                    <th className="py-3 px-2 font-bold text-[10px] text-text-soft uppercase tracking-wider">Company Info</th>
                    <th className="py-3 px-2 font-bold text-[10px] text-text-soft uppercase tracking-wider">Owner / Contact</th>
                    <th className="py-3 px-2 font-bold text-[10px] text-text-soft uppercase tracking-wider">Type & Location</th>
                    <th className="py-3 px-2 font-bold text-[10px] text-text-soft uppercase tracking-wider">Submitted</th>
                    <th className="py-3 px-2 font-bold text-[10px] text-text-soft uppercase tracking-wider">Status</th>
                    <th className="py-3 px-2 font-bold text-[10px] text-text-soft uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-theme font-medium text-text-theme">
                  {filteredApps.map((app) => (
                    <tr key={app.id} className="hover:bg-bg/50 transition-colors">
                      <td className="py-4 px-2">
                        <div className="font-bold text-text-theme text-xs">{app.companyName}</div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="text-xs font-semibold text-text-theme">{app.ownerFullName}</div>
                        <div className="text-[10px] text-text-soft font-mono mt-0.5">{app.ownerEmail}</div>
                        <div className="text-[10px] text-text-soft mt-0.5">{app.ownerPhone}</div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="text-xs font-semibold text-text-theme">{app.businessType || "—"}</div>
                        <div className="text-[10px] text-text-soft mt-0.5">
                          {app.country}{app.city ? `, ${app.city}` : ""}
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-1.5 text-[10px] text-text-soft">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase ${badgeClass[app.status] || ""}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <Link
                          href={`/platform/company-applications/${app.id}`}
                          id={`view-app-${app.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-border-theme hover:bg-bg px-3 py-1.5 text-[10px] font-bold text-text-theme transition-colors cursor-pointer"
                        >
                          View
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CompanyApplicationsList() {
  return (
    <Suspense fallback={
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-theme" />
      </div>
    }>
      <CompanyApplicationsContent />
    </Suspense>
  );
}
