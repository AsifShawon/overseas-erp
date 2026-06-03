"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useMockAuth } from "@/context/MockAuthContext";
import {
  Bell, BellOff, CheckCircle, AlertTriangle, Loader2,
  RefreshCw, ExternalLink, Clock, Filter, Info,
  AlertCircle, Zap, Shield, CreditCard, FileText, Workflow,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

type Priority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
type FilterTab = "all" | "unread" | "high_priority" | "payments" | "documents" | "workflow" | "tasks" | "platform";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: Priority;
  isRead: boolean;
  actionUrl?: string;
  relatedModel?: string;
  createdAt: string;
  dueAt?: string;
  companyId?: string;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  LOW:      "text-slate-400",
  NORMAL:   "text-indigo-500",
  HIGH:     "text-amber-500",
  CRITICAL: "text-red-500",
};

const PRIORITY_BG: Record<Priority, string> = {
  LOW:      "bg-slate-100 text-slate-600",
  NORMAL:   "bg-indigo-50 text-indigo-700",
  HIGH:     "bg-amber-50 text-amber-700",
  CRITICAL: "bg-red-50 text-red-700",
};

function getTypeIcon(type: string) {
  if (type.startsWith("INVOICE") || type.startsWith("PAYMENT") || type.startsWith("RECEIPT"))
    return <CreditCard className="h-4 w-4" />;
  if (type.startsWith("DOCUMENT"))
    return <FileText className="h-4 w-4" />;
  if (type.startsWith("APPLICANT") || type.startsWith("TASK"))
    return <Workflow className="h-4 w-4" />;
  if (type.startsWith("PLATFORM"))
    return <Shield className="h-4 w-4" />;
  if (type.startsWith("COMMISSION"))
    return <Zap className="h-4 w-4" />;
  if (type === "PASSWORD_CHANGED" || type === "ACCOUNT_ACTIVATION")
    return <Shield className="h-4 w-4" />;
  return <Bell className="h-4 w-4" />;
}

function timeAgo(dateStr: string): string {
  const d    = new Date(dateStr);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsPage() {
  const { accessToken, user } = useMockAuth();
  const toast = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [stats, setStats] = useState({ total: 0, unread: 0 });

  const fetchNotifications = useCallback(async (showLoader = true) => {
    if (!accessToken) return;
    if (showLoader) setIsLoading(true);
    setError(null);
    try {
      const url = user?.isPlatformAdmin
        ? "/api/notifications?pageSize=100"
        : "/api/notifications?pageSize=100";

      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const result = await res.json();
      setNotifications(result.data || []);
      setStats({ total: result.meta?.total || 0, unread: result.stats?.unread || 0 });
    } catch (e: any) {
      setError(e.message);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [accessToken, user]);

  useEffect(() => { fetchNotifications(true); }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    if (!accessToken) return;
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setStats((s) => ({ ...s, unread: Math.max(0, s.unread - 1) }));
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH", headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch { fetchNotifications(false); }
  };

  const handleMarkAllRead = async () => {
    if (!accessToken) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setStats((s) => ({ ...s, unread: 0 }));
    try {
      await fetch("/api/notifications/mark-all-read", {
        method: "POST", headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch { fetchNotifications(false); }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "all")           return true;
    if (activeFilter === "unread")        return !n.isRead;
    if (activeFilter === "high_priority") return n.priority === "HIGH" || n.priority === "CRITICAL";
    if (activeFilter === "payments")      return n.type.startsWith("INVOICE") || n.type.startsWith("PAYMENT") || n.type.startsWith("RECEIPT");
    if (activeFilter === "documents")     return n.type.startsWith("DOCUMENT") || n.type.includes("DOCUMENT");
    if (activeFilter === "workflow")      return n.type.startsWith("APPLICANT");
    if (activeFilter === "tasks")         return n.type.startsWith("TASK") || n.type.includes("DUE") || n.type.includes("OVERDUE");
    if (activeFilter === "platform")      return n.type.startsWith("PLATFORM") || n.companyId === null;
    return true;
  });

  const TABS: { key: FilterTab; label: string }[] = [
    { key: "all",           label: "All" },
    { key: "unread",        label: `Unread${stats.unread > 0 ? ` (${stats.unread})` : ""}` },
    { key: "high_priority", label: "Priority" },
    { key: "payments",      label: "Payments" },
    { key: "documents",     label: "Documents" },
    { key: "workflow",      label: "Workflow" },
    { key: "tasks",         label: "Tasks & Due" },
    ...(user?.isPlatformAdmin ? [{ key: "platform" as FilterTab, label: "Platform" }] : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Center"
        description="All alerts, reminders, and system messages in one place."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Notifications" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchNotifications(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition-all cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
            {stats.unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-all cursor-pointer shadow-sm"
              >
                <CheckCircle className="h-3.5 w-3.5" /> Mark All Read
              </button>
            )}
          </div>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-slate-800 dark:text-white" },
          { label: "Unread", value: stats.unread, color: "text-indigo-600" },
          { label: "High Priority", value: notifications.filter((n) => n.priority === "HIGH" || n.priority === "CRITICAL").length, color: "text-amber-600" },
          { label: "Due Reminders", value: notifications.filter((n) => n.type.includes("DUE") || n.type.includes("OVERDUE")).length, color: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === tab.key
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-2 text-center px-8">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm font-semibold text-red-600">{error}</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <BellOff className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No notifications in this filter</p>
            <p className="text-xs text-slate-400 max-w-xs text-center">
              Try switching to a different tab or wait for new events.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredNotifications.map((n) => (
              <div
                key={n.id}
                className={`flex gap-4 items-start p-4 transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-900/40 ${
                  !n.isRead ? "border-l-4 border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/10" : ""
                }`}
              >
                {/* Icon */}
                <div className={`shrink-0 rounded-full p-2 ${!n.isRead ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}>
                  {getTypeIcon(n.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {n.title}
                        {!n.isRead && <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-600 ml-1.5 align-middle" />}
                      </h4>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${PRIORITY_BG[n.priority]}`}>
                        {n.priority}
                      </span>
                    </div>
                    <span className="shrink-0 text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />{timeAgo(n.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{n.message}</p>

                  {n.dueAt && (
                    <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3" />Due: {new Date(n.dueAt).toLocaleDateString()}
                    </p>
                  )}

                  <div className="flex items-center gap-3 pt-1">
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Mark Read
                      </button>
                    )}
                    {n.actionUrl && (
                      <a
                        href={n.actionUrl}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> View
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
