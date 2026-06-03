"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMockAuth } from "@/context/MockAuthContext";
import { PermissionCode } from "@/lib/permissions";
import { useT } from "@/i18n/useT";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserCheck,
  FileText,
  CreditCard,
  Percent,
  Receipt,
  BarChart3,
  Bell,
  History,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Globe2,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

interface SidebarLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: PermissionCode;
}

const SIDEBAR_LINKS: SidebarLink[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "VIEW_DASHBOARD" },
  { label: "Applicants", href: "/applicants", icon: Users, permission: "VIEW_APPLICANTS" },
  { label: "Job Orders", href: "/job-orders", icon: Briefcase, permission: "VIEW_DASHBOARD" }, // Admin/Ops/HR
  { label: "Agents", href: "/agents", icon: UserCheck, permission: "VIEW_COMMISSIONS" }, // Admin/Ops/Accounts
  { label: "Documents", href: "/documents", icon: FileText, permission: "UPLOAD_DOCUMENT" },
  { label: "Accounts", href: "/accounts", icon: CreditCard, permission: "VIEW_ACCOUNTS" },
  { label: "Commissions", href: "/commissions", icon: Percent, permission: "VIEW_COMMISSIONS" },
  { label: "Receipts & Invoices", href: "/receipts-invoices", icon: Receipt, permission: "VIEW_ACCOUNTS" },
  { label: "Reports", href: "/reports", icon: BarChart3, permission: "VIEW_REPORTS" },
  { label: "Notifications", href: "/notifications", icon: Bell, permission: "VIEW_NOTIFICATIONS" },
  { label: "Audit Logs", href: "/audit-logs", icon: History, permission: "VIEW_AUDIT_LOGS" },
  { label: "RBAC Settings", href: "/rbac", icon: ShieldCheck, permission: "MANAGE_RBAC" },
];

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { hasAccess, user } = useMockAuth();
  const { t } = useT();

  // Applicants don't see the staff sidebar (they use their own mobile portal)
  if (user.roleName === "Applicant") return null;

  const getNavLinkKey = (label: string) => {
    switch (label) {
      case "Dashboard": return "dashboard";
      case "Applicants": return "applicants";
      case "Job Orders": return "jobOrders";
      case "Agents": return "agents";
      case "Documents": return "documents";
      case "Accounts": return "accounts";
      case "Commissions": return "commissions";
      case "Receipts & Invoices": return "receiptsInvoices";
      case "Reports": return "reports";
      case "Notifications": return "notifications";
      case "Audit Logs": return "auditLogs";
      case "RBAC Settings": return "rbacSettings";
      default: return "";
    }
  };

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-20 flex flex-col border-r border-border-theme bg-surface text-text-muted transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border-theme bg-surface-soft">
        {!collapsed && (
          <div className="flex items-center gap-2 font-bold text-text-theme text-base">
            <img src="/visatek_logo_transparent.png" alt="VisaTek Logo" className="h-6 w-auto object-contain" />
            <span className="tracking-wide">{t("nav.brandTitle") || "Visa"}<span className="text-primary-theme">{t("nav.brandTitleHighlight") || "Tek"}</span></span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto">
            <img src="/visatek_glove_favicon.ico" alt="VisaTek Icon" className="h-6 w-6 object-contain" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1 text-text-soft hover:bg-bg-muted hover:text-text-theme dark:hover:bg-surface-elevated dark:hover:text-text-theme transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-border-strong">
        {user.isPlatformAdmin && (
          <Link
            href="/platform"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group ${
              pathname.startsWith("/platform")
                ? "bg-primary-theme text-white shadow-sm shadow-primary-theme/30"
                : "text-text-muted hover:bg-bg-muted hover:text-text-theme dark:hover:bg-surface-elevated dark:hover:text-text-theme"
            }`}
          >
            <ShieldCheck className={`h-5 w-5 shrink-0 ${pathname.startsWith("/platform") ? "text-white" : "text-text-soft group-hover:text-text-theme dark:group-hover:text-text-theme"}`} />
            {!collapsed && <span className="truncate">Platform Admin</span>}
          </Link>
        )}
        {SIDEBAR_LINKS.map((link) => {
          // Check permission guard
          if (link.permission && !hasAccess(link.permission)) return null;

          // Agent special check: limit some links
          if (user.roleName === "Agent" && (link.href === "/rbac" || link.href === "/audit-logs" || link.href === "/reports" || link.href === "/job-orders")) {
            return null;
          }

          const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
          const Icon = link.icon;
          const navKey = getNavLinkKey(link.label);
          const localizedLabel = navKey ? t(`nav.${navKey}`) : link.label;

          return (
            <Link
              key={link.label}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-primary-theme text-white shadow-sm shadow-primary-theme/30"
                  : "text-text-muted hover:bg-bg-muted hover:text-text-theme dark:hover:bg-surface-elevated dark:hover:text-text-theme"
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-text-soft group-hover:text-text-theme dark:group-hover:text-text-theme"}`} />
              {!collapsed && <span className="truncate">{localizedLabel}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Status Bottom Info */}
      <div className="border-t border-border-theme bg-surface-soft p-4">
        {!collapsed ? (
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-semibold text-text-theme truncate">{user.fullName}</p>
            <p className="text-[10px] text-text-muted truncate">{t(`roles.${user.roleName}`) || user.roleName}</p>
          </div>
        ) : (
          <div className="flex justify-center text-xs font-bold text-white rounded bg-primary-theme py-1 uppercase">
            {(t(`roles.${user.roleName}`) || user.roleName).substring(0, 2)}
          </div>
        )}
      </div>
    </aside>
  );
}

