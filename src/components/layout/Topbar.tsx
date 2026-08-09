"use client";

import React, { useEffect, useRef, useState } from "react";
import { useMockAuth } from "@/context/MockAuthContext";
import {
  Bell,
  LogOut,
  ChevronDown,
  Lock,
  Menu,
  Building2,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { MOCK_NOTIFICATIONS } from "@/lib/mockData";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "@/components/language/LanguageToggle";
import { SearchInput } from "@/components/ui/SearchInput";
import { useT } from "@/i18n/useT";

interface TopbarProps {
  onMenuClick?: () => void;
}

/** Branch shape as exposed on the authenticated user by MockAuthContext. */
interface UserBranch {
  id: string;
  name: string;
  code: string;
}

/** Closes a popover on outside click and on Escape. */
function useDismissable(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return ref;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const {
    user,
    allUsers,
    switchRole,
    logout,
    activeBranchId,
    setActiveBranchId,
  } = useMockAuth();
  const router = useRouter();
  const { t, locale } = useT();

  const [profileOpen, setProfileOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const profileRef = useDismissable(profileOpen, () => setProfileOpen(false));
  const branchRef = useDismissable(branchOpen, () => setBranchOpen(false));

  const isApplicant = user.roleName === "Applicant";
  const branches: UserBranch[] = user.branches || [];
  const activeBranch = branches.find((b) => b.id === activeBranchId);
  const canViewAllBranches = user.permissions?.includes("VIEW_ALL_BRANCH_DATA");
  const canSwitch = canViewAllBranches || branches.length > 1;

  const unreadNotifications = MOCK_NOTIFICATIONS.filter(
    (n) => n.userId === user.id && !n.isRead
  );

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    switchRole(e.target.value);
    const selectedUser = allUsers.find((u) => u.id === e.target.value);
    router.push(
      selectedUser?.roleName === "Applicant" ? "/applicant/portal" : "/dashboard"
    );
  };

  const handleLogoutClick = () => {
    logout();
    router.push("/login");
  };

  const branchLabel = activeBranch
    ? activeBranch.name
    : activeBranchId === "all" || !activeBranchId
      ? locale === "bn"
        ? "সব শাখা"
        : "All Branches"
      : branches[0]?.name || "Head Office";

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full shrink-0 items-center justify-between gap-3 border-b border-border-theme bg-surface px-4 md:px-6">
      {/* ---------- Left: mobile trigger + global search ---------- */}
      <div className="flex min-w-0 flex-1 items-center gap-3 md:max-w-sm">
        {!isApplicant && (
          <button
            type="button"
            onClick={onMenuClick}
            className="shrink-0 rounded-md p-1.5 text-text-soft transition-colors hover:bg-bg-muted hover:text-text-theme lg:hidden cursor-pointer"
            aria-label={locale === "bn" ? "নেভিগেশন খুলুন" : "Toggle navigation"}
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        {!isApplicant && (
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={t("applicants.searchPlaceholder")}
            ariaLabel={locale === "bn" ? "গ্লোবাল সার্চ" : "Global search"}
            className="hidden sm:block"
          />
        )}
      </div>

      {/* ---------- Right: workspace, controls, profile ---------- */}
      <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
        {/* Branch workspace selector */}
        {user.activeCompanyId && branches.length > 0 && (
          <div ref={branchRef} className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => canSwitch && setBranchOpen((o) => !o)}
              disabled={!canSwitch}
              aria-haspopup={canSwitch ? "menu" : undefined}
              aria-expanded={canSwitch ? branchOpen : undefined}
              className={`flex h-9 max-w-52 items-center gap-2 rounded-md border border-border-theme bg-surface px-2.5 text-xs font-medium text-text-theme transition-colors ${
                canSwitch ? "hover:bg-bg-muted cursor-pointer" : ""
              }`}
            >
              <Building2 className="h-3.5 w-3.5 shrink-0 text-primary-theme" />
              <span className="truncate">{branchLabel}</span>
              {canSwitch && (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-text-soft" />
              )}
            </button>

            {branchOpen && canSwitch && (
              <div
                role="menu"
                className="app-popover-enter absolute right-0 z-30 mt-1.5 w-60 overflow-hidden rounded-md border border-border-theme bg-surface-elevated py-1 shadow-md"
              >
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-text-soft">
                  {locale === "bn" ? "কর্মক্ষেত্র" : "Workspace"}
                </p>
                {canViewAllBranches && (
                  <BranchOption
                    label={locale === "bn" ? "সব শাখা" : "All Branches"}
                    selected={activeBranchId === "all" || !activeBranchId}
                    onSelect={() => {
                      setActiveBranchId("all");
                      setBranchOpen(false);
                    }}
                  />
                )}
                {branches.map((b) => (
                  <BranchOption
                    key={b.id}
                    label={b.name}
                    hint={b.code}
                    selected={activeBranchId === b.id}
                    onSelect={() => {
                      setActiveBranchId(b.id);
                      setBranchOpen(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Demo role switcher — retained: it drives the real switchRole() flow */}
        <div className="hidden items-center gap-1.5 rounded-md border border-warning-theme/30 bg-warning-soft px-2 py-1.5 md:flex">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning-theme"
          />
          <label htmlFor="demo-role" className="sr-only">
            {locale === "bn" ? "ডেমো ভূমিকা পরিবর্তন" : "Switch demo role"}
          </label>
          <select
            id="demo-role"
            value={user.id}
            onChange={handleRoleChange}
            className="max-w-36 truncate border-none bg-transparent p-0 text-xs font-semibold text-warning-theme outline-none cursor-pointer lg:max-w-44"
          >
            {allUsers.map((u) => (
              <option key={u.id} value={u.id} className="bg-surface text-text-theme">
                {u.fullName} ({t(`roles.${u.roleName}`) || u.roleName})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => router.push("/notifications")}
          className="relative rounded-md p-2 text-text-soft transition-colors hover:bg-bg-muted hover:text-text-theme cursor-pointer"
          aria-label={`${t("nav.notifications")}${
            unreadNotifications.length > 0
              ? ` (${unreadNotifications.length})`
              : ""
          }`}
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadNotifications.length > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger-theme ring-2 ring-surface" />
          )}
        </button>

        <LanguageToggle />
        <ThemeToggle />

        {/* Profile */}
        <div ref={profileRef} className="relative ml-0.5">
          <button
            type="button"
            onClick={() => setProfileOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            className="flex items-center gap-2 rounded-md p-1 transition-colors hover:bg-bg-muted cursor-pointer"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-soft text-[11px] font-semibold uppercase text-primary-theme">
              {user.fullName.substring(0, 2)}
            </span>
            <span className="hidden max-w-28 flex-col items-start text-left md:flex">
              <span className="w-full truncate text-xs font-semibold leading-tight text-text-theme">
                {user.fullName}
              </span>
              <span className="w-full truncate text-[11px] leading-tight text-text-soft">
                {t(`roles.${user.roleName}`) || user.roleName}
              </span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-text-soft" />
          </button>

          {profileOpen && (
            <div
              role="menu"
              className="app-popover-enter absolute right-0 z-30 mt-1.5 w-56 overflow-hidden rounded-md border border-border-theme bg-surface-elevated py-1 shadow-md"
            >
              <div className="border-b border-border-theme px-3 py-2">
                <p className="text-[11px] text-text-soft">
                  {locale === "bn" ? "সাইন-ইন করা আছে" : "Signed in as"}
                </p>
                <p className="mt-0.5 truncate text-xs font-semibold text-text-theme">
                  {user.email}
                </p>
              </div>
              <MenuButton
                icon={Bell}
                label={t("nav.notifications")}
                onClick={() => {
                  setProfileOpen(false);
                  router.push("/notifications");
                }}
              />
              <MenuButton
                icon={Lock}
                label={locale === "bn" ? "অ্যাকাউন্ট সিকিউরিটি" : "Account Security"}
                onClick={() => {
                  setProfileOpen(false);
                  router.push("/account/security");
                }}
              />
              <div className="my-1 border-t border-border-theme" />
              <MenuButton
                icon={LogOut}
                label={locale === "bn" ? "লগ আউট" : "Log Out"}
                onClick={handleLogoutClick}
                danger
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function BranchOption({
  label,
  hint,
  selected,
  onSelect,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      onClick={onSelect}
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-bg-muted cursor-pointer"
    >
      <Check
        className={`h-3.5 w-3.5 shrink-0 text-primary-theme ${
          selected ? "opacity-100" : "opacity-0"
        }`}
      />
      <span className="min-w-0 flex-1 truncate font-medium text-text-theme">
        {label}
      </span>
      {hint && (
        <span className="shrink-0 font-mono text-[10px] text-text-soft">{hint}</span>
      )}
    </button>
  );
}

function MenuButton({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition-colors cursor-pointer ${
        danger
          ? "text-danger-theme hover:bg-danger-soft"
          : "text-text-muted hover:bg-bg-muted hover:text-text-theme"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  );
}

export default Topbar;
