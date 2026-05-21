"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMockAuth } from "@/context/MockAuthContext";
import { PermissionCode } from "@/lib/permissions";
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

  // Applicants don't see the staff sidebar (they use their own mobile portal)
  if (user.roleName === "Applicant") return null;

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-20 flex flex-col border-r border-slate-200 bg-slate-900 text-slate-300 transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800 bg-slate-950">
        {!collapsed && (
          <div className="flex items-center gap-2 font-bold text-white text-base">
            <Globe2 className="h-5 w-5 text-indigo-500 animate-spin-slow" />
            <span className="tracking-wide">Overseas<span className="text-indigo-400">ERP</span></span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto">
            <Globe2 className="h-5 w-5 text-indigo-500" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
        {SIDEBAR_LINKS.map((link) => {
          // Check permission guard
          if (link.permission && !hasAccess(link.permission)) return null;

          // Agent special check: limit some links
          if (user.roleName === "Agent" && (link.href === "/rbac" || link.href === "/audit-logs" || link.href === "/reports" || link.href === "/job-orders")) {
            return null;
          }

          const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
          const Icon = link.icon;

          return (
            <Link
              key={link.label}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
              {!collapsed && <span className="truncate">{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Status Bottom Info */}
      <div className="border-t border-slate-800 bg-slate-950 p-4">
        {!collapsed ? (
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-semibold text-white truncate">{user.fullName}</p>
            <p className="text-[10px] text-slate-400 truncate">{user.roleName}</p>
          </div>
        ) : (
          <div className="flex justify-center text-xs font-bold text-white rounded bg-slate-800 py-1 uppercase">
            {user.roleName.substring(0, 2)}
          </div>
        )}
      </div>
    </aside>
  );
}
