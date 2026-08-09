"use client";

import React, { useEffect } from "react";
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
  Mail,
  Building2,
  CheckSquare,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

interface SidebarLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: PermissionCode;
}

interface SidebarGroup {
  sectionTitle: string;
  sectionKey: string;
  links: SidebarLink[];
}

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    sectionTitle: "OVERVIEW",
    sectionKey: "overview",
    links: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "VIEW_DASHBOARD" },
    ],
  },
  {
    sectionTitle: "OPERATIONS",
    sectionKey: "operations",
    links: [
      { label: "Applicants", href: "/applicants", icon: Users, permission: "VIEW_APPLICANTS" },
      { label: "Job Orders", href: "/job-orders", icon: Briefcase, permission: "VIEW_DASHBOARD" },
      { label: "Agents", href: "/agents", icon: UserCheck, permission: "VIEW_COMMISSIONS" },
      { label: "Documents", href: "/documents", icon: FileText, permission: "UPLOAD_DOCUMENT" },
    ],
  },
  {
    sectionTitle: "FINANCE",
    sectionKey: "finance",
    links: [
      { label: "Accounts", href: "/accounts", icon: CreditCard, permission: "VIEW_ACCOUNTS" },
      { label: "Commissions", href: "/commissions", icon: Percent, permission: "VIEW_COMMISSIONS" },
      { label: "Receipts & Invoices", href: "/receipts-invoices", icon: Receipt, permission: "VIEW_ACCOUNTS" },
    ],
  },
  {
    sectionTitle: "INSIGHTS",
    sectionKey: "insights",
    links: [
      { label: "Reports", href: "/reports", icon: BarChart3, permission: "VIEW_REPORTS" },
    ],
  },
  {
    sectionTitle: "SYSTEM",
    sectionKey: "system",
    links: [
      { label: "Notifications", href: "/notifications", icon: Bell, permission: "VIEW_NOTIFICATIONS" },
      { label: "Audit Logs", href: "/audit-logs", icon: History, permission: "VIEW_AUDIT_LOGS" },
      { label: "Company Users", href: "/settings/users", icon: Users, permission: "VIEW_COMPANY_USERS" },
      { label: "Branches", href: "/settings/branches", icon: Building2, permission: "VIEW_BRANCHES" },
      { label: "RBAC Settings", href: "/rbac", icon: ShieldCheck, permission: "MANAGE_RBAC" },
    ],
  },
];

const PLATFORM_LINKS: SidebarLink[] = [
  { label: "Platform Dashboard", href: "/platform", icon: LayoutDashboard },
  { label: "Company Applications", href: "/platform/company-applications", icon: FileText },
  { label: "Global Email & SMTP", href: "/platform/settings/email", icon: Mail },
  { label: "System Notifications", href: "/platform/notifications", icon: Bell },
];

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { hasAccess, user } = useMockAuth();
  const { t, locale } = useT();

  // Auto close mobile drawer on route transition
  useEffect(() => {
    if (mobileOpen && setMobileOpen) {
      setMobileOpen(false);
    }
  }, [pathname]);

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
      case "Company Users": return "companyUsers";
      case "Branches": return "branches";
      case "RBAC Settings": return "rbacSettings";
      case "Platform Dashboard": return "platformDashboard";
      case "Company Applications": return "companyApplications";
      case "Global Email & SMTP": return "globalEmail";
      case "System Notifications": return "systemNotifications";
      case "Exit Platform Admin": return "exitPlatform";
      default: return "";
    }
  };

  const isCollapsed = collapsed && !mobileOpen;

  return (
    <>
      {/* Backdrop for mobile drawer */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen && setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar-bg text-sidebar-text transition-all duration-300 ${
          collapsed ? "lg:w-16" : "lg:w-60"
        } w-60 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="relative flex h-16 items-center justify-between px-3.5 border-b border-sidebar-border bg-sidebar-bg shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5">
              <img src="/visatek_logo_transparent.png" alt="VisaTek Logo" className="h-7 w-auto object-contain" />
            </div>
          ) : (
            <div className="mx-auto flex items-center justify-center">
              <img src="/visatek_glove_favicon.ico" alt="VisaTek Icon" className="h-6 w-6 object-contain" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar-bg text-sidebar-text hover:bg-sidebar-hover-bg hover:text-white shadow-sm transition-colors cursor-pointer z-50"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>
        </div>

        {/* Nav Links Container */}
        <nav className="flex-1 space-y-4 px-2.5 py-3 overflow-y-auto scrollbar-none">
          {pathname.startsWith("/platform") ? (
            <div className="space-y-1">
              {!isCollapsed && (
                <div className="px-2 pt-1 pb-1 text-[10px] font-bold tracking-wider text-sidebar-section uppercase">
                  PLATFORM ADMIN
                </div>
              )}
              {PLATFORM_LINKS.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/platform" && pathname.startsWith(link.href));
                const Icon = link.icon;
                const navKey = getNavLinkKey(link.label);
                const localizedLabel = navKey ? t(`nav.${navKey}`) : link.label;
                const finalLabel = localizedLabel.startsWith("nav.") ? link.label : localizedLabel;

                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    title={isCollapsed ? finalLabel : undefined}
                    className={`relative flex items-center rounded-lg transition-all duration-150 group ${
                      isCollapsed
                        ? "justify-center p-2.5 mx-auto w-10 h-10"
                        : "gap-3 px-2.5 py-2 text-xs font-semibold"
                    } ${
                      isActive
                        ? "bg-sidebar-active-bg text-sidebar-active-text font-bold shadow-xs"
                        : "text-sidebar-text hover:bg-sidebar-hover-bg hover:text-white"
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-white" : "text-sidebar-text group-hover:text-white"}`} />
                    {!isCollapsed && <span className="truncate">{finalLabel}</span>}
                  </Link>
                );
              })}

              {user.activeCompanyId && (
                <Link
                  href="/dashboard"
                  title={isCollapsed ? (t("nav.exitPlatform") || "Exit Platform Admin") : undefined}
                  className={`relative flex items-center rounded-lg transition-all duration-150 group mt-3 border-t border-dashed border-sidebar-border pt-3 ${
                    isCollapsed
                      ? "justify-center p-2.5 mx-auto w-10 h-10"
                      : "gap-3 px-2.5 py-2 text-xs font-semibold"
                  } text-sidebar-text hover:bg-sidebar-hover-bg hover:text-white`}
                >
                  <Globe2 className="h-4.5 w-4.5 shrink-0 text-sidebar-text group-hover:text-white" />
                  {!isCollapsed && <span className="truncate">{t("nav.exitPlatform") || "Exit Platform Admin"}</span>}
                </Link>
              )}
            </div>
          ) : (
            <>
              {user.isPlatformAdmin && (
                <div className="mb-2">
                  <Link
                    href="/platform"
                    title={isCollapsed ? "Platform Admin" : undefined}
                    className={`relative flex items-center rounded-lg transition-all duration-150 group ${
                      isCollapsed
                        ? "justify-center p-2.5 mx-auto w-10 h-10"
                        : "gap-3 px-2.5 py-2 text-xs font-semibold"
                    } ${
                      pathname.startsWith("/platform")
                        ? "bg-sidebar-active-bg text-white font-bold shadow-xs"
                        : "text-amber-400 hover:bg-sidebar-hover-bg hover:text-amber-300"
                    }`}
                  >
                    <ShieldCheck className="h-4.5 w-4.5 shrink-0" />
                    {!isCollapsed && <span className="truncate">Platform Admin</span>}
                  </Link>
                </div>
              )}

              {SIDEBAR_GROUPS.map((group) => {
                // Filter allowed links in group based on RBAC
                const allowedLinks = group.links.filter((link) => {
                  if (link.permission && !hasAccess(link.permission)) return false;
                  if (
                    user.roleName === "Agent" &&
                    (link.href === "/rbac" ||
                      link.href === "/audit-logs" ||
                      link.href === "/reports" ||
                      link.href === "/job-orders" ||
                      link.href === "/settings/users")
                  ) {
                    return false;
                  }
                  return true;
                });

                if (allowedLinks.length === 0) return null;

                return (
                  <div key={group.sectionKey} className="space-y-1">
                    {!isCollapsed && (
                      <div className="px-2 pt-2 pb-1 text-[10px] font-bold tracking-wider text-sidebar-section uppercase select-none">
                        {group.sectionTitle}
                      </div>
                    )}
                    {allowedLinks.map((link) => {
                      const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
                      const Icon = link.icon;
                      const navKey = getNavLinkKey(link.label);
                      const localizedLabel = navKey ? t(`nav.${navKey}`) : link.label;
                      const finalLabel = localizedLabel.startsWith("nav.") ? link.label : localizedLabel;

                      return (
                        <Link
                          key={link.label}
                          href={link.href}
                          title={isCollapsed ? finalLabel : undefined}
                          className={`relative flex items-center rounded-lg transition-all duration-150 group ${
                            isCollapsed
                              ? "justify-center p-2 mx-auto w-9 h-9"
                              : "gap-2.5 px-2.5 py-2 text-xs font-semibold"
                          } ${
                            isActive
                              ? "bg-sidebar-active-bg text-white font-bold shadow-xs"
                              : "text-sidebar-text hover:bg-sidebar-hover-bg hover:text-white"
                          }`}
                        >
                          <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-white" : "text-sidebar-text group-hover:text-white"}`} />
                          {!isCollapsed && <span className="truncate">{finalLabel}</span>}
                          {isActive && !isCollapsed && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white opacity-80" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
        </nav>

        {/* User Status Bottom Footer */}
        <div className={`border-t border-sidebar-border bg-sidebar-bg shrink-0 ${
          isCollapsed ? "p-2 text-center" : "p-3"
        }`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-active-bg text-xs font-bold text-white uppercase shrink-0">
                {user.fullName.substring(0, 2)}
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
                <p className="text-[11px] font-semibold text-sidebar-text truncate">
                  {t(`roles.${user.roleName}`) || user.roleName}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex mx-auto items-center justify-center w-9 h-9 text-xs font-bold text-white rounded-lg bg-sidebar-active-bg uppercase" title={`${user.fullName} (${user.roleName})`}>
              {user.fullName.substring(0, 2)}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

