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

const SIDEBAR_LINKS: SidebarLink[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "VIEW_DASHBOARD" },
  { label: "Applicants", href: "/applicants", icon: Users, permission: "VIEW_APPLICANTS" },
  { label: "Job Orders", href: "/job-orders", icon: Briefcase, permission: "VIEW_DASHBOARD" },
  { label: "Agents", href: "/agents", icon: UserCheck, permission: "VIEW_COMMISSIONS" },
  { label: "Documents", href: "/documents", icon: FileText, permission: "UPLOAD_DOCUMENT" },
  { label: "Accounts", href: "/accounts", icon: CreditCard, permission: "VIEW_ACCOUNTS" },
  { label: "Commissions", href: "/commissions", icon: Percent, permission: "VIEW_COMMISSIONS" },
  { label: "Receipts & Invoices", href: "/receipts-invoices", icon: Receipt, permission: "VIEW_ACCOUNTS" },
  { label: "Reports", href: "/reports", icon: BarChart3, permission: "VIEW_REPORTS" },
  { label: "Notifications", href: "/notifications", icon: Bell, permission: "VIEW_NOTIFICATIONS" },
  { label: "Audit Logs", href: "/audit-logs", icon: History, permission: "VIEW_AUDIT_LOGS" },
  { label: "Company Users", href: "/settings/users", icon: Users, permission: "VIEW_COMPANY_USERS" },
  { label: "RBAC Settings", href: "/rbac", icon: ShieldCheck, permission: "MANAGE_RBAC" },
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
  const { t } = useT();

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
      case "RBAC Settings": return "rbacSettings";
      case "Platform Dashboard": return "platformDashboard";
      case "Company Applications": return "companyApplications";
      case "Global Email & SMTP": return "globalEmail";
      case "System Notifications": return "systemNotifications";
      case "Exit Platform Admin": return "exitPlatform";
      default: return "";
    }
  };

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
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar-bg text-sidebar-text transition-transform duration-300 lg:transition-all ${
          collapsed ? "lg:w-16" : "lg:w-64"
        } w-64 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border bg-sidebar-bg shrink-0">
          {(!collapsed || mobileOpen) ? (
            <div className="flex items-center gap-2 font-bold text-white text-base">
              <img src="/visatek_logo_transparent.png" alt="VisaTek Logo" className="h-6 w-auto object-contain brightness-0 invert" />
              <span className="tracking-wide">{t("nav.brandTitle") || "Visa"}<span className="text-brand-red">{t("nav.brandTitleHighlight") || "Tek"}</span></span>
            </div>
          ) : (
            <div className="mx-auto">
              <img src="/visatek_glove_favicon.ico" alt="VisaTek Icon" className="h-6 w-6 object-contain" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:block rounded-lg p-1 text-sidebar-text hover:bg-sidebar-hover-bg hover:text-white transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto scrollbar-none">
          {pathname.startsWith("/platform") ? (
            <>
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
                    className={`flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-[15px] font-semibold leading-relaxed transition-all duration-200 group ${
                      isActive
                        ? "bg-sidebar-active-bg text-sidebar-active-text shadow-sm shadow-sidebar-active-bg/30"
                        : "text-sidebar-text hover:bg-sidebar-hover-bg hover:text-white"
                    }`}
                  >
                    <Icon className={`h-5.5 w-5.5 shrink-0 ${isActive ? "text-sidebar-active-text" : "text-sidebar-text group-hover:text-white"}`} />
                    {(!collapsed || mobileOpen) && <span className="truncate">{finalLabel}</span>}
                  </Link>
                );
              })}

              {user.activeCompanyId && (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-[15px] font-semibold leading-relaxed text-sidebar-text hover:bg-sidebar-hover-bg hover:text-white transition-all duration-200 group mt-4 border-t border-dashed border-sidebar-border pt-4"
                >
                  <Globe2 className="h-5.5 w-5.5 shrink-0 text-sidebar-text group-hover:text-white" />
                  {(!collapsed || mobileOpen) && <span className="truncate">{t("nav.exitPlatform") || "Exit Platform Admin"}</span>}
                </Link>
              )}
            </>
          ) : (
            <>
              {user.isPlatformAdmin && (
                <Link
                  href="/platform"
                  className={`flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-[15px] font-semibold leading-relaxed transition-all duration-200 group ${
                    pathname.startsWith("/platform")
                      ? "bg-sidebar-active-bg text-sidebar-active-text shadow-sm shadow-sidebar-active-bg/30"
                      : "text-sidebar-text hover:bg-sidebar-hover-bg hover:text-white"
                  }`}
                >
                  <ShieldCheck className={`h-5.5 w-5.5 shrink-0 ${pathname.startsWith("/platform") ? "text-sidebar-active-text" : "text-sidebar-text group-hover:text-white"}`} />
                  {(!collapsed || mobileOpen) && <span className="truncate">Platform Admin</span>}
                </Link>
              )}
              {SIDEBAR_LINKS.map((link) => {
                // Check permission guard
                if (link.permission && !hasAccess(link.permission)) return null;

                // Agent special check: limit some links
                if (user.roleName === "Agent" && (link.href === "/rbac" || link.href === "/audit-logs" || link.href === "/reports" || link.href === "/job-orders" || link.href === "/settings/users")) {
                  return null;
                }

                const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
                const Icon = link.icon;
                const navKey = getNavLinkKey(link.label);
                const localizedLabel = navKey ? t(`nav.${navKey}`) : link.label;
                const finalLabel = localizedLabel.startsWith("nav.") ? link.label : localizedLabel;

                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-[15px] font-semibold leading-relaxed transition-all duration-200 group ${
                      isActive
                        ? "bg-sidebar-active-bg text-sidebar-active-text shadow-sm shadow-sidebar-active-bg/30"
                        : "text-sidebar-text hover:bg-sidebar-hover-bg hover:text-white"
                    }`}
                  >
                    <Icon className={`h-5.5 w-5.5 shrink-0 ${isActive ? "text-sidebar-active-text" : "text-sidebar-text group-hover:text-white"}`} />
                    {(!collapsed || mobileOpen) && <span className="truncate">{finalLabel}</span>}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User Status Bottom Info */}
        <div className="border-t border-sidebar-border bg-sidebar-bg p-4 shrink-0">
          {(!collapsed || mobileOpen) ? (
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold text-white truncate">{user.fullName}</p>
              <p className="text-sm font-semibold text-sidebar-text truncate leading-relaxed">
                {t(`roles.${user.roleName}`) || user.roleName}
              </p>
            </div>
          ) : (
            <div className="flex justify-center text-sm font-bold text-sidebar-active-text rounded bg-sidebar-active-bg py-1.5 uppercase">
              {(t(`roles.${user.roleName}`) || user.roleName).substring(0, 2)}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
