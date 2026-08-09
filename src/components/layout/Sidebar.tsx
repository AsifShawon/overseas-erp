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
  PanelLeftClose,
  PanelLeftOpen,
  Globe2,
  Mail,
  Building2,
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

/** Shared nav item shell so expanded and collapsed states stay consistent. */
function NavItem({
  href,
  label,
  icon: Icon,
  isActive,
  isCollapsed,
  accent = "default",
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  isCollapsed: boolean;
  accent?: "default" | "platform";
}) {
  return (
    <Link
      href={href}
      title={isCollapsed ? label : undefined}
      aria-current={isActive ? "page" : undefined}
      className={`group relative flex items-center rounded-md transition-colors duration-150 ${
        isCollapsed ? "mx-auto h-10 w-10 justify-center" : "h-10 gap-2.5 px-2.5"
      } ${
        isActive
          ? "bg-sidebar-active-bg text-sidebar-active-text"
          : accent === "platform"
            ? "text-warning-theme hover:bg-sidebar-hover-bg"
            : "text-sidebar-text hover:bg-sidebar-hover-bg hover:text-white"
      }`}
    >
      {isActive && !isCollapsed && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-white/80"
        />
      )}
      <Icon className="h-4.5 w-4.5 shrink-0" />
      {!isCollapsed && (
        <span className="truncate text-[13px] font-medium">{label}</span>
      )}

      {/* Accessible tooltip for the collapsed rail */}
      {isCollapsed && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md border border-sidebar-border bg-sidebar-bg px-2 py-1 text-[11px] font-medium text-white shadow-md group-hover:block group-focus-visible:block"
        >
          {label}
        </span>
      )}
    </Link>
  );
}

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { hasAccess, user } = useMockAuth();
  const { t } = useT();

  // Auto close mobile drawer on route transition
  useEffect(() => {
    if (mobileOpen && setMobileOpen) {
      setMobileOpen(false);
    }
  }, [pathname]);

  // Close the mobile drawer on Escape
  useEffect(() => {
    if (!mobileOpen || !setMobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, setMobileOpen]);

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

  const localize = (label: string) => {
    const navKey = getNavLinkKey(label);
    if (!navKey) return label;
    const localized = t(`nav.${navKey}`);
    return localized.startsWith("nav.") ? label : localized;
  };

  const isCollapsed = collapsed && !mobileOpen;
  const inPlatformArea = pathname.startsWith("/platform");

  const sectionLabel = (key: string, fallback: string) => {
    const localized = t(`nav.section.${key}`);
    return localized.startsWith("nav.section.") ? fallback : localized;
  };

  return (
    <>
      {/* Backdrop for mobile drawer */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen && setMobileOpen(false)}
          aria-hidden="true"
          className="app-overlay-enter fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      <aside
        aria-label="Main navigation"
        className={`fixed bottom-0 left-0 top-0 z-40 flex w-60 flex-col border-r border-sidebar-border bg-sidebar-bg text-sidebar-text transition-[width,transform] duration-200 lg:translate-x-0 ${
          collapsed ? "lg:w-18" : "lg:w-60"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Brand */}
        <div className="relative flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-3.5">
          {!isCollapsed ? (
            <img
              src="/visatek_logo_transparent.png"
              alt="VisaTek"
              className="h-7 w-auto object-contain"
            />
          ) : (
            <img
              src="/visatek_glove_favicon.ico"
              alt="VisaTek"
              className="mx-auto h-6 w-6 object-contain"
            />
          )}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className="absolute -right-3 top-1/2 z-50 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-sidebar-border bg-sidebar-bg text-sidebar-text transition-colors hover:text-white lg:flex cursor-pointer"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-3 w-3" />
            ) : (
              <PanelLeftClose className="h-3 w-3" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="scrollbar-none flex-1 space-y-5 overflow-y-auto px-2.5 py-3">
          {inPlatformArea ? (
            <div className="space-y-1">
              {!isCollapsed && (
                <div className="select-none px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-section">
                  {sectionLabel("platform", "PLATFORM ADMIN")}
                </div>
              )}
              {PLATFORM_LINKS.map((link) => (
                <NavItem
                  key={link.label}
                  href={link.href}
                  label={localize(link.label)}
                  icon={link.icon}
                  isCollapsed={isCollapsed}
                  isActive={
                    pathname === link.href ||
                    (link.href !== "/platform" && pathname.startsWith(link.href))
                  }
                />
              ))}

              {user.activeCompanyId && (
                <div className="mt-3 border-t border-dashed border-sidebar-border pt-3">
                  <NavItem
                    href="/dashboard"
                    label={localize("Exit Platform Admin") || "Exit Platform Admin"}
                    icon={Globe2}
                    isCollapsed={isCollapsed}
                    isActive={false}
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              {user.isPlatformAdmin && (
                <div>
                  <NavItem
                    href="/platform"
                    label="Platform Admin"
                    icon={ShieldCheck}
                    isCollapsed={isCollapsed}
                    isActive={false}
                    accent="platform"
                  />
                </div>
              )}

              {SIDEBAR_GROUPS.map((group) => {
                // RBAC filtering — unchanged from the original implementation.
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
                      <div className="select-none px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-section">
                        {sectionLabel(group.sectionKey, group.sectionTitle)}
                      </div>
                    )}
                    {isCollapsed && (
                      <div
                        aria-hidden="true"
                        className="mx-auto my-2 h-px w-6 bg-sidebar-border"
                      />
                    )}
                    {allowedLinks.map((link) => (
                      <NavItem
                        key={link.label}
                        href={link.href}
                        label={localize(link.label)}
                        icon={link.icon}
                        isCollapsed={isCollapsed}
                        isActive={
                          pathname === link.href ||
                          (link.href !== "/dashboard" && pathname.startsWith(link.href))
                        }
                      />
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </nav>

        {/* Signed-in user */}
        <div
          className={`shrink-0 border-t border-sidebar-border ${
            isCollapsed ? "p-2" : "p-3"
          }`}
        >
          <div
            className={`flex items-center gap-2.5 ${isCollapsed ? "justify-center" : ""}`}
            title={isCollapsed ? `${user.fullName} (${user.roleName})` : undefined}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-active-bg text-[11px] font-semibold uppercase text-white">
              {user.fullName.substring(0, 2)}
            </div>
            {!isCollapsed && (
              <div className="flex min-w-0 flex-col">
                <p className="truncate text-xs font-semibold text-white">
                  {user.fullName}
                </p>
                <p className="truncate text-[11px] text-sidebar-text">
                  {t(`roles.${user.roleName}`) || user.roleName}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
