"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useMockAuth } from "@/context/MockAuthContext";
import { MOCK_NOTIFICATIONS, MockNotification } from "@/lib/mockData";
import { Bell, BellOff, CheckCircle, AlertTriangle, Plus } from "lucide-react";

export default function NotificationsPage() {
  const { user } = useMockAuth();

  // Load and scope notifications for this specific mock user session
  const userNotifications = MOCK_NOTIFICATIONS.filter((n) => n.userId === user.id);

  const [notificationsList, setNotificationsList] = useState<MockNotification[]>(userNotifications);

  const handleMarkAsRead = (notId: string) => {
    const updated = notificationsList.map((n) => {
      if (n.id === notId) {
        return { ...n, isRead: true };
      }
      return n;
    });
    setNotificationsList(updated);
  };

  const handleMarkAllAsRead = () => {
    const updated = notificationsList.map((n) => ({ ...n, isRead: true }));
    setNotificationsList(updated);
  };

  const handleClearAll = () => {
    setNotificationsList([]);
  };

  const handleSimulateAlert = () => {
    const newNot: MockNotification = {
      id: `not-sim-${Date.now()}`,
      userId: user.id,
      title: "Consulate Clearance Completed",
      message: `System audited candidate passport dossier. Emigration certificate issued successfully at ${new Date().toLocaleTimeString()}.`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotificationsList([newNot, ...notificationsList]);
  };

  const unreadCount = notificationsList.filter((n) => !n.isRead).length;

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
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Simulate System Alert
            </button>
            {notificationsList.length > 0 && (
              <>
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  <CheckCircle className="h-4 w-4 text-emerald-600" /> Mark All Read
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  <BellOff className="h-4 w-4 text-rose-600" /> Clear Inbox
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Inbox Notifications"
          value={notificationsList.length}
          description="Regulatory log alerts logged"
          iconName="Bell"
        />
        <StatCard
          title="Awaiting Read Vetting"
          value={`${unreadCount} Unread`}
          description="Urgent operations alerts pending review"
          iconName="MailOpen"
          trend={{ value: "2", isPositive: false }}
        />
        <StatCard
          title="Notification Channel Status"
          value="Healthy"
          description="Emigration SMTP feeds live"
          iconName="ShieldCheck"
        />
      </div>

      {/* Notifications List Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Bell className="h-4.5 w-4.5 text-indigo-500 animate-bounce" /> Regulatory Alert Feed
        </h3>

        {notificationsList.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <BellOff className="h-10 w-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Emigration Alert Inbox Empty</h4>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Your session active role has zero pending operations warning files. Try clicking &quot;Simulate System Alert&quot; above to fire a demo event.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notificationsList.map((not) => (
              <div
                key={not.id}
                className={`py-4 flex gap-4 items-start transition-colors duration-200 ${
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
                      className="mt-2 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-1"
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
