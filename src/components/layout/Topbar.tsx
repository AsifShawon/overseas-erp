"use client";

import React, { useState } from "react";
import { useMockAuth } from "@/context/MockAuthContext";
import { Bell, Search, LogOut, ChevronDown, User as UserIcon, Lock, Menu, Building2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { MOCK_NOTIFICATIONS } from "@/lib/mockData";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "@/components/language/LanguageToggle";
import { useT } from "@/i18n/useT";

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, allUsers, switchRole, logout, activeBranchId, setActiveBranchId } = useMockAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { t, locale } = useT();

  const activeBranch = user.branches?.find((b: any) => b.id === activeBranchId);
  const canSwitch = user.permissions?.includes("VIEW_ALL_BRANCH_DATA") || (user.branches && user.branches.length > 1);

  // Compute unread notifications for this mock user
  const unreadNotifications = MOCK_NOTIFICATIONS.filter(
    (n) => n.userId === user.id && !n.isRead
  );

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    switchRole(e.target.value);
    const selectedUser = allUsers.find((u) => u.id === e.target.value);
    if (selectedUser?.roleName === "Applicant") {
      router.push("/applicant/portal");
    } else {
      router.push("/dashboard");
    }
  };

  const handleLogoutClick = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between gap-3 border-b border-border-theme bg-surface/95 backdrop-blur-md px-4 md:px-6 shadow-xs">
      {/* Left: Mobile Trigger & Global Search */}
      <div className="flex flex-1 items-center gap-3 min-w-0 max-w-md">
        {user.roleName !== "Applicant" && (
          <button
            onClick={onMenuClick}
            className="rounded-lg p-1.5 text-text-soft hover:bg-bg-muted hover:text-text-theme lg:hidden cursor-pointer shrink-0"
            aria-label="Toggle Navigation Drawer"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        {user.roleName !== "Applicant" && (
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-soft">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder={t("applicants.searchPlaceholder")}
              className="w-full rounded-lg border border-border-theme bg-bg py-1.5 pl-9 pr-3 text-xs outline-none transition-all focus:border-primary-theme focus:bg-surface focus:ring-2 focus:ring-primary-theme/15 text-text-theme"
            />
          </div>
        )}
      </div>

      {/* Right: Workspace Selector, Demo Role Switcher, Controls & Profile */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Branch Workspace Selector Pill */}
        {user.activeCompanyId && user.branches && user.branches.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-border-theme bg-surface-soft px-2.5 py-1.5 text-xs font-semibold text-text-theme">
            <Building2 className="h-3.5 w-3.5 text-primary-theme shrink-0" />
            <span className="text-text-soft hidden md:inline whitespace-nowrap">
              {locale === "bn" ? "শাখা:" : "Branch:"}
            </span>
            {canSwitch ? (
              <select
                value={activeBranchId || "all"}
                onChange={(e) => setActiveBranchId(e.target.value === "all" ? "all" : e.target.value)}
                className="border-none bg-transparent font-bold text-text-theme outline-none cursor-pointer text-xs"
              >
                {user.permissions?.includes("VIEW_ALL_BRANCH_DATA") && (
                  <option value="all" className="text-text-theme bg-surface">
                    {locale === "bn" ? "সব শাখা" : "All Branches"}
                  </option>
                )}
                {user.branches.map((b: any) => (
                  <option key={b.id} value={b.id} className="text-text-theme bg-surface">
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-bold text-primary-theme truncate max-w-[110px]">
                {activeBranch?.name || user.branches[0]?.name || "Head Office"}
              </span>
            )}
          </div>
        )}

        {/* Demo Quick-Role Switcher Pill */}
        <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-950/40 dark:bg-amber-950/20 px-2.5 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-400">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="hidden lg:inline whitespace-nowrap">{t("auth.complianceNotice")}:</span>
          <select
            value={user.id}
            onChange={handleRoleChange}
            className="border-none bg-transparent font-bold text-amber-950 dark:text-amber-300 outline-none cursor-pointer text-xs max-w-[130px] md:max-w-[160px] truncate"
          >
            {allUsers.map((u) => (
              <option key={u.id} value={u.id} className="text-text-theme bg-surface">
                {u.fullName} ({t(`roles.${u.roleName}`) || u.roleName})
              </option>
            ))}
          </select>
        </div>

        {/* Controls Group */}
        <div className="flex items-center gap-1.5">
          {/* Notifications Icon with Badge */}
          <button
            onClick={() => router.push("/notifications")}
            className="relative cursor-pointer rounded-lg p-2 text-text-soft hover:bg-bg-muted hover:text-text-theme transition-colors"
            title={t("nav.notifications")}
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                {unreadNotifications.length}
              </span>
            )}
          </button>

          {/* Language Toggle Pill */}
          <LanguageToggle />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Account Settings Dropdown */}
          <div className="relative ml-1">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-lg p-1 hover:bg-bg-muted transition-colors cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary-theme shrink-0 font-bold text-xs uppercase">
                {user.fullName.substring(0, 2)}
              </div>
              <div className="hidden flex-col items-start text-left md:flex max-w-[110px]">
                <span className="text-xs font-bold text-text-theme leading-tight truncate w-full">
                  {user.fullName}
                </span>
                <span className="text-[11px] text-text-soft font-semibold truncate w-full">
                  {t(`roles.${user.roleName}`) || user.roleName}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-text-soft shrink-0" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border-theme bg-surface py-1.5 shadow-lg z-30 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3.5 py-2 border-b border-border-theme">
                  <p className="text-[11px] text-text-soft font-medium">{locale === "bn" ? "সাইন-ইন করা আছে" : "Signed in as"}</p>
                  <p className="text-xs font-bold text-text-theme truncate mt-0.5">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push("/notifications");
                  }}
                  className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-semibold text-text-muted hover:bg-bg-muted hover:text-text-theme cursor-pointer"
                >
                  <Bell className="h-4 w-4 text-text-soft" /> {t("nav.notifications")}
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push("/account/security");
                  }}
                  className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-semibold text-text-muted hover:bg-bg-muted hover:text-text-theme cursor-pointer"
                >
                  <Lock className="h-4 w-4 text-text-soft" /> {locale === "bn" ? "অ্যাকাউন্ট সিকিউরিটি" : "Account Security"}
                </button>
                <div className="my-1 border-t border-border-theme" />
                <button
                  onClick={handleLogoutClick}
                  className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-bold text-danger-theme hover:bg-danger-soft cursor-pointer"
                >
                  <LogOut className="h-4 w-4" /> {locale === "bn" ? "লগ আউট" : "Log Out"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;

