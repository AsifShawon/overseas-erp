// src/app/settings/users/page.tsx
// Front-end dashboard to manage company team members

"use client";

import React, { useEffect, useState } from "react";
import { useMockAuth } from "@/context/MockAuthContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Search,
  UserPlus,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  MoreVertical,
  X,
  AlertTriangle,
  RefreshCw,
  Ban,
  CheckCircle,
  Clock,
  Edit2,
  Lock,
} from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  isActive: boolean;
}

interface Membership {
  id: string;
  userId: string;
  companyId: string;
  roleId: string;
  status: "ACTIVE" | "SUSPENDED" | "INVITED";
  isOwner: boolean;
  createdAt: string;
  user: User;
  role: Role;
}

export default function CompanyUsersPage() {
  const { user: authUser, accessToken, loading: authLoading, hasAccess } = useMockAuth();
  const router = useRouter();
  const toast = useToast();

  const [memberships, setMemberships] = useState<any[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Edit Modal State
  const [editingMembership, setEditingMembership] = useState<any | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"ACTIVE" | "SUSPENDED" | "INVITED">("ACTIVE");
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [isAllBranches, setIsAllBranches] = useState(false);

  // Manual Invite Link Modal
  const [inviteResult, setInviteResult] = useState<{
    email: string;
    link: string;
    warning?: string;
  } | null>(null);

  // Security guard
  useEffect(() => {
    if (!authLoading && (!authUser || !hasAccess("VIEW_COMPANY_USERS"))) {
      router.push("/denied");
    }
  }, [authUser, authLoading, router, hasAccess]);

  const fetchData = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [usersRes, rolesRes, branchesRes] = await Promise.all([
        fetch("/api/company/users", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch("/api/company/roles", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch("/api/company/branches", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      if (!usersRes.ok || !rolesRes.ok || !branchesRes.ok) {
        throw new Error("Failed to load users, roles, or branches.");
      }

      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      const branchesData = await branchesRes.json();

      setMemberships(usersData);
      setRoles(rolesData);
      setBranches(branchesData);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load company workspace data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken && authUser && hasAccess("VIEW_COMPANY_USERS")) {
      fetchData();
    }
  }, [accessToken, authUser]);

  if (authLoading || loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-theme" />
      </div>
    );
  }

  // Filter memberships
  const filteredMemberships = memberships.filter((m) => {
    const matchesSearch =
      m.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.user.phone && m.user.phone.includes(searchQuery));

    const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;
    const matchesRole = roleFilter === "ALL" || m.role.id === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  // Check if membership is the ONLY active owner/Super Admin
  const isLastActiveOwner = (membership: Membership) => {
    const isOwner = membership.isOwner || membership.role.name === "Super Admin";
    if (!isOwner) return false;

    const activeOwners = memberships.filter(
      (m) => (m.isOwner || m.role.name === "Super Admin") && m.status === "ACTIVE"
    );

    return activeOwners.length <= 1 && activeOwners.some((o) => o.id === membership.id);
  };

  const handleEditClick = (membership: any) => {
    setEditingMembership(membership);
    setSelectedRoleId(membership.roleId);
    setSelectedStatus(membership.status);

    const targetRole = roles.find(r => r.id === membership.roleId);
    const isAll = targetRole?.name === "Super Admin" || targetRole?.name === "Operations Admin";
    setIsAllBranches(isAll);
    if (isAll) {
      setSelectedBranchIds([]);
    } else {
      const bIds = membership.user?.branchMemberships?.map((bm: any) => bm.branchId) || [];
      setSelectedBranchIds(bIds);
    }
  };

  const handleUpdateMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMembership || !accessToken) return;

    const targetRole = roles.find(r => r.id === selectedRoleId);
    const isCompanyAdminRole = targetRole?.name === "Super Admin" || targetRole?.name === "Operations Admin";

    if (!isCompanyAdminRole && !isAllBranches && selectedBranchIds.length === 0) {
      toast.error("Please select at least one branch assignment.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/company/users/${editingMembership.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          roleId: selectedRoleId,
          status: selectedStatus,
          branchIds: isCompanyAdminRole || isAllBranches ? undefined : selectedBranchIds,
          isAllBranches: isCompanyAdminRole || isAllBranches,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update membership.");
      }

      toast.success("User membership updated successfully.");
      setEditingMembership(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update user.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendInvite = async (membership: Membership) => {
    if (!accessToken) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/company/users/${membership.id}/resend-invite`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend invitation.");
      }

      if (data.emailSent) {
        toast.success(`Invitation link re-sent to ${membership.user.email}`);
      } else {
        setInviteResult({
          email: membership.user.email,
          link: data.activationLink,
          warning: data.emailWarning,
        });
        toast.warning("SMTP not configured. Copy activation link manually.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to resend invitation.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (membership: Membership) => {
    if (!accessToken) return;
    if (isLastActiveOwner(membership)) {
      toast.error("Cannot suspend the only active company owner.");
      return;
    }

    if (!confirm(`Are you sure you want to suspend ${membership.user.fullName}?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/company/users/${membership.id}/suspend`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to suspend user.");
      }

      toast.success(`${membership.user.fullName} has been suspended.`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to suspend user.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async (membership: Membership) => {
    if (!accessToken) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/company/users/${membership.id}/reactivate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reactivate user.");
      }

      toast.success(`${membership.user.fullName} has been reactivated.`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to reactivate user.");
    } finally {
      setActionLoading(false);
    }
  };

  const selectedRole = roles.find(r => r.id === selectedRoleId);
  const isCompanyAdminRole = selectedRole?.name === "Super Admin" || selectedRole?.name === "Operations Admin";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-text-theme flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-theme" />
            Company Users & Team Management
          </h2>
          <p className="text-xs text-text-soft">
            Manage your internal staff users, assign organizational roles, and configure system permissions.
          </p>
        </div>
        {hasAccess("INVITE_COMPANY_USER") && (
          <Link
            href="/settings/users/invite"
            id="invite-new-user-btn"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-theme hover:bg-primary-hover px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all"
          >
            <UserPlus className="h-4 w-4" />
            Invite Team Member
          </Link>
        )}
      </div>

      {/* Filter Options */}
      <div className="rounded-2xl border border-border-theme bg-surface p-4 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-soft" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border-theme bg-bg py-2.5 pl-10 pr-4 text-xs outline-none focus:border-primary-theme text-text-theme"
          />
        </div>

        {/* Filter Role */}
        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-3 text-xs outline-none focus:border-primary-theme text-text-theme"
          >
            <option value="ALL">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Status */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-3 text-xs outline-none focus:border-primary-theme text-text-theme"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INVITED">Invited</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-border-theme bg-surface shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border-theme bg-surface-soft text-[10px] font-bold text-text-soft uppercase tracking-wider">
                <th className="p-4">Name & Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">System Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-theme text-text-theme">
              {filteredMemberships.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-soft">
                    No company team members found.
                  </td>
                </tr>
              ) : (
                filteredMemberships.map((m) => {
                  const isOwner = m.isOwner || m.role.name === "Super Admin";
                  const lastOwner = isLastActiveOwner(m);

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-surface-soft/50 transition-colors"
                    >
                      <td className="p-4 space-y-0.5">
                        <div className="font-semibold text-text-theme flex items-center gap-1.5">
                          {m.user.fullName}
                          {isOwner && (
                            <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 text-[8px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                              Owner
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-text-soft flex items-center gap-1">
                          <Mail className="h-3 w-3 shrink-0" />
                          {m.user.email}
                        </div>
                      </td>
                      <td className="p-4 text-text-soft">
                        {m.user.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 shrink-0" />
                            {m.user.phone}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-4 space-y-1">
                        <span className="font-semibold text-text-theme block">
                          {m.role.name}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {m.role.name === "Super Admin" || m.role.name === "Operations Admin" ? (
                            <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                              All Branches
                            </span>
                          ) : m.user.branchMemberships && m.user.branchMemberships.length > 0 ? (
                            m.user.branchMemberships.map((bm: any) => (
                              <span key={bm.id} className="rounded bg-slate-500/10 border border-slate-500/20 px-1.5 py-0.5 text-[9px] font-medium text-text-theme">
                                {bm.branch?.name || "Unknown"} {bm.isBranchManager ? "(Manager)" : ""}
                              </span>
                            ))
                          ) : (
                            <span className="rounded bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 dark:text-rose-400">
                              No Branch
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {m.status === "ACTIVE" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </span>
                        )}
                        {m.status === "INVITED" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                            <Clock className="h-3 w-3" />
                            Invited
                          </span>
                        )}
                        {m.status === "SUSPENDED" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[9px] font-bold text-rose-600 dark:text-rose-400">
                            <Ban className="h-3 w-3" />
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-text-soft">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasAccess("UPDATE_COMPANY_USER") && (
                            <button
                              onClick={() => handleEditClick(m)}
                              className="rounded-lg p-1.5 hover:bg-bg border border-transparent hover:border-border-theme text-text-soft hover:text-text-theme transition-all"
                              title="Edit User Settings"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {m.status === "INVITED" && (
                            <button
                              onClick={() => handleResendInvite(m)}
                              disabled={actionLoading}
                              className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 hover:bg-amber-500 border border-amber-500/20 hover:border-amber-500 px-2 py-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 hover:text-white transition-all disabled:opacity-50"
                              title="Resend Activation Invite"
                            >
                              <RefreshCw className="h-3 w-3" />
                              Resend
                            </button>
                          )}

                          {m.status === "ACTIVE" && !lastOwner && hasAccess("SUSPEND_COMPANY_USER") && (
                            <button
                              onClick={() => handleSuspend(m)}
                              disabled={actionLoading}
                              className="inline-flex items-center gap-1 rounded-lg bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 hover:border-rose-500 px-2 py-1 text-[9px] font-bold text-rose-600 dark:text-rose-400 hover:text-white transition-all disabled:opacity-50"
                              title="Suspend User Account"
                            >
                              <Ban className="h-3 w-3" />
                              Suspend
                            </button>
                          )}

                          {m.status === "SUSPENDED" && hasAccess("SUSPEND_COMPANY_USER") && (
                            <button
                              onClick={() => handleReactivate(m)}
                              disabled={actionLoading}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 hover:border-emerald-500 px-2 py-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-white transition-all disabled:opacity-50"
                              title="Reactivate User Account"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingMembership && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border-theme bg-surface p-6 shadow-2xl space-y-4 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 h-1 w-full bg-primary-theme" />

            <div className="flex justify-between items-center pb-2 border-b border-border-theme">
              <div>
                <h3 className="text-sm font-bold text-text-theme">Edit User Settings</h3>
                <p className="text-[10px] text-text-soft">{editingMembership.user.fullName}</p>
              </div>
              <button
                onClick={() => setEditingMembership(null)}
                className="rounded-lg p-1 text-text-soft hover:bg-bg hover:text-text-theme transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateMembership} className="space-y-4">
              {/* Role Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-theme">Assign Role</label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  disabled={actionLoading || isLastActiveOwner(editingMembership)}
                  className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-3 text-xs outline-none focus:border-primary-theme text-text-theme disabled:opacity-60"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                {isLastActiveOwner(editingMembership) && (
                  <div className="flex items-start gap-1 text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>This user is the last active company owner. You cannot downgrade their role.</span>
                  </div>
                )}
              </div>

              {/* Status Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-theme">Membership Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  disabled={actionLoading || isLastActiveOwner(editingMembership)}
                  className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-3 text-xs outline-none focus:border-primary-theme text-text-theme disabled:opacity-60"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="INVITED">Invited</option>
                </select>
                {isLastActiveOwner(editingMembership) && (
                  <div className="flex items-start gap-1 text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>This user is the last active company owner. You cannot suspend this membership.</span>
                  </div>
                )}
              </div>

              {/* Branch Assignment Section */}
              <div className="space-y-3 p-4 rounded-xl border border-border-theme bg-bg/50">
                <h3 className="text-xs font-bold text-text-theme">
                  Branch Assignment
                </h3>

                {isCompanyAdminRole ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="modalIsAllBranches"
                        checked={true}
                        disabled
                        className="rounded border-border-theme text-primary-theme focus:ring-primary-theme"
                      />
                      <label htmlFor="modalIsAllBranches" className="text-xs font-semibold text-text-theme">
                        All Branches Access (Default for {selectedRole?.name})
                      </label>
                    </div>
                    <p className="text-[10px] text-text-soft">
                      Administrative roles are granted access to all branches automatically.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="modalIsAllBranchesCheckbox"
                        checked={isAllBranches}
                        onChange={(e) => {
                          setIsAllBranches(e.target.checked);
                          if (e.target.checked) {
                            setSelectedBranchIds([]);
                          } else {
                            const ho = branches.find((b: any) => b.isHeadOffice);
                            setSelectedBranchIds(ho ? [ho.id] : (branches[0] ? [branches[0].id] : []));
                          }
                        }}
                        className="rounded border-border-theme text-primary-theme focus:ring-primary-theme h-4 w-4"
                      />
                      <label htmlFor="modalIsAllBranchesCheckbox" className="text-xs font-semibold text-text-theme cursor-pointer">
                        Grant access to all branches
                      </label>
                    </div>

                    {!isAllBranches && (
                      <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-text-soft block">
                          Select Assigned Branches <span className="text-danger-theme">*</span>
                        </label>
                        <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                          {branches.map((b) => (
                            <label
                              key={b.id}
                              className="flex items-center gap-2 p-2 rounded-lg border border-border-theme bg-surface hover:bg-surface-soft cursor-pointer text-xs transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedBranchIds.includes(b.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedBranchIds([...selectedBranchIds, b.id]);
                                  } else {
                                    setSelectedBranchIds(selectedBranchIds.filter((id) => id !== b.id));
                                  }
                                }}
                                className="rounded border-border-theme text-primary-theme focus:ring-primary-theme h-4 w-4"
                              />
                              <div className="space-y-0.5 animate-none">
                                <span className="font-semibold text-text-theme">{b.name}</span>
                                <span className="block text-[10px] text-text-soft">{b.code}</span>
                              </div>
                              {b.isHeadOffice && (
                                <span className="ml-auto text-[9px] px-1.5 py-0.5 bg-indigo-500/10 text-indigo-500 rounded border border-indigo-500/20 font-bold shrink-0">
                                  HO
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="pt-2 border-t border-border-theme flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMembership(null)}
                  disabled={actionLoading}
                  className="rounded-xl border border-border-theme bg-surface hover:bg-surface-soft px-4 py-2 text-xs font-semibold text-text-theme transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary-theme hover:bg-primary-hover px-4 py-2 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Invite Link / SMTP Warning Modal */}
      {inviteResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border-theme bg-surface p-6 shadow-2xl space-y-4 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top warning line */}
            <div className="absolute top-0 left-0 h-1 w-full bg-amber-500" />

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-text-theme">SMTP Config Offline</h3>
                <p className="text-[10px] text-text-soft">
                  We could not automatically transmit the email to <strong>{inviteResult.email}</strong>.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-bg border border-border-theme p-3 space-y-1.5">
              <span className="text-[10px] font-bold text-text-soft uppercase tracking-wider">Manual Activation Link</span>
              <p className="text-[10px] text-text-soft">
                Please copy the link below and share it with the team member manually so they can set their password:
              </p>
              <textarea
                readOnly
                value={inviteResult.link}
                onClick={(e) => (e.target as any).select()}
                className="w-full rounded-lg border border-border-theme bg-surface-soft p-2 font-mono text-[10px] outline-none text-text-theme h-20 resize-none"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-border-theme">
              <button
                onClick={() => setInviteResult(null)}
                className="rounded-xl bg-primary-theme hover:bg-primary-hover px-4 py-2 text-xs font-bold text-white shadow-sm transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
