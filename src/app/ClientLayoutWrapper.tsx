"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { MockAuthProvider } from "@/context/MockAuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { DialogProvider } from "@/context/DialogContext";

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Route paths that do NOT use the AppShell frame (e.g. login)
  const isAuthRoute = pathname === "/login" || pathname === "/";

  const renderContent = () => {
    if (isAuthRoute) {
      return (
        <MockAuthProvider>
          <div className="min-h-screen bg-bg text-text-theme flex flex-col justify-center transition-colors duration-200">
            {children}
          </div>
        </MockAuthProvider>
      );
    }

    // Wrap all other pages inside the unified dynamic AppShell
    return <AppShell>{children}</AppShell>;
  };

  return (
    <ThemeProvider>
      <ToastProvider>
        <DialogProvider>
          {renderContent()}
        </DialogProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default ClientLayoutWrapper;
