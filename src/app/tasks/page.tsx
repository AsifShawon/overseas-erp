"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useMockAuth } from "@/context/MockAuthContext";
import {
  CheckCircle, Clock, AlertTriangle, Plus, Loader2,
  Filter, Calendar, User, ChevronRight, AlertCircle,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueAt?: string;
  assignedToId?: string;
  applicantId?: string;
  companyId: string;
  createdAt: string;
  applicant?: { fullName: string; passportNumber: string };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:     "bg-amber-50 text-amber-700 border-amber-200",
  IN_PROGRESS: "bg-indigo-50 text-indigo-700 border-indigo-200",
  COMPLETED:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED:   "bg-slate-100 text-slate-500 border-slate-200",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW:      "text-slate-400",
  NORMAL:   "text-indigo-500",
  HIGH:     "text-amber-500",
  CRITICAL: "text-red-500",
};

function isDueSoon(dueAt?: string): boolean {
  if (!dueAt) return false;
  const diff = new Date(dueAt).getTime() - Date.now();
  return diff > 0 && diff < 24 * 3600 * 1000; // within 24h
}

function isOverdue(dueAt?: string): boolean {
  if (!dueAt) return false;
  return new Date(dueAt).getTime() < Date.now();
}

export default function TasksPage() {
  const { accessToken } = useMockAuth();
  const toast = useToast();

  const [tasks, setTasks]             = useState<Task[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [showCreate, setShowCreate]   = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [myTasksOnly, setMyTasksOnly] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    title: "", description: "", priority: "NORMAL", dueAt: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  const fetchTasks = useCallback(async (showLoader = true) => {
    if (!accessToken) return;
    if (showLoader) setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (myTasksOnly)  params.set("myTasks", "true");
      const res = await fetch(`/api/tasks?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const result = await res.json();
      setTasks(result.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [accessToken, statusFilter, myTasksOnly]);

  useEffect(() => { fetchTasks(true); }, [fetchTasks]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !form.title.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ ...form, dueAt: form.dueAt || undefined }),
      });
      if (!res.ok) throw new Error("Failed to create task");
      const task = await res.json();
      setTasks((prev) => [task, ...prev]);
      setForm({ title: "", description: "", priority: "NORMAL", dueAt: "" });
      setShowCreate(false);
      toast.success("Task created successfully.");
    } catch (e: any) {
      toast.error(e.message || "Failed to create task.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    if (!accessToken) return;
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ status }),
      });
      fetchTasks(false);
    } catch { fetchTasks(false); }
  };

  const pendingCount   = tasks.filter((t) => t.status === "PENDING").length;
  const overdueCount   = tasks.filter((t) => isOverdue(t.dueAt) && t.status !== "COMPLETED").length;
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks & Reminders"
        description="Track assignments, deadlines, and workflow follow-ups."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Tasks" }]}
        actions={
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-950 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> New Task
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pending",   value: pendingCount,   color: "text-amber-600" },
          { label: "Overdue",   value: overdueCount,   color: "text-red-600" },
          { label: "Completed", value: completedCount, color: "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Create Task Form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/20 p-6 space-y-4"
        >
          <h3 className="text-sm font-bold text-indigo-800 dark:text-indigo-200">Create New Task</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Title *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Follow up on visa application"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Additional context..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {["LOW", "NORMAL", "HIGH", "CRITICAL"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
              <input
                type="date"
                value={form.dueAt}
                onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isCreating}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2"
            >
              {isCreating && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Create Task
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-slate-200 bg-white px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={myTasksOnly}
            onChange={(e) => setMyTasksOnly(e.target.checked)}
            className="rounded"
          />
          My Tasks Only
        </label>
      </div>

      {/* Task List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-16 text-center px-8 space-y-2">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center py-20 space-y-3">
            <CheckCircle className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-bold text-slate-600">No tasks found</p>
            <p className="text-xs text-slate-400">Create a new task using the button above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {tasks.map((task) => {
              const overdue  = isOverdue(task.dueAt) && task.status !== "COMPLETED";
              const dueSoon  = isDueSoon(task.dueAt);
              return (
                <div
                  key={task.id}
                  className={`p-4 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all ${
                    overdue ? "border-l-4 border-red-500" : dueSoon ? "border-l-4 border-amber-500" : ""
                  }`}
                >
                  {/* Status Icon */}
                  <div className="shrink-0 mt-0.5">
                    {task.status === "COMPLETED" ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    ) : overdue ? (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-indigo-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{task.title}</h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[9px] font-bold uppercase tracking-wide ${PRIORITY_COLORS[task.priority]}`}>
                          {task.priority}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${STATUS_COLORS[task.status] || ""}`}>
                          {task.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                    {task.description && (
                      <p className="text-xs text-slate-500">{task.description}</p>
                    )}
                    <div className="flex items-center flex-wrap gap-3 pt-1">
                      {task.dueAt && (
                        <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                          overdue ? "text-red-600" : dueSoon ? "text-amber-600" : "text-slate-500"
                        }`}>
                          <Calendar className="h-3 w-3" />
                          {overdue ? "Overdue: " : "Due: "}{new Date(task.dueAt).toLocaleDateString()}
                        </span>
                      )}
                      {task.applicant && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <User className="h-3 w-3" />{task.applicant.fullName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  {task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
                    <div className="shrink-0">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white cursor-pointer"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Complete</option>
                        <option value="CANCELLED">Cancel</option>
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
