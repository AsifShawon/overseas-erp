"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useMockAuth } from "@/context/MockAuthContext";
import {
  Bell, Mail, Smartphone, Shield, Loader2,
  CheckCircle, AlertCircle, CreditCard, FileText, Workflow, Zap,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushSubscribed,
} from "@/lib/client/web-push-client";

interface Preferences {
  emailEnabled: boolean;
  pushEnabled:  boolean;
  inAppEnabled: boolean;
  categories: {
    account?:   boolean;
    workflow?:  boolean;
    documents?: boolean;
    payments?:  boolean;
    tasks?:     boolean;
    commissions?: boolean;
  } | null;
}

const DEFAULT_PREFS: Preferences = {
  emailEnabled: true,
  pushEnabled:  true,
  inAppEnabled: true,
  categories: {
    account:     true,
    workflow:    true,
    documents:   true,
    payments:    true,
    tasks:       true,
    commissions: true,
  },
};

export default function NotificationSettingsPage() {
  const { accessToken } = useMockAuth();
  const toast = useToast();

  const [prefs, setPrefs]         = useState<Preferences>(DEFAULT_PREFS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]   = useState(false);
  const [pushStatus, setPushStatus] = useState<"unknown" | "subscribed" | "unsubscribed" | "unsupported">("unknown");
  const [vapidKey, setVapidKey]   = useState<string | null>(null);
  const [pushLoading, setPushLoading] = useState(false);

  // Load preferences
  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/notifications/preferences", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setPrefs({
          emailEnabled: data.emailEnabled ?? true,
          pushEnabled:  data.pushEnabled  ?? true,
          inAppEnabled: data.inAppEnabled ?? true,
          categories:   data.categories   ?? DEFAULT_PREFS.categories,
        });
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  // Check push status
  useEffect(() => {
    if (!("Notification" in window)) { setPushStatus("unsupported"); return; }
    isPushSubscribed().then((sub) => setPushStatus(sub ? "subscribed" : "unsubscribed"));

    // Get VAPID key
    fetch("/api/notifications/web-push/public-key")
      .then((r) => r.json())
      .then((d) => { if (d.publicKey) setVapidKey(d.publicKey); })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!accessToken) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error("Failed to save preferences");
      toast.success("Notification preferences saved.");
    } catch (e: any) {
      toast.error(e.message || "Failed to save preferences.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnablePush = async () => {
    if (!vapidKey || !accessToken) {
      toast.error("Web push is not configured on this server.");
      return;
    }
    setPushLoading(true);
    const result = await subscribeToPushNotifications(vapidKey, accessToken);
    setPushLoading(false);
    if (result.success) {
      setPushStatus("subscribed");
      toast.success("Browser notifications enabled!");
    } else {
      toast.error(result.error || "Failed to enable push notifications.");
    }
  };

  const handleDisablePush = async () => {
    if (!accessToken) return;
    setPushLoading(true);
    const result = await unsubscribeFromPushNotifications(accessToken);
    setPushLoading(false);
    if (result.success) {
      setPushStatus("unsubscribed");
      toast.success("Browser notifications disabled.");
    } else {
      toast.error(result.error || "Failed to disable push notifications.");
    }
  };

  const handleTestPush = async () => {
    if (!accessToken) return;
    const res = await fetch("/api/notifications/web-push/test", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (res.ok) toast.success("Test push sent!");
    else toast.error(data.error || "Test push failed.");
  };

  const toggleCategory = (key: string) => {
    setPrefs((p) => ({
      ...p,
      categories: { ...(p.categories ?? {}), [key]: !(p.categories as any)?.[key] },
    }));
  };

  const CATEGORIES = [
    { key: "account",     label: "Account & Security",    icon: <Shield className="h-4 w-4" />,    critical: true },
    { key: "workflow",    label: "Applicant Workflow",     icon: <Workflow className="h-4 w-4" />,  critical: false },
    { key: "documents",   label: "Document Verification",  icon: <FileText className="h-4 w-4" />, critical: false },
    { key: "payments",    label: "Payments & Invoices",    icon: <CreditCard className="h-4 w-4" />, critical: false },
    { key: "tasks",       label: "Tasks & Due Reminders",  icon: <Bell className="h-4 w-4" />,      critical: false },
    { key: "commissions", label: "Commissions",            icon: <Zap className="h-4 w-4" />,       critical: false },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Settings"
        description="Control how and when you receive notifications."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings",  href: "/settings/users" },
          { label: "Notifications" },
        ]}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Channel Settings */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-500" /> Notification Channels
            </h3>

            {[
              { key: "inAppEnabled", label: "In-App Notifications", desc: "Always enabled — shown in notification center", icon: <Bell className="h-4 w-4" />, locked: true },
              { key: "emailEnabled", label: "Email Notifications",  desc: "Sent via SMTP for important events",            icon: <Mail className="h-4 w-4" />, locked: false },
              { key: "pushEnabled",  label: "Browser Push",         desc: "Delivered via web push when you are online",   icon: <Smartphone className="h-4 w-4" />, locked: false },
            ].map((ch) => (
              <div key={ch.key} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-slate-100 p-2 text-slate-500 dark:bg-slate-800">
                    {ch.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{ch.label}</p>
                    <p className="text-xs text-slate-500">{ch.desc}</p>
                  </div>
                </div>
                <button
                  disabled={ch.locked}
                  onClick={() => !ch.locked && setPrefs((p) => ({ ...p, [ch.key]: !(p as any)[ch.key] }))}
                  className={`relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none ${
                    (prefs as any)[ch.key] ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
                  } ${ch.locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    (prefs as any)[ch.key] ? "left-5.5 translate-x-0.5" : "left-0.5"
                  }`} />
                </button>
              </div>
            ))}
          </div>

          {/* Browser Push Control */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-indigo-500" /> Browser Push Notifications
            </h3>

            {pushStatus === "unsupported" ? (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-xs text-amber-700">
                <AlertCircle className="h-4 w-4 inline mr-1.5" />
                Your browser does not support push notifications. In-app and email notifications are still available.
              </div>
            ) : (
              <div className="space-y-3">
                <div className={`rounded-lg p-4 border flex items-center gap-3 ${
                  pushStatus === "subscribed"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}>
                  {pushStatus === "subscribed"
                    ? <CheckCircle className="h-5 w-5 shrink-0" />
                    : <Bell className="h-5 w-5 shrink-0" />}
                  <div>
                    <p className="text-sm font-semibold">
                      {pushStatus === "subscribed" ? "Browser notifications active" : "Browser notifications inactive"}
                    </p>
                    <p className="text-xs">
                      {pushStatus === "subscribed"
                        ? "You will receive push alerts in this browser."
                        : "Click Enable to get browser notifications."}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {pushStatus === "subscribed" ? (
                    <>
                      <button
                        onClick={handleDisablePush}
                        disabled={pushLoading}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-60"
                      >
                        {pushLoading ? <Loader2 className="h-4 w-4 animate-spin inline" /> : "Disable"}
                      </button>
                      <button
                        onClick={handleTestPush}
                        className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-all cursor-pointer"
                      >
                        Send Test
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEnablePush}
                      disabled={pushLoading || !vapidKey}
                      className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-all cursor-pointer disabled:opacity-60"
                    >
                      {pushLoading ? <Loader2 className="h-4 w-4 animate-spin inline" /> : "Enable Browser Notifications"}
                    </button>
                  )}
                </div>

                {!vapidKey && (
                  <p className="text-[10px] text-slate-400">
                    VAPID keys not configured on server. Contact your platform admin.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 space-y-4 lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-500" /> Notification Categories
            </h3>
            <p className="text-xs text-slate-500">
              Critical security and account notifications are always sent regardless of these settings.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => {
                const enabled = cat.critical ? true : !!(prefs.categories as any)?.[cat.key];
                return (
                  <div
                    key={cat.key}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      enabled ? "border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/20" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`rounded-full p-1.5 ${enabled ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"}`}>
                        {cat.icon}
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-white">{cat.label}</span>
                    </div>
                    {cat.critical ? (
                      <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">ALWAYS</span>
                    ) : (
                      <button
                        onClick={() => toggleCategory(cat.key)}
                        className={`relative h-5 w-9 rounded-full transition-colors duration-200 cursor-pointer ${
                          enabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      >
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                          enabled ? "translate-x-4" : "translate-x-0.5"
                        }`} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Save button */}
      {!isLoading && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-all cursor-pointer shadow-sm disabled:opacity-60 flex items-center gap-2"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Preferences
          </button>
        </div>
      )}
    </div>
  );
}
