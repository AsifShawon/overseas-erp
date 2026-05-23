"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { SYSTEM_ROLES, PermissionCode } from "@/lib/permissions";
import { ToggleLeft, ToggleRight, AlertTriangle } from "lucide-react";
import { useT } from "@/i18n/useT";

export default function RbacPage() {
  const { t } = useT();
  // Let's create a local state for the roles so they can interactively toggle permissions!
  const [rolesMap, setRolesMap] = useState<typeof SYSTEM_ROLES>(SYSTEM_ROLES);

  const permissionList: { code: PermissionCode; name: string; desc: string }[] = [
    { code: "VIEW_DASHBOARD", name: "View Command Dashboard", desc: "Access the role-scoped landing hub." },
    { code: "VIEW_APPLICANTS", name: "View Sourced Candidates Directory", desc: "List and browse placing applicants." },
    { code: "CREATE_APPLICANT", name: "Create New Candidate File", desc: "Manually log a sourced placing applicant." },
    { code: "UPDATE_APPLICANT", name: "Update Candidate Dossiers", desc: "Revise candidate personal contact data." },
    { code: "ARCHIVE_APPLICANT", name: "Soft Archive Candidate File", desc: "Hide halted folders from active pipelines." },
    { code: "TRANSITION_WORKFLOW", name: "Commit Workflow State Transition", desc: "Push candidate stage indicators (Medical, Visa)." },
    { code: "UPLOAD_DOCUMENT", name: "Upload Dossier compliance PDF", desc: "Simulate candidate/sourcing document uploads." },
    { code: "VERIFY_DOCUMENT", name: "Audit Document Attestation", desc: "Verify or Reject uploaded compliance checklists." },
    { code: "MANAGE_AGENTS", name: "Manage Sourcing Partnerships", desc: "Edit recruiting channels and license tags." },
    { code: "RECORD_PAYMENT", name: "Record Cash / Bank Receipts", desc: "Post credit postings to candidate balance sheets." },
    { code: "VIEW_ACCOUNTS", name: "View Finance Ledgers & Dues", desc: "Access gross revenues and outstanding lists." },
    { code: "VIEW_COMMISSIONS", name: "View Sourcing Commission Ledgers", desc: "Track accrued vs settled agent commissions." },
    { code: "VIEW_REPORTS", name: "View Operations Bottlenecks Reports", desc: "Access days-in-stage and geography charts." },
    { code: "VIEW_AUDIT_LOGS", name: "View Immutable System Logs", desc: "Browse forensic database transaction trackers." },
    { code: "MANAGE_RBAC", name: "Modify System Permission Matrices", desc: "Adjust access codes across the 8 default roles." },
    { code: "VIEW_NOTIFICATIONS", name: "Access Inbox warning Alerts", desc: "Receive email warnings and passport expiration tags." },
  ];

  const handleTogglePermission = (roleKey: string, code: PermissionCode) => {
    const role = rolesMap[roleKey];
    if (!role) return;

    let updatedPerms = [...role.permissions];
    if (updatedPerms.includes(code)) {
      // Disallow disabling manage rbac for super admin to prevent lockouts!
      if (roleKey === "SUPER_ADMIN" && code === "MANAGE_RBAC") return;
      updatedPerms = updatedPerms.filter((p) => p !== code);
    } else {
      updatedPerms.push(code);
    }

    setRolesMap({
      ...rolesMap,
      [roleKey]: {
        ...role,
        permissions: updatedPerms,
      },
    });
  };

  return (
    <div className="space-y-6">
      <PermissionGate 
        permission="MANAGE_RBAC" 
        showFallback={true} 
        fallbackMessage={t("rbac.adminOnlyNotice") || "Access to system security policies, database privilege tables, and role-mapping matrices is locked to Super Admins only."}
      >
        <PageHeader
          title={t("rbac.pageTitle")}
          description={t("rbac.pageDesc")}
          breadcrumbs={[{ label: t("nav.dashboard"), href: "/dashboard" }, { label: t("nav.rbacSettings") }]}
        />

        {/* Aggregate Info */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title={t("rbac.totalRoles")}
            value={t("rbac.activeRolesVal", { count: 8 })}
            description={t("rbac.rolesDesc")}
            iconName="ShieldCheck"
          />
          <StatCard
            title={t("rbac.privilegesSeeding")}
            value={t("rbac.accessCodesVal", { count: 19 })}
            description={t("rbac.privilegesDesc")}
            iconName="Info"
          />
          <StatCard
            title={t("rbac.policyEngineStatus")}
            value={t("rbac.activeLockedVal")}
            description={t("rbac.policyEngineDesc")}
            iconName="ShieldCheck"
          />
        </div>

        {/* Warning Indicator */}
        <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-4 dark:border-amber-950/20 dark:bg-amber-950/10">
          <div className="flex gap-2">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-800 dark:text-amber-400">
              <strong>{t("rbac.vettingWarningTitle")}</strong> {t("rbac.vettingWarningDesc")}
            </p>
          </div>
        </div>

        {/* Permission Grid Matrix */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 overflow-hidden">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-6">
            {t("rbac.toggleMatrixTitle")}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900/30">
                  <th className="px-4 py-3 max-w-xs">{t("rbac.tableColPrivilege")}</th>
                  {Object.keys(rolesMap).map((roleKey) => {
                    const fullRoleName = t(`roles.${rolesMap[roleKey].name}` as any) || rolesMap[roleKey].name;
                    const splitRoleName = fullRoleName.split(" ")[0];
                    return (
                      <th key={roleKey} className="px-3 py-3 text-center tracking-wider truncate text-[10px] uppercase group relative cursor-help">
                        {splitRoleName}..
                        <div className="absolute hidden group-hover:block bg-slate-950 text-white rounded p-2 text-[8px] z-10 whitespace-nowrap shadow-lg -bottom-8 left-1/2 transform -translate-x-1/2 dark:bg-slate-800 border border-slate-700">
                          {fullRoleName}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {permissionList.map((perm) => {
                  const permName = t(`rbac.permissions.${perm.code}.name` as any) || perm.name;
                  const permDesc = t(`rbac.permissions.${perm.code}.desc` as any) || perm.desc;
                  return (
                    <tr key={perm.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5 group relative cursor-help">
                          <span className="font-bold text-slate-900 dark:text-white">{permName}</span>
                          <span className="text-[9px] text-slate-400 font-medium font-mono">{perm.code}</span>
                          <div className="absolute hidden group-hover:block bg-slate-950 text-white rounded p-2 text-[8px] z-10 shadow-lg left-0 -top-8 dark:bg-slate-800 border border-slate-700">
                            {permDesc}
                          </div>
                        </div>
                      </td>
                      {Object.keys(rolesMap).map((roleKey) => {
                        const role = rolesMap[roleKey];
                        const isChecked = role.permissions.includes(perm.code);
                        return (
                          <td key={roleKey} className="px-3 py-3 text-center">
                            <button
                              onClick={() => handleTogglePermission(roleKey, perm.code)}
                              className={`inline-flex items-center justify-center transition-colors duration-200 ${
                                isChecked ? "text-indigo-600 dark:text-indigo-400" : "text-slate-300 dark:text-slate-700"
                              }`}
                            >
                              {isChecked ? (
                                <ToggleRight className="h-6 w-6 cursor-pointer" />
                              ) : (
                                <ToggleLeft className="h-6 w-6 cursor-pointer" />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </PermissionGate>
    </div>
  );
}
