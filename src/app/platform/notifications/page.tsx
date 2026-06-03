"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useMockAuth } from "@/context/MockAuthContext";
import {
  Bell, CheckCircle, AlertCircle, Loader2, Shield, RefreshCw,
  ExternalLink, Clock, Building2,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function PlatformNotificationsPage() {
  const { accessToken } = useMockAuth();
  const toast = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, unread: 0 });

  const fetch_ = useCallback(async (showLoader = true) => {
    if (!accessToken) return;
    if (showLoader) setIsLoading(true);
    try {
      const res = await fetch("/api/platform/notifications?pageSize=100", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to load platform notifications");
      }
      const result = await res.json();
      setNotifications(result.data || []);
      setStats({ total: result.meta?.total || 0, unread: result.stats?.unread || 0 });
    } catch (e: any) {
      setError(e.message);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { fetch_(true); }, [fetch_]);

  const handleMarkRead = async (id: string) => {
    if (!accessToken) return;
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setStats((s) => ({ ...s, unread: Math.max(0, s.unread - 1) }));
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH", headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(() => {});
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Notifications"
        description="System alerts, company applications, and infrastructure events."
        breadcrumbs={[
          { label: "Platform Admin", href: "/platform" },
          { label: "Notifications" },
        ]}
        actions={
          <button
            onClick={() => fetch_(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <p className="text-xs text-slate-500">Total Platform Alerts</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <p className="text-xs text-slate-500">Unread</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.unread}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-2 px-8">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Shield className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-bold text-slate-600">No platform notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex gap-4 items-start p-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all ${
                  !n.isRead ? "border-l-4 border-indigo-600 bg-indigo-50/20" : ""
                }`}
              >
                <div className={`shrink-0 rounded-full p-2 ${!n.isRead ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"}`}>
                  {n.type.includes("COMPANY") ? <Building2 className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {n.title}
                      {!n.isRead && <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-600 ml-1.5 align-middle" />}
                    </h4>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />{timeAgo(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{n.message}</p>
                  <div className="flex gap-3 pt-1">
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Mark Read
                      </button>
                    )}
                    {n.actionUrl && (
                      <a href={n.actionUrl} className="text-[10px] font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1">
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
