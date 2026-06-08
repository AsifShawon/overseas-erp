"use client";

import React, { useState } from "react";
import { useMockAuth } from "@/context/MockAuthContext";
import { Bell, Search, LogOut, ChevronDown, User as UserIcon, Lock, Menu } from "lucide-react";
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
    // Refresh dashboard context based on role choice
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
    <header className="sticky top-0 z-10 flex min-h-16 w-full flex-wrap items-center justify-between gap-4 border-b border-border-theme bg-surface px-4 py-3 md:px-6 shadow-sm">
      {/* Mobile Drawer Trigger & Search */}
      <div className="flex flex-1 items-center gap-2 min-w-[240px]">
        {user.roleName !== "Applicant" && (
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-text-soft hover:bg-bg-muted hover:text-text-theme lg:hidden cursor-pointer"
            aria-label="Toggle Navigation Drawer"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}
        {user.roleName !== "Applicant" && (
          <div className="relative w-full max-w-sm">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-soft">
              <Search className="h-4.5 w-4.5" />
            </span>
            <input
              type="text"
              placeholder={t("applicants.searchPlaceholder")}
              className="w-full rounded-xl border border-border-theme bg-bg py-2.5 pl-10 pr-4 text-sm md:text-[15px] outline-none transition-all focus:border-primary-theme focus:bg-surface focus:ring-2 focus:ring-primary-theme/20 text-text-theme"
            />
          </div>
        )}
      </div>

      {/* Action Badges & Demo Switcher */}
      <div className="flex flex-wrap items-center gap-3 md:gap-4 justify-end">
        {/* Branch Selector */}
        {user.activeCompanyId && user.branches && user.branches.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-xl border border-border-theme bg-surface-soft px-3 py-2 text-[13px] md:text-sm font-semibold text-text-theme shadow-sm">
            <span className="text-text-soft whitespace-nowrap">{locale === "bn" ? "বর্তমান শাখা:" : "Branch:"}</span>
            {canSwitch ? (
              <select
                value={activeBranchId || "all"}
                onChange={(e) => setActiveBranchId(e.target.value === "all" ? "all" : e.target.value)}
                className="border-none bg-transparent font-bold text-text-theme outline-none cursor-pointer text-[13px] md:text-sm"
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
              <span className="font-bold text-primary-theme">
                {activeBranch?.name || user.branches[0]?.name || "Head Office"}
              </span>
            )}
          </div>
        )}

        {/* Mock Demo Role Switcher Warning Card */}
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-950/40 dark:bg-amber-950/20 px-3.5 py-2 text-[13px] md:text-sm font-semibold text-amber-800 dark:text-amber-400">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-505 bg-amber-500"></span>
          </span>
          <span className="hidden sm:inline whitespace-nowrap">{t("auth.complianceNotice")}:</span>
          <select
            value={user.id}
            onChange={handleRoleChange}
            className="border-none bg-transparent font-bold text-amber-950 dark:text-amber-300 outline-none cursor-pointer text-[13px] md:text-sm"
          >
            {allUsers.map((u) => (
              <option key={u.id} value={u.id} className="text-text-theme bg-surface">
                {u.fullName} ({t(`roles.${u.roleName}`) || u.roleName})
              </option>
            ))}
          </select>
        </div>

        {/* Action Widgets group */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Notifications Icon with Badge */}
          <div
            onClick={() => router.push("/notifications")}
            className="relative cursor-pointer rounded-lg p-2 text-text-soft hover:bg-bg-muted hover:text-text-theme"
          >
            <Bell className="h-5.5 w-5.5" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                {unreadNotifications.length}
              </span>
            )}
          </div>

          {/* Language Toggle Pill */}
          <LanguageToggle />

          {/* Theme Toggle Switcher */}
          <ThemeToggle />

          {/* User Account Settings Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-bg-muted"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary-theme shrink-0">
                <UserIcon className="h-4.5 w-4.5" />
              </div>
              <div className="hidden flex-col items-start text-left md:flex max-w-[120px]">
                <span className="text-sm font-semibold text-text-theme leading-tight truncate w-full">
                  {user.fullName}
                </span>
                <span className="mt-0.5 text-xs text-text-soft font-semibold truncate w-full">
                  {t(`roles.${user.roleName}`) || user.roleName}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-text-soft shrink-0" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border-theme bg-surface py-1.5 shadow-lg z-30">
                <div className="px-4 py-2 border-b border-border-theme">
                  <p className="text-xs text-text-soft">{locale === "bn" ? "সাইন-ইন করা আছে" : "Signed in as"}</p>
                  <p className="text-sm font-semibold text-text-theme truncate mt-0.5">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push("/notifications");
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text-muted hover:bg-bg-muted"
                >
                  <Bell className="h-4 w-4" /> {t("nav.notifications")}
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push("/account/security");
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text-muted hover:bg-bg-muted"
                >
                  <Lock className="h-4 w-4" /> {locale === "bn" ? "অ্যাকাউন্ট সিকিউরিটি" : "Account Security"}
                </button>
                <button
                  onClick={handleLogoutClick}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold text-danger-theme hover:bg-danger-soft"
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
