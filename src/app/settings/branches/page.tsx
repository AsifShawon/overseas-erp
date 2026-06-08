// src/app/settings/branches/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useMockAuth } from "@/context/MockAuthContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Search,
  Plus,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Ban,
  CheckCircle,
  Clock,
  ChevronRight,
} from "lucide-react";

interface BranchCount {
  memberships: number;
  applicants: number;
  agents: number;
  jobOrders: number;
}

interface Branch {
  id: string;
  name: string;
  code: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  isHeadOffice: boolean;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  _count?: BranchCount;
}

export default function BranchesPage() {
  const { user: authUser, accessToken, loading: authLoading, hasAccess } = useMockAuth();
  const router = useRouter();
  const toast = useToast();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [cityFilter, setCityFilter] = useState("ALL");

  // Security guard
  useEffect(() => {
    if (!authLoading && (!authUser || !hasAccess("VIEW_BRANCHES"))) {
      router.push("/denied");
    }
  }, [authUser, authLoading, router, hasAccess]);

  const fetchBranches = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch("/api/company/branches", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        throw new Error("Failed to load branches.");
      }
      const data = await res.json();
      setBranches(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load branches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken && authUser && hasAccess("VIEW_BRANCHES")) {
      fetchBranches();
    }
  }, [accessToken, authUser]);

  if (authLoading || loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-theme" />
      </div>
    );
  }

  // Get unique cities for filter dropdown
  const cities = Array.from(
    new Set(branches.map((b) => b.city).filter((c): c is string => !!c))
  );

  // Filter branches
  const filteredBranches = branches.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.city && b.city.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
    const matchesCity = cityFilter === "ALL" || b.city === cityFilter;

    return matchesSearch && matchesStatus && matchesCity;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-text-theme flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary-theme" />
            Branch Offices
          </h2>
          <p className="text-xs text-text-soft">
            Manage company branches, physical office sites, operational scoping, and staff mappings.
          </p>
        </div>
        {hasAccess("CREATE_BRANCH") && (
          <Link
            href="/settings/branches/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-theme hover:bg-primary-hover px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Branch Office
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border-theme bg-surface p-4 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-soft" />
          <input
            type="text"
            placeholder="Search by name, code, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border-theme bg-bg py-2.5 pl-10 pr-4 text-xs outline-none focus:border-primary-theme text-text-theme"
          />
        </div>

        <div>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-3 text-xs outline-none focus:border-primary-theme text-text-theme"
          >
            <option value="ALL">All Cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-3 text-xs outline-none focus:border-primary-theme text-text-theme"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Grid view of branches */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBranches.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-border-theme bg-surface p-12 text-center text-text-soft">
            <Building2 className="h-10 w-10 mx-auto text-text-soft/40 mb-3" />
            No branch offices found matching filters.
          </div>
        ) : (
          filteredBranches.map((b) => (
            <div
              key={b.id}
              className={`rounded-2xl border border-border-theme bg-surface shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow relative`}
            >
              {/* Top highlights */}
              <div className={`h-1.5 w-full ${b.status === "ACTIVE" ? "bg-primary-theme" : "bg-text-soft"}`} />
              
              <div className="p-5 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-text-theme flex items-center gap-1.5 text-sm">
                      {b.name}
                      {b.isHeadOffice && (
                        <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 text-[8px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          HQ
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-text-soft uppercase tracking-wider font-semibold">
                      Code: {b.code}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                      b.status === "ACTIVE"
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {b.status === "ACTIVE" ? (
                      <>
                        <CheckCircle className="h-2.5 w-2.5" />
                        Active
                      </>
                    ) : (
                      <>
                        <Ban className="h-2.5 w-2.5" />
                        Suspended
                      </>
                    )}
                  </span>
                </div>

                {/* Details list */}
                <div className="space-y-1.5 text-[11px] text-text-muted">
                  {b.city && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-text-soft shrink-0" />
                      <span>{b.city} {b.address ? `— ${b.address}` : ""}</span>
                    </div>
                  )}
                  {b.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-text-soft shrink-0" />
                      <span>{b.phone}</span>
                    </div>
                  )}
                  {b.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-text-soft shrink-0" />
                      <span className="truncate">{b.email}</span>
                    </div>
                  )}
                </div>

                {/* Quick stats counter */}
                {b._count && (
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border-theme">
                    <div className="rounded-lg bg-bg p-2 text-center">
                      <span className="block text-xs font-bold text-text-theme">
                        {b._count.memberships}
                      </span>
                      <span className="block text-[9px] text-text-soft uppercase">
                        Staff Members
                      </span>
                    </div>
                    <div className="rounded-lg bg-bg p-2 text-center">
                      <span className="block text-xs font-bold text-text-theme">
                        {b._count.applicants}
                      </span>
                      <span className="block text-[9px] text-text-soft uppercase">
                        Applicants
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action Footer */}
              <div className="border-t border-border-theme bg-surface-soft p-3 flex justify-end">
                <Link
                  href={`/settings/branches/${b.id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-theme hover:text-primary-hover transition-colors"
                >
                  Manage Branch
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
