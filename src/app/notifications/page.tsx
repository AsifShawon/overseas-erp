"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useMockAuth } from "@/context/MockAuthContext";
import { Bell, BellOff, CheckCircle, AlertTriangle, Plus, Loader2 } from "lucide-react";
import { ErrorState } from "@/components/ui/ErrorState";
import { useToast } from "@/context/ToastContext";

export default function NotificationsPage() {
  const { user, accessToken } = useMockAuth();
  const toast = useToast();
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    channelStatus: "Healthy",
  });

  const fetchNotifications = useCallback(async (showLoader = true) => {
    if (!accessToken) return;
    if (showLoader) setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/notifications?pageSize=100", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to fetch notifications (${response.status})`);
      }
      const result = await response.json();
      setNotificationsList(result.data || []);
      if (result.stats) {
        setStats(result.stats);
      } else {
        const unreadCount = (result.data || []).filter((n: any) => !n.isRead).length;
        setStats({
          total: result.meta?.total || (result.data || []).length,
          unread: unreadCount,
          channelStatus: "Healthy",
        });
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while loading notifications.");
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [accessToken]);

  // Initial load
  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notId: string) => {
    if (!accessToken) return;
    
    // Optimistic UI update
    setNotificationsList((prev) =>
      prev.map((n) => (n.id === notId ? { ...n, isRead: true } : n))
    );
    setStats((prev) => ({
      ...prev,
      unread: Math.max(0, prev.unread - 1),
    }));

    try {
      const response = await fetch(`/api/notifications/${notId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to mark notification as read.");
      }
      // Sync background state
      fetchNotifications(false);
    } catch (err: any) {
      console.error("Mark as read API failure:", err);
      // Revert/refetch on failure
      fetchNotifications(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!accessToken) return;

    // Optimistic UI update
    setNotificationsList((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setStats((prev) => ({
      ...prev,
      unread: 0,
    }));

    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to mark all notifications as read.");
      }
      // Sync background state
      fetchNotifications(false);
    } catch (err: any) {
      console.error("Mark all as read API failure:", err);
      fetchNotifications(false);
    }
  };

  const handleSimulateAlert = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to simulate system alert.");
      }
      const newNot = await response.json();
      
      // Update local state instantly
      setNotificationsList((prev) => [newNot, ...prev]);
      setStats((prev) => ({
        ...prev,
        total: prev.total + 1,
        unread: prev.unread + 1,
      }));
    } catch (err: any) {
      console.error("Simulate alert API failure:", err);
      toast.error(err.message || "Failed to simulate system alert. Ensure you are in development mode.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications & Alerts"
        description="Emigration events system feed. Track embassy stamps, payment ledgers, and passport expiration alerts."
        breadcrumbs={[{ label: "ERP Hub", href: "/dashboard" }, { label: "Notifications" }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateAlert}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200 shadow-sm transition-all duration-250 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Simulate System Alert
            </button>
            {notificationsList.length > 0 && stats.unread > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition-all duration-250 cursor-pointer"
              >
                <CheckCircle className="h-4 w-4 text-emerald-600" /> Mark All Read
              </button>
            )}
          </div>
        }
      />

      {/* Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Inbox Notifications"
          value={stats.total}
          description="Regulatory log alerts logged"
          iconName="Bell"
        />
        <StatCard
          title="Awaiting Read Vetting"
          value={`${stats.unread} Unread`}
          description="Urgent operations alerts pending review"
          iconName="MailOpen"
          trend={{ value: stats.unread > 0 ? String(stats.unread) : "0", isPositive: false }}
        />
        <StatCard
          title="Notification Channel Status"
          value={stats.channelStatus}
          description="Emigration SMTP feeds live"
          iconName="ShieldCheck"
        />
      </div>

      {/* Notifications List Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Bell className="h-4.5 w-4.5 text-indigo-500 animate-bounce" /> Regulatory Alert Feed
        </h3>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
              Syncing Alerts Feed...
            </p>
          </div>
        ) : error ? (
          <ErrorState
            title="Inbox Sync Error"
            description={error}
            iconName="AlertCircle"
          />
        ) : notificationsList.length === 0 ? (
          <div className="text-center py-16 space-y-3 animate-in fade-in duration-300">
            <BellOff className="h-10 w-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Emigration Alert Inbox Empty</h4>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Your session active role has zero pending operations warning files. Try clicking &quot;Simulate System Alert&quot; above to fire a live database event.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in duration-300">
            {notificationsList.map((not) => (
              <div
                key={not.id}
                className={`py-4 flex gap-4 items-start transition-all duration-200 ${
                  !not.isRead ? "bg-slate-50/50 dark:bg-slate-900/10 px-3 rounded-lg border-l-4 border-indigo-600" : "px-3"
                }`}
              >
                <div className={`rounded-full p-2 shrink-0 ${!not.isRead ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-400"}`}>
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {not.title} {!not.isRead && <span className="h-2 w-2 rounded-full bg-indigo-600"></span>}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {new Date(not.createdAt).toLocaleDateString()} {new Date(not.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-normal">{not.message}</p>
                  {!not.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(not.id)}
                      className="mt-2 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-1 cursor-pointer transition-colors duration-150"
                    >
                      <CheckCircle className="h-3.5 w-3.5" /> Mark as Vetted & Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
