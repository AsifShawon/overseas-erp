"use client";

import React, { useState } from "react";
import { MockAuthProvider, useMockAuth } from "@/context/MockAuthContext";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

function InnerAppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useMockAuth();

  // If user is Applicant, render a centered, mobile-responsive layout without sidebars
  if (user.roleName === "Applicant") {
    return (
      <div className="min-h-screen bg-bg text-text-theme flex flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
          <div className="mx-auto max-w-5xl w-full">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text-theme flex">
      {/* Sidebar Navigation */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* Main Layout Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? "pl-16" : "pl-64"
        }`}
      >
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl w-full space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <MockAuthProvider>
      <InnerAppShell>{children}</InnerAppShell>
    </MockAuthProvider>
  );
}
export default AppShell;
