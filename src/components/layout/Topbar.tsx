"use client";

import React, { useState } from "react";
import { useMockAuth } from "@/context/MockAuthContext";
import { Bell, Search, LogOut, ChevronDown, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { MOCK_NOTIFICATIONS } from "@/lib/mockData";

export function Topbar() {
  const { user, allUsers, switchRole, logout } = useMockAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      {/* Search Input Widget */}
      <div className="flex flex-1 items-center max-w-md">
        {user.roleName !== "Applicant" && (
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search applicants by passport or name (Ctrl + K)..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-10 pr-4 text-xs outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900"
            />
          </div>
        )}
      </div>

      {/* Action Badges & Demo Switcher */}
      <div className="flex items-center gap-4">
        {/* Mock Demo Role Switcher Warning Card */}
        <div className="hidden items-center gap-1.5 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-1 text-[10px] font-semibold text-amber-800 md:flex dark:border-amber-950/20 dark:bg-amber-950/10 dark:text-amber-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
          </span>
          <span>DEMO MODE:</span>
          <select
            value={user.id}
            onChange={handleRoleChange}
            className="border-none bg-transparent font-bold text-amber-950 outline-none cursor-pointer dark:text-amber-300"
          >
            {allUsers.map((u) => (
              <option key={u.id} value={u.id} className="text-slate-800 bg-white">
                {u.fullName} ({u.roleName})
              </option>
            ))}
          </select>
        </div>

        {/* Notifications Icon with Badge */}
        <div className="relative cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900">
          <Bell className="h-5 w-5" />
          {unreadNotifications.length > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white">
              {unreadNotifications.length}
            </span>
          )}
        </div>

        {/* User Account Settings Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="hidden flex-col items-start text-left md:flex">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">
                {user.fullName}
              </span>
              <span className="mt-0.5 text-[9px] text-slate-400 font-medium">
                {user.roleName}
              </span>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-950">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-900">
                <p className="text-[10px] text-slate-400">Signed in as</p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{user.email}</p>
              </div>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  router.push("/notifications");
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900"
              >
                <Bell className="h-3.5 w-3.5" /> Notifications
              </button>
              <button
                onClick={handleLogoutClick}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
              >
                <LogOut className="h-3.5 w-3.5" /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
