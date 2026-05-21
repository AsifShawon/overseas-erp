"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { MockAuthProvider } from "@/context/MockAuthContext";
import { AppShell } from "@/components/layout/AppShell";

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Route paths that do NOT use the AppShell frame (e.g. login)
  const isAuthRoute = pathname === "/login" || pathname === "/";

  if (isAuthRoute) {
    return (
      <MockAuthProvider>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col justify-center">
          {children}
        </div>
      </MockAuthProvider>
    );
  }

  // Wrap all other pages inside the unified dynamic AppShell
  return <AppShell>{children}</AppShell>;
}
export default ClientLayoutWrapper;
