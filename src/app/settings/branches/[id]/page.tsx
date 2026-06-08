// src/app/settings/branches/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useMockAuth } from "@/context/MockAuthContext";
import { useToast } from "@/context/ToastContext";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  MapPin,
  FileCode,
  Users,
  ShieldCheck,
  Ban,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  UserCheck,
  UserX,
  CreditCard,
  Briefcase,
  Layers,
  ChevronRight,
  AlertTriangle,
  X,
} from "lucide-react";

interface BranchCount {
  applicants: number;
  agents: number;
  jobOrders: number;
  invoices: number;
  receipts: number;
}

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
}

interface Role {
  id: string;
  name: string;
}

interface BranchMembership {
  id: string;
  userId: string;
  roleId: string;
  status: "ACTIVE" | "SUSPENDED" | "INVITED";
  isBranchManager: boolean;
  user: User;
  role: Role;
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
  memberships?: BranchMembership[];
  _count?: BranchCount;
}

export default function BranchDetailPage() {
  const { user: authUser, accessToken, loading: authLoading, hasAccess } = useMockAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const toast = useToast();

  const [branch, setBranch] = useState<Branch | null>(null);
  const [allCompanyUsers, setAllCompanyUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "users">("overview");

  // Edit branch form fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isHeadOffice, setIsHeadOffice] = useState(false);

  // Assign user modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [isBranchManager, setIsBranchManager] = useState(false);

  // Security guard
  useEffect(() => {
    if (!authLoading && (!authUser || !hasAccess("VIEW_BRANCHES"))) {
      router.push("/denied");
    }
  }, [authUser, authLoading, router, hasAccess]);

  const fetchBranchDetail = async () => {
    if (!accessToken || !id) return;
    try {
      const res = await fetch(`/api/company/branches/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        throw new Error("Failed to load branch details.");
      }
      const data = await res.json();
      setBranch(data);
      setName(data.name || "");
      setCode(data.code || "");
      setCity(data.city || "");
      setAddress(data.address || "");
      setPhone(data.phone || "");
      setEmail(data.email || "");
      setIsHeadOffice(data.isHeadOffice || false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load branch details.");
    }
  };

  const fetchUsersAndRoles = async () => {
    if (!accessToken) return;
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch("/api/company/users", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch("/api/company/roles", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      if (usersRes.ok && rolesRes.ok) {
        const usersData = await usersRes.json();
        const rolesData = await rolesRes.json();
        setAllCompanyUsers(usersData);
        setRoles(rolesData);
        if (rolesData.length > 0) {
          setSelectedRoleId(rolesData[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load company users or roles", err);
    }
  };

  const initData = async () => {
    setLoading(true);
    await Promise.all([fetchBranchDetail(), fetchUsersAndRoles()]);
    setLoading(false);
  };

  useEffect(() => {
    if (accessToken && authUser && hasAccess("VIEW_BRANCHES") && id) {
      initData();
    }
  }, [accessToken, authUser, id]);

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !id) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/company/branches/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name,
          code,
          city: city || undefined,
          address: address || undefined,
          phone: phone || undefined,
          email: email || undefined,
          isHeadOffice,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update branch.");
      }

      toast.success("Branch details updated successfully.");
      fetchBranchDetail();
    } catch (err: any) {
      toast.error(err.message || "Failed to update branch.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendBranch = async () => {
    if (!accessToken || !id) return;
    if (!confirm("Are you sure you want to suspend this branch? Staff members won't be able to log in or work inside this branch.")) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/company/branches/${id}/suspend`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to suspend branch.");
      }

      toast.success("Branch suspended successfully.");
      fetchBranchDetail();
    } catch (err: any) {
      toast.error(err.message || "Failed to suspend branch.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateBranch = async () => {
    if (!accessToken || !id) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/company/branches/${id}/reactivate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reactivate branch.");
      }

      toast.success("Branch reactivated successfully.");
      fetchBranchDetail();
    } catch (err: any) {
      toast.error(err.message || "Failed to reactivate branch.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !id || !selectedUserId) {
      toast.error("Please select a user to assign.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/company/branches/${id}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: selectedUserId,
          roleId: selectedRoleId,
          isBranchManager,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to assign user to branch.");
      }

      toast.success("User assigned to branch successfully.");
      setAssignModalOpen(false);
      setSelectedUserId("");
      setIsBranchManager(false);
      fetchBranchDetail();
    } catch (err: any) {
      toast.error(err.message || "Failed to assign user.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveUser = async (branchMembershipId: string, nameOfUser: string) => {
    if (!accessToken || !id) return;
    if (!confirm(`Are you sure you want to remove ${nameOfUser} from this branch?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/company/branches/${id}/users/${branchMembershipId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove user from branch.");
      }

      toast.success(`${nameOfUser} removed from branch.`);
      fetchBranchDetail();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove user.");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleBranchManager = async (bm: BranchMembership) => {
    if (!accessToken || !id) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/company/branches/${id}/users/${bm.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          isBranchManager: !bm.isBranchManager,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update branch manager status.");
      }

      toast.success("Branch manager status updated.");
      fetchBranchDetail();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-theme" />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="max-w-md mx-auto rounded-2xl border border-border-theme bg-surface p-12 text-center text-text-soft">
        <Building2 className="h-10 w-10 mx-auto text-text-soft/40 mb-3" />
        Branch Office not found.
        <Link href="/settings/branches" className="block mt-4 text-xs font-bold text-primary-theme">
          Back to list
        </Link>
      </div>
    );
  }

  // Filter out company users that are already members in this branch
  const assignedUserIds = branch.memberships?.map((m) => m.userId) || [];
  const assignableUsers = allCompanyUsers.filter(
    (m) => m.status === "ACTIVE" && !assignedUserIds.includes(m.userId)
  );

  return (
    <div className="space-y-6">
      {/* Back to List */}
      <Link
        href="/settings/branches"
        className="inline-flex items-center gap-1.5 text-xs text-text-soft hover:text-text-theme transition-colors font-semibold"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Branch Offices
      </Link>

      {/* Page Header */}
      <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary-theme/10 text-primary-theme border border-primary-theme/20 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-text-theme flex items-center gap-1.5">
              {branch.name}
              {branch.isHeadOffice && (
                <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 text-[8px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  HQ
                </span>
              )}
            </h2>
            <p className="text-[10px] text-text-soft">
              Branch Code: {branch.code} | Created: {new Date(branch.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Suspend / Reactivate Action Buttons */}
        {hasAccess("UPDATE_BRANCH") && (
          <div className="flex items-center gap-2">
            {branch.status === "ACTIVE" ? (
              <button
                onClick={handleSuspendBranch}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 hover:border-rose-500 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-white transition-all disabled:opacity-50"
              >
                <Ban className="h-4 w-4" />
                Suspend Branch
              </button>
            ) : (
              <button
                onClick={handleReactivateBranch}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 hover:border-emerald-500 px-4 py-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-white transition-all disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Reactivate Branch
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border-theme flex gap-4">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-2.5 text-sm font-bold border-b-2 px-1 transition-all ${
            activeTab === "overview"
              ? "border-primary-theme text-primary-theme"
              : "border-transparent text-text-soft hover:text-text-theme"
          }`}
        >
          Overview & Settings
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-2.5 text-sm font-bold border-b-2 px-1 transition-all flex items-center gap-1.5 ${
            activeTab === "users"
              ? "border-primary-theme text-primary-theme"
              : "border-transparent text-text-soft hover:text-text-theme"
          }`}
        >
          <Users className="h-4 w-4" />
          Staff Members ({branch.memberships?.length || 0})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Edit Settings */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleUpdateBranch} className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-text-theme border-b border-border-theme pb-2">
                Branch Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-theme" htmlFor="name">
                    Branch Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-3 text-xs outline-none focus:border-primary-theme text-text-theme"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-theme" htmlFor="code">
                    Branch Code
                  </label>
                  <input
                    id="code"
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-3 text-xs outline-none focus:border-primary-theme text-text-theme uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-theme" htmlFor="city">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-3 text-xs outline-none focus:border-primary-theme text-text-theme"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-theme" htmlFor="email">
                    Contact Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-3 text-xs outline-none focus:border-primary-theme text-text-theme"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-theme" htmlFor="phone">
                    Contact Phone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-3 text-xs outline-none focus:border-primary-theme text-text-theme"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-text-theme" htmlFor="address">
                    Office Address
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-3 text-xs outline-none focus:border-primary-theme text-text-theme"
                  />
                </div>
              </div>

              {/* HQ toggle */}
              <div className="flex items-center gap-2 p-3 rounded-xl border border-border-theme bg-bg/50">
                <input
                  type="checkbox"
                  id="isHeadOffice"
                  checked={isHeadOffice}
                  onChange={(e) => setIsHeadOffice(e.target.checked)}
                  className="rounded border-border-theme text-primary-theme focus:ring-primary-theme h-4 w-4"
                />
                <div className="space-y-0.5">
                  <label htmlFor="isHeadOffice" className="text-xs font-bold text-text-theme cursor-pointer block">
                    Designate as Head Office (HQ)
                  </label>
                  <span className="block text-[10px] text-text-soft">
                    Warning: Changing this will unset the previous Head Office branch.
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              {hasAccess("UPDATE_BRANCH") && (
                <div className="pt-2 border-t border-border-theme flex justify-end">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary-theme hover:bg-primary-hover px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Branch Changes"
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Operational Counter Widgets & Stats */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-text-theme border-b border-border-theme pb-2">
                Operational Records Scoped
              </h3>

              {branch._count ? (
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-bg border border-border-theme">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-500" />
                      <span className="text-xs text-text-theme font-semibold">Active Applicants</span>
                    </div>
                    <span className="text-xs font-bold text-text-theme">{branch._count.applicants}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-bg border border-border-theme">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs text-text-theme font-semibold">Job Orders Open</span>
                    </div>
                    <span className="text-xs font-bold text-text-theme">{branch._count.jobOrders}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-bg border border-border-theme">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-amber-500" />
                      <span className="text-xs text-text-theme font-semibold">Sourcing Agents</span>
                    </div>
                    <span className="text-xs font-bold text-text-theme">{branch._count.agents}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-bg border border-border-theme">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary-theme" />
                      <span className="text-xs text-text-theme font-semibold">Invoices Raised</span>
                    </div>
                    <span className="text-xs font-bold text-text-theme">{branch._count.invoices}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-bg border border-border-theme">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-purple-500" />
                      <span className="text-xs text-text-theme font-semibold">Receipts Logged</span>
                    </div>
                    <span className="text-xs font-bold text-text-theme">{branch._count.receipts}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-text-soft">Counts not loaded.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Users and Assignments list */
        <div className="space-y-6">
          <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-border-theme">
              <div>
                <h3 className="text-sm font-bold text-text-theme">Staff Members</h3>
                <p className="text-[10px] text-text-soft">Users mapped to work inside this branch office scope.</p>
              </div>
              {hasAccess("ASSIGN_BRANCH_USERS") && (
                <button
                  onClick={() => setAssignModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary-theme hover:bg-primary-hover px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Assign Staff User
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border-theme bg-surface-soft text-[10px] font-bold text-text-soft uppercase tracking-wider">
                    <th className="p-4">Name & Email</th>
                    <th className="p-4">Role Assigned</th>
                    <th className="p-4">Manager Status</th>
                    <th className="p-4">Status</th>
                    {hasAccess("ASSIGN_BRANCH_USERS") && <th className="p-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-theme text-text-theme">
                  {!branch.memberships || branch.memberships.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-text-soft">
                        No staff members assigned to this branch yet.
                      </td>
                    </tr>
                  ) : (
                    branch.memberships.map((m) => (
                      <tr key={m.id} className="hover:bg-surface-soft/50 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-text-theme">{m.user.fullName}</div>
                          <div className="text-[10px] text-text-soft">{m.user.email}</div>
                        </td>
                        <td className="p-4 font-semibold text-text-theme">{m.role?.name || "Member"}</td>
                        <td className="p-4">
                          <button
                            onClick={() => hasAccess("ASSIGN_BRANCH_USERS") && toggleBranchManager(m)}
                            disabled={actionLoading || !hasAccess("ASSIGN_BRANCH_USERS")}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold border transition-all ${
                              m.isBranchManager
                                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                                : "bg-slate-500/10 border-slate-500/20 text-text-soft hover:bg-slate-500/20 cursor-pointer"
                            }`}
                          >
                            <ShieldCheck className="h-3 w-3" />
                            {m.isBranchManager ? "Branch Manager" : "Branch Staff"}
                          </button>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="h-3 w-3" />
                            Active Scope
                          </span>
                        </td>
                        {hasAccess("ASSIGN_BRANCH_USERS") && (
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleRemoveUser(m.id, m.user.fullName)}
                              disabled={actionLoading}
                              className="rounded-lg p-1.5 hover:bg-rose-550/10 text-text-soft hover:text-danger-theme border border-transparent hover:border-border-theme transition-all disabled:opacity-50"
                              title="Remove user branch assignment"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Assign User Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border-theme bg-surface p-6 shadow-2xl space-y-4 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 h-1 w-full bg-primary-theme" />

            <div className="flex justify-between items-center pb-2 border-b border-border-theme">
              <div>
                <h3 className="text-sm font-bold text-text-theme">Assign Staff to Branch</h3>
                <p className="text-[10px] text-text-soft">Map an existing company team member to {branch.name}</p>
              </div>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="rounded-lg p-1 text-text-soft hover:bg-bg hover:text-text-theme transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAssignUser} className="space-y-4">
              {/* User Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-theme" htmlFor="assignUserId">
                  Select User <span className="text-danger-theme">*</span>
                </label>
                {assignableUsers.length === 0 ? (
                  <p className="text-xs text-danger-theme">All company users are already assigned to this branch.</p>
                ) : (
                  <select
                    id="assignUserId"
                    required
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-3 text-xs outline-none focus:border-primary-theme text-text-theme"
                  >
                    <option value="">-- Choose User --</option>
                    {assignableUsers.map((u) => (
                      <option key={u.id} value={u.userId}>
                        {u.user?.fullName} ({u.user?.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Role Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-theme" htmlFor="assignRoleId">
                  Role in this Branch <span className="text-danger-theme">*</span>
                </label>
                <select
                  id="assignRoleId"
                  required
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-3 text-xs outline-none focus:border-primary-theme text-text-theme"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Manager Status */}
              <div className="flex items-center gap-2 p-3 rounded-xl border border-border-theme bg-bg/50">
                <input
                  type="checkbox"
                  id="isBranchManagerCheckbox"
                  checked={isBranchManager}
                  onChange={(e) => setIsBranchManager(e.target.checked)}
                  className="rounded border-border-theme text-primary-theme focus:ring-primary-theme h-4 w-4"
                />
                <div className="space-y-0.5">
                  <label htmlFor="isBranchManagerCheckbox" className="text-xs font-bold text-text-theme cursor-pointer block">
                    Designate as Branch Manager
                  </label>
                  <span className="block text-[10px] text-text-soft">
                    Manager role grants override abilities inside this branch only.
                  </span>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-2 border-t border-border-theme flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  disabled={actionLoading}
                  className="rounded-xl border border-border-theme bg-surface hover:bg-surface-soft px-4 py-2 text-xs font-semibold text-text-theme transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || assignableUsers.length === 0 || !selectedUserId}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary-theme hover:bg-primary-hover px-4 py-2 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    "Assign User"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
